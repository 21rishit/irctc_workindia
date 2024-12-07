// Prevented RACE CONDITIONS during seat booking

/*
Implemented row-level locking and transactions to ensure only one user can reserve available seats at any given time.
When multiple users attempt concurrent bookings, the system ensures only one user succeeds while others are informed about unavailability.
*/

const db = require("../Config/database");
const Train = require("../models/train");
const Booking = require("../models/booking");

exports.reserveSeat = async (req, res, next) => {
  const dbConnection = await db.getConnection();
  await dbConnection.beginTransaction();

  try {
    const { trainId, seatsRequested } = req.body;
    const currentUserId = req.user.userId;

    // Validate train existence and lock the row
    const [trainRecord] = await dbConnection.query(
      "SELECT * FROM trains WHERE id = ? FOR UPDATE",
      [trainId]
    );
    if (!trainRecord[0]) {
      return res.status(404).json({ message: "Train not found." });
    }

    // Check seat availability
    if (trainRecord[0].available_seats < seatsRequested) {
      await dbConnection.rollback();
      return res.status(400).json({ message: "Insufficient seats available." });
    }

    // Proceed to create a booking record
    const bookingData = new Booking({
      trainId,
      userId: currentUserId,
      seatCount: seatsRequested,
    });
    const newBookingId = await Booking.create(bookingData, dbConnection);

    // Update the train's seat availability
    const updatedSeatCount = trainRecord[0].available_seats - seatsRequested;
    await dbConnection.query(
      "UPDATE trains SET available_seats = ? WHERE id = ?",
      [updatedSeatCount, trainId]
    );

    await dbConnection.commit();
    res.status(201).json({ bookingId: newBookingId });
  } catch (error) {
    await dbConnection.rollback();
    next(error);
  } finally {
    dbConnection.release();
  }
};

exports.fetchBookingDetails = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.userId;
    const { trainId } = req.query;

    // Retrieve booking details for the logged-in user and specified train
    const bookingInfo = await Booking.findByUserIdAndTrainId(
      loggedInUserId,
      trainId
    );
    if (!bookingInfo) {
      return res.status(404).json({ message: "No booking found for this train." });
    }

    res.status(200).json(bookingInfo);
  } catch (error) {
    next(error);
  }
};
