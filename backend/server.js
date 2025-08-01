// backend/server.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes'); // <-- NEW LINE

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Basic Route ---
app.get('/', (req, res) => {
    res.send('Car Rental API is running...');
});

// --- Use Auth Routes ---
app.use('/api/auth', authRoutes);

// --- Use Car Routes ---
app.use('/api/cars', carRoutes);

// --- Use Booking Routes ---  <-- NEW SECTION
app.use('/api/bookings', bookingRoutes); // <-- NEW LINE

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});