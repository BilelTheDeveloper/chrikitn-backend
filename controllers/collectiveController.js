const Collective = require('../models/Collective');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.initiateCollective = async (req, res) => {
  try {
    const { name, slogan, description, memberIds, services } = req.body; 
    
    if (req.user.role !== 'Freelancer') {
      return res.status(403).json({ success: false, msg: "Only Freelancers can found a Syndicate." });
    }

    if (!req.files || !req.files.logo || !req.files.background) {
      return res.status(400).json({ 
        success: false, 
        msg: "Mission Assets Missing: Both Logo and Hero Background are required." 
      });
    }

    const existing = await Collective.findOne({ name });
    if (existing) return res.status(400).json({ success: false, msg: "This Collective name is already active." });

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

    const newCollective = new Collective({
      name,
      slogan,
      description,
      logo: req.files.logo[0].path, 
      heroBackground: req.files.background[0].path, 
      owner: req.user._id, 
      members: membersList,
      services: parsedServices,
      status: 'Assembling'
    });

    await newCollective.save();

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

    collective.members[memberIndex].status = 'Accepted'; 

    const allAccepted = collective.members.every(member => member.status === 'Accepted');
    
    if (allAccepted) {
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

exports.deployCollective = async (req, res) => {
  try {
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

    if (collective.status !== 'Awaiting Admin') {
      return res.status(400).json({ 
        success: false, 
        msg: "Deployment Failed: Members must all accept before admin verification." 
      });
    }

    collective.status = 'Active';
    collective.isDeployed = true;
    collective.deployedAt = Date.now();

    await collective.save();

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

exports.deleteCollective = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, msg: "Unauthorized: Admin access required." });
    }

    const collective = await Collective.findById(req.params.id);
    if (!collective) {
      return res.status(404).json({ success: false, msg: "Syndicate not found." });
    }

    await Collective.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      msg: `Syndicate "${collective.name}" has been terminated and purged from the database.` 
    });

  } catch (err) {
    console.error("DELETE_COLLECTIVE_ERROR:", err);
    res.status(500).json({ success: false, msg: "Termination Protocol Failure." });
  }
};

exports.getAllCollectives = async (req, res) => {
  try {
    const collectives = await Collective.find({ status: 'Active' })
      .populate('owner', 'name identityImage speciality')
      // ✅ ADDED: Populate nested member users for the main feed
      .populate({
        path: 'members.user',
        select: 'name identityImage speciality portfolioUrl'
      })
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
      .populate('members.user', 'name identityImage speciality portfolioUrl'); 

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