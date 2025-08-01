// backend/routes/carRoutes.js
const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const auth = require('../middleware/authMiddleware'); // Middleware for authentication
const authorize = require('../middleware/authorizeMiddleware'); // Middleware for role-based authorization

// @route   POST api/cars
// @desc    Add a new car (Admin only)
// @access  Private (Admin)
router.post('/', auth, authorize(['admin']), carController.addCar);

// @route   GET api/cars
// @desc    Get all cars (Public)
// @access  Public
router.get('/', carController.getAllCars);

// @route   GET api/cars/:id
// @desc    Get single car by ID (Public)
// @access  Public
router.get('/:id', carController.getCarById);

// @route   PUT api/cars/:id
// @desc    Update a car by ID (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, authorize(['admin']), carController.updateCar);

// @route   DELETE api/cars/:id
// @desc    Delete a car by ID (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, authorize(['admin']), carController.deleteCar);

// @route   GET api/cars/search
// @desc    Search for available cars by criteria (e.g., location, dates)
// @access  Public
router.get('/search', carController.searchCars); // Note: This should be before /:id to avoid matching 'search' as an ID

module.exports = router;