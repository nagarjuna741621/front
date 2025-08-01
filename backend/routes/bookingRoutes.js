// backend/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware'); // For user authentication
const authorize = require('../middleware/authorizeMiddleware'); // For role-based authorization

// @route   POST api/bookings
// @desc    Create a new booking (Logged-in user)
// @access  Private (User)
router.post('/', auth, bookingController.createBooking);

// @route   GET api/bookings/user
// @desc    Get all bookings for the logged-in user
// @access  Private (User)
router.get('/user', auth, bookingController.getUserBookings);

// @route   GET api/bookings/:id
// @desc    Get a single booking by ID (Admin or booking owner)
// @access  Private (User/Admin)
router.get('/:id', auth, bookingController.getBookingById);

// @route   PUT api/bookings/:id/status
// @desc    Update booking status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', auth, authorize(['admin']), bookingController.updateBookingStatus);

// @route   PUT api/bookings/:id/payment
// @desc    Update booking payment status (Admin only)
// @access  Private (Admin)
router.put('/:id/payment', auth, authorize(['admin']), bookingController.updateBookingPaymentStatus);

// @route   DELETE api/bookings/:id
// @desc    Cancel/Delete a booking (Admin or booking owner)
// @access  Private (User/Admin)
router.delete('/:id', auth, bookingController.deleteBooking); // This controller will have logic to check user/admin

// @route   GET api/bookings
// @desc    Get all bookings (Admin only)
// @access  Private (Admin)
router.get('/', auth, authorize(['admin']), bookingController.getAllBookings); // IMPORTANT: This must be the last GET /bookings route

module.exports = router;