const User = require('../models/User');
const VipPost = require('../models/VipPost');
const Collective = require('../models/Collective'); // Added for collective management

// @desc    Get All Main Dashboard Stats
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $facet: {
          // 1. User Status Counts
          userCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          // 2. Role Breakdown
          roleBreakdown: [
            { $group: { _id: "$role", count: { $sum: 1 } } }
          ],
          // 3. Verification Pulse
          verificationStats: [
            { $group: { _id: "$isVerified", count: { $sum: 1 } } }
          ],
          // 4. Growth Data (Last 6 Months)
          growthData: [
            {
              $match: {
                createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
              }
            },
            {
              $group: {
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
          ]
        }
      }
    ]);

    // Get VIP Post Stats
    const vipStats = await VipPost.aggregate([
      {
        $group: {
          _id: "$verified",
          count: { $sum: 1 }
        }
      }
    ]);

    // Added: Collective Stats (Count awaiting approval)
    const collectiveStats = await Collective.countDocuments({ status: 'Awaiting Admin' });

    res.status(200).json({
      success: true,
      data: {
        users: stats[0],
        vipPosts: vipStats,
        pendingCollectives: collectiveStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all collectives waiting for Admin Deployment
// @route   GET /api/admin/pending-collectives
// @access  Private/Admin
exports.getPendingCollectives = async (req, res) => {
  try {
    const pending = await Collective.find({ status: 'Awaiting Admin' })
      .populate('owner', 'name email speciality')
      .populate('members.user', 'name speciality')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pending.length,
      data: pending
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Final Deployment of a Collective (The "Web-Inside-Web" Switch)
// @route   PUT /api/admin/deploy-collective/:id
// @access  Private/Admin
exports.deployCollective = async (req, res) => {
  try {
    const collective = await Collective.findById(req.params.id);

    if (!collective) {
      return res.status(404).json({ success: false, msg: "Syndicate not found" });
    }

    // Update to Active and set Deployed flag
    collective.status = 'Active';
    collective.isDeployed = true;
    collective.deployedAt = Date.now();

    await collective.save();

    res.status(200).json({
      success: true,
      msg: `Collective "${collective.name}" has been officially deployed to the Matrix.`,
      data: collective
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};