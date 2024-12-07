// Addressed RACE CONDITIONS during seat reservation

/*
Utilized database transactions and row-level locks to prevent simultaneous modifications to seat availability.
This ensures that only one user can successfully complete a booking while others receive an appropriate unavailability message.
*/

const db = require("../Config/database");
const Train = require("../models/train");
const Booking = require("../models/booking");

exports.reserveSeats = async (req, res, next) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { trainId, seatCount } = req.body;
    const userId = req.user.userId;

    // Validate train existence with row-level locking
    const [trainData] = await connection.query(
      "SELECT * FROM trains WHERE id = ? FOR UPDATE",
      [trainId]
    );
    if (!trainData[0]) {
      return res.status(404).json({ error: "Train not found." });
    }

    // Ensure sufficient seat availability
    if (trainData[0].available_seats < seatCount) {
      await connection.rollback();
      return res.status(400).json({ error: "Not enough seats available." });
    }

    // Record the booking
    const bookingDetails = new Booking({
      trainId,
      userId,
      seatCount,
    });
    const bookingId = await Booking.create(bookingDetails, connection);

    // Update available seat count in the train record
    const remainingSeats = trainData[0].available_seats - seatCount;
    await connection.query(
      "UPDATE trains SET available_seats = ? WHERE id = ?",
      [remainingSeats, trainId]
    );

    await connection.commit();
    res.status(201).json({ bookingId });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

exports.getBookingInfo = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { trainId } = req.query;

    // Retrieve booking details for the user and specific train
    const booking = await Booking.findByUserIdAndTrainId(userId, trainId);
    if (!booking) {
      return res.status(404).json({ error: "No booking found for this train." });
    }

    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};
