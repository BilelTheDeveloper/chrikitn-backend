const Request = require('../models/Request');
const Connection = require('../models/Connection');
const Post = require('../models/Post');
const Notification = require('../models/Notification'); // ✅ ADDED: Required to trigger the alert

// @desc    1. INITIATE MISSION (Brand sends request)
// @route   POST /api/requests/initiate
exports.initiateRequest = async (req, res) => {
    try {
        const { receiverId, postId, missionGoal, missionDetails } = req.body;
        const senderId = req.user.id; 

        // 🔍 DEBUG LOG: Remove this after testing
        console.log("DATA RECEIVED:", { senderId, receiverId, postId, missionGoal });

        // 1. Validation check
        if (!receiverId || !postId || !missionGoal || !missionDetails) {
            return res.status(400).json({ 
                success: false, 
                msg: "Incomplete Briefing: Missing required operational parameters." 
            });
        }

        // 2. Prevent self-requests
        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({ success: false, msg: "Internal loop detected: Cannot request yourself." });
        }

        // 3. Check for existing pending requests
        const existingRequest = await Request.findOne({
            sender: senderId,
            receiver: receiverId,
            relatedPost: postId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ success: false, msg: "Transmission already in progress for this operative." });
        }

        // 4. Create the Request
        const newRequest = await Request.create({
            sender: senderId,
            receiver: receiverId,
            relatedPost: postId,
            globalMissionObjective: missionGoal, 
            missionDetails: missionDetails,      
            senderAccept: true, 
            status: 'pending'
        });

        // ✅ 5. CREATE NOTIFICATION (This makes it appear in the Comms Center)
        await Notification.create({
            recipient: receiverId,
            sender: senderId,
            type: 'MISSION_REQUEST', 
            title: 'New Mission Briefing',
            message: missionGoal, 
            metadata: {
                requestId: newRequest._id, // ✅ SYNCED: For the frontend Accept button
                missionId: newRequest._id, // ✅ LEGACY: Keeping missionId for safety
                postId: postId
            },
            ctaStatus: 'Pending'
        });

        res.status(201).json({ 
            success: true, 
            msg: "Mission brief transmitted and signal dispatched.",
            data: newRequest 
        });

    } catch (err) {
        console.error('INITIATE_REQUEST_ERROR:', err);
        res.status(500).json({ success: false, msg: "Transmission failure." });
    }
};

// @desc    2. FETCH INCOMING (For Freelancer Notifications)
// @route   GET /api/requests/incoming
exports.getIncomingRequests = async (req, res) => {
    try {
        const requests = await Request.find({ 
            receiver: req.user.id, 
            status: 'pending' 
        })
        .populate('sender', 'name identityImage role')
        .populate('relatedPost', 'title intelImage brandName globalService')
        .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Failed to fetch incoming signals." });
    }
};

// @desc    3. PROCESS HANDSHAKE (Accept or Reject)
// @route   PATCH /api/requests/:id/respond
exports.respondToRequest = async (req, res) => {
    try {
        const { action } = req.body; 
        const requestId = req.params.id;

        const request = await Request.findById(requestId);

        if (!request) return res.status(404).json({ msg: "Request record not found." });

        if (request.receiver.toString() !== req.user.id) {
            return res.status(401).json({ msg: "Unauthorized protocol access." });
        }

        // ✅ CLEANUP: Remove the notification alert using either ID field in metadata
        await Notification.findOneAndDelete({
            $or: [
                { 'metadata.requestId': requestId },
                { 'metadata.missionId': requestId }
            ]
        });

        if (action === 'reject') {
            await Request.findByIdAndDelete(requestId);
            return res.json({ success: true, msg: "Mission declined and intelligence destroyed." });
        }

        if (action === 'accept') {
            const chatRoomId = `room_${requestId}_${Math.random().toString(36).substring(7)}`;

            const connection = await Connection.create({
                participants: [request.sender, request.receiver],
                requestId: request._id,
                chatRoomId: chatRoomId,
                status: 'negotiating'
            });

            await Request.findByIdAndDelete(requestId);

            return res.json({ 
                success: true, 
                msg: "Protocol Accepted. Secure Line Established. Request Purged.",
                connection 
            });
        }

    } catch (err) {
        console.error('RESPOND_REQUEST_ERROR:', err);
        res.status(500).json({ success: false, msg: "Protocol update failure." });
    }
};