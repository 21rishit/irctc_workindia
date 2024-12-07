const User = require("../models/user");

exports.fetchUserDetails = async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;

    // Retrieve the user record based on ID
    const userRecord = await User.findById(currentUserId);
    if(!userRecord) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(userRecord);
  } catch (error) {
    next(error);
  }
};
