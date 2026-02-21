const Collective = require('../models/Collective');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.initiateCollective = async (req, res) => {
  try {
    const { name, slogan, description, memberIds } = req.body;
    
    // 1. Role Verification (Strict Protocol)
    // Your middleware attaches the user to req.user
    if (req.user.role !== 'Freelancer') {
      return res.status(403).json({ msg: "Only Freelancers can found a Syndicate." });
    }

    // 2. Asset Check (Logo and Background from Cloudinary)
    if (!req.files || !req.files.logo || !req.files.background) {
      return res.status(400).json({ msg: "Brand Logo and Hero Visual are required." });
    }

    // 3. Unique Identity Check
    const existing = await Collective.findOne({ name });
    if (existing) return res.status(400).json({ msg: "This Collective name is already active." });

    // 4. Parse Members (Coming as a JSON string from Frontend FormData)
    const parsedIds = JSON.parse(memberIds);
    const membersList = parsedIds.map(id => ({
      user: id,
      status: 'Pending'
    }));

    // 5. Build Collective Record
    const newCollective = new Collective({
      name,
      slogan,
      description,
      logo: req.files.logo[0].path, // Cloudinary URL provided by Multer-Storage-Cloudinary
      heroBackground: req.files.background[0].path, // Cloudinary URL
      owner: req.user._id, // ✅ FIXED: Changed .id to ._id to match your User Model
      members: membersList,
      status: 'Assembling'
    });

    await newCollective.save();

    // 6. PHASE 2: Recruitment Handshake (Send Notifications)
    // We create a notification for every invited member
    const invitations = parsedIds.map(targetId => ({
      recipient: targetId,
      sender: req.user._id, // ✅ FIXED: Changed .id to ._id
      type: 'COLLECTIVE_INVITE',
      title: 'Syndicate Recruitment',
      message: `${req.user.name} wants you to join the "${name}" Collective.`,
      metadata: { 
        collectiveId: newCollective._id 
      }
    }));

    // Insert all notifications at once for speed
    if (invitations.length > 0) {
      await Notification.insertMany(invitations);
    }

    res.status(201).json({ 
      success: true, 
      msg: "Collective Initiated. Recruitment notifications dispatched.",
      collective: newCollective 
    });

  } catch (err) {
    console.error("COLLECTIVE_INITIATION_ERROR:", err);
    res.status(500).json({ 
      success: false, 
      msg: "System failure during initiation.",
      error: err.message 
    });
  }
};

/**
 * ✅ NEW: ACCEPT SYNDICATE INVITATION
 * Logic: Updates Collective member status and closes the notification CTA.
 */
exports.acceptInvitation = async (req, res) => {
  try {
    const { notificationId } = req.body;

    // 1. Locate the Syndicate
    const collective = await Collective.findById(req.params.id);
    if (!collective) {
      return res.status(404).json({ success: false, msg: "Syndicate not found" });
    }

    // 2. Identify the member in the draft list
    const memberIndex = collective.members.findIndex(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(403).json({ success: false, msg: "Authorization Failure: You are not drafted for this syndicate." });
    }

    // 3. Update Status to 'Joined'
    collective.members[memberIndex].status = 'Joined';
    await collective.save();

    // 4. Finalize Notification (Mark CTA as Completed)
    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { 
        ctaStatus: 'Completed',
        isRead: true 
      });
    }

    res.json({ 
      success: true, 
      msg: "Syndicate Handshake Confirmed. Welcome to the team.",
      collective 
    });

  } catch (err) {
    console.error("ACCEPT_INVITE_CRITICAL_ERROR:", err);
    res.status(500).json({ success: false, msg: "Internal Handshake Failure" });
  }
};