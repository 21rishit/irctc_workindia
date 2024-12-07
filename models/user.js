const db = require("../Config/database");

const User = function (data) {
  this.name = data.name;
  this.email = data.email;
  this.password = data.password;
  this.role = data.role || "user"; // Default role is 'user' if not provided
};

// Register a new user in the database
User.register = async (userDetails) => {
  const sqlQuery =
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
  const params = [userDetails.name, userDetails.email, userDetails.password, userDetails.role];

  try {
    const [response] = await db.query(sqlQuery, params);
    return response.insertId; // Return the inserted user's ID
  } catch (error) {
    throw error;
  }
};

// Find a user by their email
User.getUserByEmail = async (email) => {
  const sqlQuery = "SELECT * FROM users WHERE email = ?";

  try {
    const [userRecord] = await db.query(sqlQuery, [email]);
    return userRecord[0] || null; // Return the user or null if not found
  } catch (error) {
    throw error;
  }
};

module.exports = User;
