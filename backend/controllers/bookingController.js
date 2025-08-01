// backend/controllers/bookingController.js
const Booking = require('../models/Booking'); // Import Booking model
const Car = require('../models/Car'); // Import Car model (needed to check availability/price)
const User = require('../models/User'); // Import User model (optional, for validation/populating)

// Helper to calculate total price
const calculateTotalPrice = (pickupDate, returnDate, pricePerDay) => {
    const diffTime = Math.abs(new Date(returnDate) - new Date(pickupDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * pricePerDay;
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User)
exports.createBooking = async (req, res) => {
    const { carId, pickupDate, returnDate } = req.body;
    const userId = req.user.id; // Get user ID from authenticated token

    try {
        // 1. Validate dates
        const pDate = new Date(pickupDate);
        const rDate = new Date(returnDate);

        if (isNaN(pDate) || isNaN(rDate) || pDate >= rDate) {
            return res.status(400).json({ msg: 'Invalid pickup or return dates' });
        }
        if (pDate < new Date()) {
            return res.status(400).json({ msg: 'Pickup date cannot be in the past' });
        }

        // 2. Check if car exists and is available
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ msg: 'Car not found' });
        }
        if (!car.isAvailable) {
            return res.status(400).json({ msg: 'Car is not available for booking' });
        }

        // 3. Check for booking conflicts (simplified - full logic would check existing bookings)
        // For a production app, you'd query the Booking model to ensure no overlap for this car.
        // For now, we assume car.isAvailable is sufficient.

        // 4. Calculate total price
        const totalPrice = calculateTotalPrice(pDate, rDate, car.rentalPricePerDay);
        if (totalPrice <= 0) {
             return res.status(400).json({ msg: 'Calculated total price is invalid. Check dates or car price.' });
        }

        // 5. Create new booking
        const newBooking = new Booking({
            user: userId,
            car: carId,
            pickupDate: pDate,
            returnDate: rDate,
            totalPrice,
            status: 'under-processing', // Default status
            paymentStatus: 'unpaid' // Default payment status
        });

        const booking = await newBooking.save();

        // Optional: Mark car as unavailable (or manage availability more granularly later)
        // await Car.findByIdAndUpdate(carId, { isAvailable: false }); // Careful with this for real bookings

        res.status(201).json(booking);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Car ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Get all bookings for the logged-in user
// @route   GET /api/bookings/user
// @access  Private (User)
exports.getUserBookings = async (req, res) => {
    try {
        // Find bookings associated with the authenticated user's ID
        const bookings = await Booking.find({ user: req.user.id })
                                      .populate('car', ['make', 'model', 'licensePlate']) // Populate car details
                                      .sort({ bookedAt: -1 }); // Sort by newest first
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get a single booking by ID (Admin or booking owner)
// @route   GET /api/bookings/:id
// @access  Private (User/Admin)
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
                                      .populate('user', ['username', 'email'])
                                      .populate('car', ['make', 'model', 'licensePlate', 'rentalPricePerDay']);

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Check if user is admin OR the owner of the booking
        if (req.user.role === 'admin' || booking.user.toString() === req.user.id) {
            return res.json(booking);
        } else {
            return res.status(403).json({ msg: 'Access denied' });
        }

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Booking ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Update booking status (Admin only)
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin)
exports.updateBookingStatus = async (req, res) => {
    const { status } = req.body; // New status from request body

    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Optional: Add logic to ensure status transitions are valid (e.g., cannot go from 'completed' to 'pending')
        booking.status = status;
        await booking.save();

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Booking ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Update booking payment status (Admin only)
// @route   PUT /api/bookings/:id/payment
// @access  Private (Admin)
exports.updateBookingPaymentStatus = async (req, res) => {
    const { paymentStatus } = req.body;

    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        booking.paymentStatus = paymentStatus;
        await booking.save();

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Booking ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Cancel/Delete a booking (Admin or booking owner)
// @route   DELETE /api/bookings/:id
// @access  Private (User/Admin)
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Check if user is admin OR the owner of the booking
        if (req.user.role === 'admin' || booking.user.toString() === req.user.id) {
            await Booking.findByIdAndDelete(req.params.id);
            res.json({ msg: 'Booking removed' });
        } else {
            return res.status(403).json({ msg: 'Access denied' });
        }

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Booking ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private (Admin)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
                                      .populate('user', ['username', 'email']) // Populate user details
                                      .populate('car', ['make', 'model', 'licensePlate']) // Populate car details
                                      .sort({ bookedAt: -1 }); // Sort by newest first
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};