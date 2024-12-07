const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

// Function to handle user registration
exports.registerUser = async (req, res, next) => {
  try {
    const {name,email,password,role } = req.body;

    // Validate if user already exists in the system
    const existingAccount = await User.findByEmail(email);
    if (existingAccount) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // Encrypt the user's password for security
    const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(password, saltRounds);

    // Save the user in the database
    const user = new User({ name, email, password: encryptedPassword, role });
    const savedUserId = await User.create(user);

    return res.status(201).json({ userId: savedUserId });
  } catch (error) {
    next(error);
  }
};

// Function to handle user login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Look up the user in the database
    const userRecord = await User.findByEmail(email);
    if (!userRecord) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Verify the provided password matches the stored hashed password
    const isPasswordCorrect = await bcrypt.compare(password, userRecord.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate a JSON Web Token (JWT) for the user
    const authToken = jwt.sign(
      { userId: userRecord.id, role: userRecord.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ token: authToken });
  } catch (error) {
    next(error);
  }
};
