const User = require('../models/User');

// Use 'exports.name' to match the destructuring in the route file
exports.searchOperatives = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const results = await User.find({
      role: 'Freelancer',
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name identityImage speciality') 
    .limit(5);

    res.json(results);
  } catch (err) {
    console.error("SEARCH_SYSTEM_FAILURE:", err);
    res.status(500).json({ msg: "Search Engine Error" });
  }
};