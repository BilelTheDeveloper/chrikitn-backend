const Collective = require('../models/Collective');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.initiateCollective = async (req, res) => {
  try {
    const { name, slogan, description, memberIds } = req.body;
    
    // 1. Role Verification (Strict Protocol)
    if (req.user.role !== 'Freelancer') {
      return res.status(403).json({ msg: "Only Freelancers can found a Syndicate." });
    }

    // 2. Asset Check
    if (!req.files || !req.files.logo || !req.files.background) {
      return res.status(400).json({ msg: "Brand Logo and Hero Visual are required." });
    }

    // 3. Unique Identity Check
    const existing = await Collective.findOne({ name });
    if (existing) return res.status(400).json({ msg: "This Collective name is already active." });

    // 4. Parse Members
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
      logo: req.files.logo[0].path, 
      heroBackground: req.files.background[0].path, 
      owner: req.user._id, 
      members: membersList,
      status: 'Assembling'
    });

    await newCollective.save();

    // 6. PHASE 2: Recruitment Handshake
    const invitations = parsedIds.map(targetId => ({
      recipient: targetId,
      sender: req.user._id, 
      type: 'COLLECTIVE_INVITE',
      title: 'Syndicate Recruitment',
      message: `${req.user.name} wants you to join the "${name}" Collective.`,
      metadata: { 
        collectiveId: newCollective._id 
      }
    }));

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

exports.acceptInvitation = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const collective = await Collective.findById(req.params.id);
    if (!collective) {
      return res.status(404).json({ success: false, msg: "Syndicate not found" });
    }

    const memberIndex = collective.members.findIndex(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(403).json({ success: false, msg: "Authorization Failure: You are not drafted for this syndicate." });
    }

    collective.members[memberIndex].status = 'Joined'; // Note: Changed 'Accepted' to 'Joined' to match your logic
    await collective.save();

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

/**
 * ✅ NEW: GET ALL COLLECTIVES (Kills the 404 Error)
 * @route GET /api/collectives
 */
exports.getAllCollectives = async (req, res) => {
  try {
    // Populate the owner to show who leads the syndicate in the feed
    const collectives = await Collective.find()
      .populate('owner', 'name identityImage speciality')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: collectives.length,
      data: collectives
    });
  } catch (err) {
    console.error("GET_ALL_COLLECTIVES_ERROR:", err);
    res.status(500).json({ success: false, msg: "Failed to fetch syndicate feed." });
  }
};

/**
 * ✅ NEW: GET SINGLE COLLECTIVE
 * @route GET /api/collectives/:id
 */
exports.getCollectiveById = async (req, res) => {
  try {
    const collective = await Collective.findById(req.params.id)
      .populate('owner', 'name identityImage speciality portfolioUrl')
      .populate('members.user', 'name identityImage speciality');

    if (!collective) {
      return res.status(404).json({ success: false, msg: "Syndicate not found." });
    }

    res.status(200).json({
      success: true,
      data: collective
    });
  } catch (err) {
    console.error("GET_COLLECTIVE_ERROR:", err);
    res.status(500).json({ success: false, msg: "Failed to retrieve portal data." });
  }
};