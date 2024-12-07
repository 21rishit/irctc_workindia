const db = require("../Config/database");

const Booking = function (data) {
  this.trainId = data.trainId;
  this.userId = data.userId;
  this.seatCount = data.seatCount;
};

// Created a new booking entry in the database
Booking.add = async (bookingDetails) => {
  const sqlQuery =
    "INSERT INTO bookings (train_id, user_id, seat_count) VALUES (?, ?, ?)";
  const queryParams = [
    bookingDetails.trainId,
    bookingDetails.userId,
    bookingDetails.seatCount,
  ];

  try {
    const [response] = await db.query(sqlQuery, queryParams);
    return response.insertId;
  } catch (error) {
    throw error;
  }
};

// Retrieve a booking based on user ID and train ID
Booking.fetchByUserAndTrain = async (userId, trainId) => {
  const sqlQuery = "SELECT * FROM bookings WHERE user_id = ? AND train_id = ?";

  try {
    const [results] = await db.query(sqlQuery, [userId, trainId]);
    return results[0] || null;
  }catch(error) {
    throw error;
  }
};

module.exports = Booking;
