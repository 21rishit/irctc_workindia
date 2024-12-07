const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Book a seat
router.post('/', auth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { train_id, booking_date } = req.body;
        const user_id = req.user.id;

        // Check available seats with lock
        const [trainSeats] = await connection.query(
            `SELECT t.*, 
            (t.total_seats - COALESCE(COUNT(b.id), 0)) as available_seats
            FROM trains t
            LEFT JOIN bookings b ON t.id = b.train_id 
            AND b.booking_date = ? AND b.status = 'confirmed'
            WHERE t.id = ?
            GROUP BY t.id
            FOR UPDATE`,
            [booking_date, train_id]
        );

        if (!trainSeats[0] || trainSeats[0].available_seats <= 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'No seats available' });
        }

        // Calculate next available seat number
        const [existingBookings] = await connection.query(
            'SELECT MAX(seat_number) as last_seat FROM bookings WHERE train_id = ? AND booking_date = ?',
            [train_id, booking_date]
        );

        const nextSeatNumber = (existingBookings[0].last_seat || 0) + 1;

        // Create booking
        const [booking] = await connection.query(
            'INSERT INTO bookings (user_id, train_id, booking_date, seat_number) VALUES (?, ?, ?, ?)',
            [user_id, train_id, booking_date, nextSeatNumber]
        );

        await connection.commit();
        res.status(201).json({ 
            message: 'Booking successful',
            booking_id: booking.insertId,
            seat_number: nextSeatNumber
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
});

// Get specific booking details
router.get('/:id', auth, async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT b.*, t.train_number, t.train_name, 
            t.source_station, t.destination_station
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            WHERE b.id = ? AND b.user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(bookings[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 