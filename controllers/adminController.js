const User = require('../models/User');
const VipPost = require('../models/VipPost');

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

    // Get VIP Post Stats from the other collection
    const vipStats = await VipPost.aggregate([
      {
        $group: {
          _id: "$verified",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: stats[0],
        vipPosts: vipStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};