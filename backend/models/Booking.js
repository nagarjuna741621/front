// backend/models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // References the User model
        ref: 'User',
        required: true
    },
    car: {
        type: mongoose.Schema.Types.ObjectId, // References the Car model
        ref: 'Car',
        required: true
    },
    pickupDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    status: { // e.g., 'pending', 'confirmed', 'completed', 'cancelled'
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: { // e.g., 'unpaid', 'paid'
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },
    bookedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', BookingSchema);