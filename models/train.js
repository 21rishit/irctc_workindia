const db = require("../Config/database");

const Train = function (data) {
  this.name = data.name;
  this.source = data.source;
  this.destination = data.destination;
  this.totalSeats = data.totalSeats;
  this.availableSeats = data.totalSeats; // Initialize available seats to total seats
};

// Add a new train to the database
Train.addTrain = async (trainDetails) => {
  const sqlQuery =
    "INSERT INTO trains (name, source, destination, total_seats, available_seats) VALUES (?, ?, ?, ?, ?)";
  const params = [
    trainDetails.name,
    trainDetails.source,
    trainDetails.destination,
    trainDetails.totalSeats,
    trainDetails.totalSeats,
  ];

  try {
    const [response] = await db.query(sqlQuery, params);
    return response.insertId;
  } catch (error) {
    throw error;
  }
};

// Retrieve trains between a source and destination
Train.getTrainsByRoute = async (source, destination) => {
  const sqlQuery = "SELECT * FROM trains WHERE source = ? AND destination = ?";

  try {
    const [trainList] = await db.query(sqlQuery, [source, destination]);
    return trainList;
  } catch (error) {
    throw error;
  }
};

// Update the number of available seats for a specific train
Train.modifySeatAvailability = async (trainId, seatsRemaining) => {
  const sqlQuery = "UPDATE trains SET available_seats = ? WHERE id = ?";

  try {
    const [result] = await db.query(sqlQuery, [seatsRemaining, trainId]);
    return result.affectedRows > 0; // Return true if rows were updated
  } catch (error) {
    throw error;
  }
};

// Find a train by its unique ID
Train.getTrainById = async (trainId) => {
  const sqlQuery = "SELECT * FROM trains WHERE id = ?";

  try {
    const [trainData] = await db.query(sqlQuery, [trainId]);
    return trainData[0] || null; // Return null if no train is found
  } catch (error) {
    throw error;
  }
};

module.exports = Train;
