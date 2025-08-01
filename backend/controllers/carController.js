// backend/controllers/carController.js
const Car = require('../models/Car'); // Import the Car model

// @desc    Add a new car
// @route   POST /api/cars
// @access  Private (Admin)
exports.addCar = async (req, res) => {
    try {
        const newCar = new Car(req.body); // Create new car from request body
        const car = await newCar.save(); // Save to DB
        res.status(201).json(car); // Respond with the created car
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
exports.getAllCars = async (req, res) => {
    try {
        const cars = await Car.find(); // Find all cars
        res.json(cars); // Respond with all cars
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get single car by ID
// @route   GET /api/cars/:id
// @access  Public
exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id); // Find car by ID from URL params

        if (!car) {
            return res.status(404).json({ msg: 'Car not found' });
        }
        res.json(car);
    } catch (err) {
        console.error(err.message);
        // Check for invalid Object ID format
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Car ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Update a car by ID
// @route   PUT /api/cars/:id
// @access  Private (Admin)
exports.updateCar = async (req, res) => {
    try {
        let car = await Car.findById(req.params.id);

        if (!car) {
            return res.status(404).json({ msg: 'Car not found' });
        }

        // Update car properties from req.body
        car = await Car.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // $set updates only the fields provided
            { new: true, runValidators: true } // Return the updated document, run schema validators
        );

        res.json(car);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Car ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a car by ID
// @route   DELETE /api/cars/:id
// @access  Private (Admin)
exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);

        if (!car) {
            return res.status(404).json({ msg: 'Car not found' });
        }

        await Car.findByIdAndDelete(req.params.id); // Delete from DB

        res.json({ msg: 'Car removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Car ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Search for available cars
// @route   GET /api/cars/search
// @access  Public
exports.searchCars = async (req, res) => {
    try {
        const { location, pickupDate, returnDate, carType, minPrice, maxPrice, seats } = req.query;
        let query = { isAvailable: true };

        if (location) {
            query.location = { $regex: new RegExp(location, 'i') }; // Case-insensitive search
        }
        if (carType) {
            query.carType = { $regex: new RegExp(carType, 'i') };
        }
        if (minPrice) {
            query.rentalPricePerDay = { ...query.rentalPricePerDay, $gte: parseFloat(minPrice) };
        }
        if (maxPrice) {
            query.rentalPricePerDay = { ...query.rentalPricePerDay, $lte: parseFloat(maxPrice) };
        }
        if (seats) {
            query.seats = parseInt(seats);
        }

        // Date availability logic (more complex, simplified for now)
        // This would typically involve checking Booking collection for overlaps.
        // For a basic search, we'll just check if dates are provided but not implement full overlap logic here yet.

        const cars = await Car.find(query);
        res.json(cars);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};