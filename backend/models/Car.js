// backend/models/Car.js
const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
    make: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 1900, // Cars shouldn't be too old
        max: new Date().getFullYear() + 2 // Cars can be models for next 2 years
    },
    licensePlate: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true // Store in uppercase for consistency
    },
    rentalPricePerDay: {
        type: Number,
        required: true,
        min: 0.01 // Must be a positive price
    },
    carType: { // e.g., Sedan, SUV, Hatchback, Luxury
        type: String,
        required: true,
        trim: true
    },
    fuelType: { // e.g., Petrol, Diesel, Electric
        type: String,
        enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
        required: true
    },
    transmission: { // e.g., Automatic, Manual
        type: String,
        enum: ['Automatic', 'Manual'],
        required: true
    },
    seats: {
        type: Number,
        required: true,
        min: 1
    },
    imageUrl: { // URL to the car's image
        type: String,
        default: 'https://via.placeholder.com/300x200?text=Car+Image' // Placeholder image
    },
    isAvailable: {
        type: Boolean,
        default: true // Car is available for rent by default
    },
    location: { // Where the car is physically located (for pickup/dropoff)
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Car', CarSchema);