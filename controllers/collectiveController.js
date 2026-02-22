const Collective = require('../models/Collective');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.initiateCollective = async (req, res) => {
  try {
    const { name, slogan, description, memberIds, services } = req.body; // ✅ Added services
    
    // 1. Role Verification (Strict Protocol)
    if (req.user.role !== 'Freelancer') {
      return res.status(403).json({ success: false, msg: "Only Freelancers can found a Syndicate." });
    }

    // 2. Asset Check (Safety check)
    if (!req.files || !req.files.logo || !req.files.background) {
      return res.status(400).json({ 
        success: false, 
        msg: "Mission Assets Missing: Both Logo and Hero Background are required." 
      });
    }

    // 3. Unique Identity Check
    const existing = await Collective.findOne({ name });
    if (existing) return res.status(400).json({ success: false, msg: "This Collective name is already active." });

    // 4. Parse Members Safely
    let parsedIds = [];
    if (memberIds) {
      try {
        parsedIds = JSON.parse(memberIds);
      } catch (e) {
        return res.status(400).json({ success: false, msg: "Invalid format for member data." });
      }
    }

    const membersList = parsedIds.map(id => ({
      user: id,
      status: 'Pending'
    }));

    // ✅ NEW: 4.5 Parse and Validate Services
    let parsedServices = [];
    if (services) {
      try {
        parsedServices = JSON.parse(services);
        if (parsedServices.length > 5) {
          return res.status(400).json({ success: false, msg: "Operational Limit Reached: Max 5 services allowed." });
        }
      } catch (e) {
        return res.status(400).json({ success: false, msg: "Invalid format for services data." });
      }
    }

    // 5. Build Collective Record (Using WebP paths from Sharp)
    const newCollective = new Collective({
      name,
      slogan,
      description,
      logo: req.files.logo[0].path, 
      heroBackground: req.files.background[0].path, 
      owner: req.user._id, 
      members: membersList,
      services: parsedServices, // ✅ Added to the record
      status: 'Assembling'
    });

    await newCollective.save();

    // 6. PHASE 2: Recruitment Handshake
    if (parsedIds.length > 0) {
      const invitations = parsedIds.map(targetId => ({
        recipient: targetId,
        sender: req.user._id, 
        type: 'COLLECTIVE_INVITE',
        title: 'Syndicate Recruitment',
        message: `${req.user.name} wants you to join the "${name}" Collective.`,
        metadata: { 
          collectiveId: newCollective._id 
        },
        ctaStatus: 'Pending' 
      }));
      
      const dispatchResult = await Notification.insertMany(invitations);
      console.log(`✅ SYNDICATE SIGNAL: ${dispatchResult.length} notifications dispatched for ${name}`);
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

    // Update member status
    collective.members[memberIndex].status = 'Accepted'; 

    // ✅ UPDATE: Check if ALL members have now accepted
    const allAccepted = collective.members.every(member => member.status === 'Accepted');
    
    if (allAccepted) {
        // If everyone is in, move to the Admin Gate
        collective.status = 'Awaiting Admin';
        console.log(`🚀 Collective "${collective.name}" is now ready for Admin deployment.`);
    }

    await collective.save();

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { 
        ctaStatus: 'Completed',
        isRead: true 
      });
    }

    res.json({ 
      success: true, 
      msg: allAccepted 
        ? "Handshake Confirmed. All members are in! Awaiting Admin deployment." 
        : "Syndicate Handshake Confirmed. Waiting for other members.",
      collective 
    });

  } catch (err) {
    console.error("ACCEPT_INVITE_CRITICAL_ERROR:", err);
    res.status(500).json({ success: false, msg: "Internal Handshake Failure" });
  }
};

// --- NEW UPDATE: ADMIN DEPLOYMENT GATE ---
exports.deployCollective = async (req, res) => {
  try {
    // 1. Admin Verification
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false, 
        msg: "Access Denied: Only Admins can deploy Syndicates." 
      });
    }

    const collective = await Collective.findById(req.params.id);
    if (!collective) {
      return res.status(404).json({ success: false, msg: "Syndicate not found." });
    }

    // 2. State Check
    if (collective.status !== 'Awaiting Admin') {
      return res.status(400).json({ 
        success: false, 
        msg: "Deployment Failed: Members must all accept before admin verification." 
      });
    }

    // 3. Final Deployment Transformation
    collective.status = 'Active';
    collective.isDeployed = true;
    collective.deployedAt = Date.now();

    await collective.save();

    // 4. Notify the Owner that their web-in-web is live
    await Notification.create({
      recipient: collective.owner,
      sender: req.user._id,
      type: 'SYSTEM_ALERT',
      title: 'Syndicate Deployed',
      message: `Your Collective "${collective.name}" has been verified and is now LIVE.`,
      metadata: { collectiveId: collective._id }
    });

    res.json({ 
      success: true, 
      msg: `Protocol Complete: ${collective.name} is now Active and Deployed.`,
      collective 
    });

  } catch (err) {
    console.error("DEPLOY_COLLECTIVE_ERROR:", err);
    res.status(500).json({ success: false, msg: "Deployment Protocol Failure." });
  }
};

exports.getAllCollectives = async (req, res) => {
  try {
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