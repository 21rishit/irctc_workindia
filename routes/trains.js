const express = require('express');
const router = express.Router();
const db = require('./config/database');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Add new train (Admin only)
router.post('/', [auth, adminAuth], async (req, res) => {
    try {
        const { train_number, train_name, source_station, destination_station, total_seats } = req.body;

        const [result] = await db.query(
            'INSERT INTO trains (train_number, train_name, source_station, destination_station, total_seats) VALUES (?, ?, ?, ?, ?)',
            [train_number, train_name, source_station, destination_station, total_seats]
        );

        res.status(201).json({ message: 'Train added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get seat availability
router.get('/availability', auth, async (req, res) => {
    try {
        const { source, destination, date } = req.query;

        // Get trains and calculate available seats
        const [trains] = await db.query(
            `SELECT t.*, 
            (t.total_seats - COALESCE(COUNT(b.id), 0)) as available_seats
            FROM trains t
            LEFT JOIN bookings b ON t.id = b.train_id 
            AND b.booking_date = ? AND b.status = 'confirmed'
            WHERE t.source_station = ? AND t.destination_station = ?
            GROUP BY t.id`,
            [date, source, destination]
        );

        res.json(trains);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 