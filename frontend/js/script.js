// frontend/js/script.js

// --- Global Variables (declared but not assigned yet) ---
// These will be assigned once the DOM is ready.
let homeSection, carsSection, loginSection, registerSection, dashboardSection;
let registerForm, loginForm, registerMessage, loginMessage;
let pendingBookingsList, allAdminBookingsList; // For admin booking views
let dashboardContent, userDashboardView, adminDashboardView;
let addCarForm, addCarMessage;
let carsListContainer; // For featured cars on homepage
let allCarsListDiv; // For all cars on /cars page
let userBookingsList; // For displaying user's bookings

// --- Global Helper Functions (can be called anywhere, after definition) ---

// Function to display messages (defined globally)
window.showMessage = (element, message, type = 'success') => {
    if (!element) {
        console.error("showMessage called with null element. Message:", message);
        return;
    }
    element.textContent = message;
    element.className = `message-area ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message-area';
    }, 5000);
};

// Function to parse JWT token (defined globally)
window.parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error parsing JWT:", e);
        return null;
    }
};

// --- API Base URL ---
const API_BASE_URL = 'http://localhost:5000/api';

// --- SPA Router Core Logic ---

// This function will render content based on the URL path
const renderContent = async (path) => {
    // This check should now pass if DOMContentLoaded assigned elements correctly
    if (!homeSection || !carsSection || !loginSection || !registerSection || !dashboardSection) {
        console.error("Critical: renderContent called before all DOM elements were assigned in DOMContentLoaded. This indicates a serious loading issue.");
        return; // Prevent further errors
    }

    // Hide all sections initially
    homeSection.style.display = 'none';
    carsSection.style.display = 'none';
    loginSection.style.display = 'none';
    registerSection.style.display = 'none';
    dashboardSection.style.display = 'none';

    // Show content based on path
    if (path === '/' || path === '/index.html' || path === '/frontend/index.html') {
        homeSection.style.display = 'block';
        console.log("Showing Home Page");
        fetchAndDisplayCars(3); // Fetch and display 3 featured cars
    } else if (path === '/cars') {
        carsSection.style.display = 'block';
        console.log("Showing Cars Page");
        // Append the div we created globally to carsSection
        if (carsSection && !carsSection.contains(allCarsListDiv)) { // Prevent adding multiple times
             // Remove existing placeholder if present
            let existingP = carsSection.querySelector('p');
            if(existingP && existingP.textContent.includes('Car listings will appear')) {
                carsSection.removeChild(existingP);
            }
            carsSection.appendChild(allCarsListDiv);
        }
        fetchAndDisplayCars(); // Fetch and display all cars
    } else if (path === '/login') {
        loginSection.style.display = 'block';
        console.log("Showing Login Page");
    } else if (path === '/register') {
        registerSection.style.display = 'block';
        console.log("Showing Register Page");
    } else if (path === '/dashboard') {
        dashboardSection.style.display = 'block';
        console.log("Showing Dashboard Page");

        // Dashboard specific display based on user role
        const token = localStorage.getItem('token');
        if (!token) {
            navigateTo('/login');
            window.showMessage(loginMessage, 'Please log in to view your dashboard.', 'error');
            return;
        }

        const decodedToken = window.parseJwt(token);
        if (!decodedToken || !decodedToken.user || !decodedToken.user.role) {
            localStorage.removeItem('token');
            navigateTo('/login');
            window.showMessage(loginMessage, 'Invalid session. Please log in again.', 'error');
            return;
        }

        if (decodedToken.user.role === 'admin') {
            userDashboardView.style.display = 'none';
            adminDashboardView.style.display = 'block';
            console.log("Showing Admin Dashboard");
        } else { // Regular user
            userDashboardView.style.display = 'block';
            adminDashboardView.style.display = 'none';
            console.log("Showing User Dashboard");
            fetchAndDisplayUserBookings(); // Added this call for regular user dashboard
        }

    } else {
        console.log(`404 Not Found: Path ${path}`);
        homeSection.style.display = 'block'; // Fallback to home
    }
};

// This function updates the URL and calls renderContent
const navigateTo = (path) => {
    history.pushState(null, '', path);
    renderContent(path);
};

// --- Car Display Logic ---
const fetchAndDisplayCars = async (limit = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cars`); // Fetch all cars
        const cars = await response.json();

        if (!carsListContainer) {
            console.error("carsListContainer not found for featured cars. Check its ID in index.html.");
            return;
        }

        // Clear previous content
        carsListContainer.innerHTML = '';
        allCarsListDiv.innerHTML = ''; // Clear for the /cars page

        if (cars.length === 0) {
            carsListContainer.innerHTML = '<p>No featured cars available at the moment.</p>';
            allCarsListDiv.innerHTML = '<p>No cars available for rent at the moment.</p>';
            return;
        }

        // Display Featured Cars (on homepage)
        const featuredCars = limit ? cars.slice(0, limit) : cars; // Take limited for featured
        featuredCars.forEach(car => {
            const carCard = createCarCard(car);
            carsListContainer.appendChild(carCard);
        });

        // Display All Cars (for /cars page)
        cars.forEach(car => {
            const carCard = createCarCard(car);
            allCarsListDiv.appendChild(carCard);
        });


    } catch (error) {
        console.error('Error fetching cars:', error);
        if (carsListContainer) carsListContainer.innerHTML = '<p style="color:red;">Error loading cars. Please try again.</p>';
        if (allCarsListDiv) allCarsListDiv.innerHTML = '<p style="color:red;">Error loading cars. Please try again.</p>';
    }
};

// Helper function to create a car card HTML
const createCarCard = (car) => {
    const div = document.createElement('div');
    div.className = 'car-card';
    // Corrected image path to use /frontend/images/
    div.innerHTML = `
        <img src="/frontend/images/${car.imageUrl || 'bg.png'}" alt="${car.make} ${car.model}">
        <div class="car-card-content">
            <h3>${car.make} ${car.model} (${car.year})</h3>
            <p><strong>License:</strong> ${car.licensePlate}</p>
            <p><strong>Type:</strong> ${car.carType}</p>
            <p><strong>Fuel:</strong> ${car.fuelType} | <strong>Trans:</strong> ${car.transmission}</p>
            <p><strong>Seats:</strong> ${car.seats} | <strong>Location:</strong> ${car.location}</p>
            <p class="price">$${car.rentalPricePerDay.toFixed(2)} / day</p>
            <button class="btn btn-primary book-car-btn" data-car-id="${car._id}">Book Now</button>
        </div>
    `;
    // Attach direct event listener for 'Book Now' button here
    const bookButton = div.querySelector('.book-car-btn'); // Get the button element within this new card
    if (bookButton) {
        bookButton.addEventListener('click', (e) => {
            const carId = bookButton.dataset.carId; // Get car ID from the button's dataset
            console.log("Book Now button clicked directly on card:", carId); // New diagnostic log
            if (carId) {
                handleBooking(carId);
            }
        });
    }
    return div;
};

// --- Booking Functionality ---

const handleBooking = async (carId) => {
    console.log("handleBooking started for car:", carId); // ADDED THIS DIAGNOSTIC LOG

    const token = localStorage.getItem('token');
    if (!token) {
        window.alert('Please log in to book a car.'); // Use alert for immediate feedback
        navigateTo('/login');
        return;
    }

    // For simplicity, we'll use prompt for dates. A proper date picker UI would be better.
    const pickupDateInput = window.prompt('Enter pickup date (YYYY-MM-DD):');
    const returnDateInput = window.prompt('Enter return date (YYYY-MM-DD):');

    if (!pickupDateInput || !returnDateInput) {
        window.alert('Booking cancelled. Both dates are required.');
        return;
    }

    const pickupDate = new Date(pickupDateInput);
    const returnDate = new Date(returnDateInput);

    if (isNaN(pickupDate) || isNaN(returnDate) || pickupDate >= returnDate) {
        window.alert('Invalid dates. Pickup date must be before return date and in valid format.');
        return;
    }

    // Fetch car details to get price (optional, or calculate on backend)
    let carPricePerDay;
    try {
        const carResponse = await fetch(`${API_BASE_URL}/cars/${carId}`);
        if (!carResponse.ok) throw new Error('Could not fetch car details for booking.');
        const carDetails = await carResponse.json();
        carPricePerDay = carDetails.rentalPricePerDay;
    } catch (error) {
        console.error('Error getting car price for booking:', error);
        window.alert('Could not retrieve car price. Booking failed.');
        return;
    }

    const diffTime = Math.abs(returnDate - pickupDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = diffDays * carPricePerDay;

    const bookingData = {
        carId,
        pickupDate: pickupDate.toISOString(), // Send in ISO format
        returnDate: returnDate.toISOString(),
        totalPrice
    };

    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token // Send JWT token for authentication
            },
            body: JSON.stringify(bookingData)
        });

        const data = await response.json();

        if (response.ok) {
            window.alert('Car booked successfully! Total Price: $' + totalPrice.toFixed(2));
            navigateTo('/dashboard'); // Go to dashboard after booking
        } else {
            window.alert('Booking failed: ' + (data.msg || 'Server error.'));
            console.error('Booking error:', data);
        }
    } catch (error) {
        console.error('Network error during booking:', error);
        window.alert('Network error. Could not book car. Please try again.');
    }
};

// --- User Bookings Display Logic ---

const fetchAndDisplayUserBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn("No token found for user bookings. Redirecting to login.");
        navigateTo('/login');
        window.showMessage(loginMessage, 'Please log in to view your bookings.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/user`, {
            method: 'GET',
            headers: {
                'x-auth-token': token // Send JWT token for authentication
            }
        });

        const bookings = await response.json();

        if (!userBookingsList) {
            console.error("userBookingsList container not found in HTML.");
            return;
        }
        userBookingsList.innerHTML = ''; // Clear previous content

        if (!response.ok) {
             window.showMessage(userBookingsList, bookings.msg || 'Failed to load bookings.', 'error');
             console.error('Error fetching user bookings:', bookings);
             return;
        }

        if (bookings.length === 0) {
            userBookingsList.innerHTML = '<p>You have no current or past bookings.</p>';
            return;
        }

        bookings.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'booking-card';
            // Displaying booking details
            bookingCard.innerHTML = `
                <h4>Booking ID: ${booking._id}</h4>
                <p><strong>Car:</strong> ${booking.car.make} ${booking.car.model} (${booking.car.licensePlate})</p>
                <p><strong>Pickup Date:</strong> ${new Date(booking.pickupDate).toLocaleDateString()}</p>
                <p><strong>Return Date:</strong> ${new Date(booking.returnDate).toLocaleDateString()}</p>
                <p><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="booking-status-${booking.status}">${booking.status.toUpperCase()}</span></p>
                <p><strong>Payment:</strong> <span class="payment-status-${booking.paymentStatus}">${booking.paymentStatus.toUpperCase()}</span></p>
            `;
            userBookingsList.appendChild(bookingCard);
        });

    } catch (error) {
        console.error('Network error fetching user bookings:', error);
        if (userBookingsList) userBookingsList.innerHTML = '<p style="color:red;">Network error. Could not load bookings.</p>';
    }
};


// --- Main Initialization Block (Runs ONLY when HTML is fully loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Assigning DOM elements...");

    // Assign all DOM elements here, guaranteeing they exist
    homeSection = document.getElementById('home-section');
    carsSection = document.getElementById('cars-section');
    loginSection = document.getElementById('login-section');
    registerSection = document.getElementById('register-section');
    dashboardSection = document.getElementById('dashboard-section');

    registerForm = document.getElementById('register-form');
    loginForm = document.getElementById('login-form');
    registerMessage = document.getElementById('register-message');
    loginMessage = document.getElementById('login-message');

    dashboardContent = document.getElementById('dashboard-content');
    userDashboardView = document.getElementById('user-dashboard-view');
    adminDashboardView = document.getElementById('admin-dashboard-view');

    addCarForm = document.getElementById('add-car-form');
    addCarMessage = document.getElementById('add-car-message');

    // New DOM elements for car display
    carsListContainer = document.getElementById('featured-cars-list'); // Corrected ID
    allCarsListDiv = document.createElement('div'); // Create div for /cars page
    allCarsListDiv.className = 'car-list';

    userBookingsList = document.getElementById('user-bookings-list'); // Get the container for user bookings


    // Verify elements were found. This is a critical check for us.
    if (!homeSection || !carsSection || !loginSection || !registerSection || !dashboardSection ||
        !registerForm || !loginForm || !registerMessage || !loginMessage ||
        !dashboardContent || !userDashboardView || !adminDashboardView ||
        !addCarForm || !addCarMessage || !carsListContainer || !allCarsListDiv ||
        !userBookingsList) { // Added userBookingsList to check
        console.error("CRITICAL ERROR: One or more required DOM elements were NOT found when DOMContentLoaded fired. Please check index.html IDs.");
        return;
    } else {
        console.log("All primary DOM elements successfully assigned.");
    }

    // Handle initial page load based on current URL with a slight delay for extreme DOM readiness
    setTimeout(() => {
        renderContent(window.location.pathname);
    }, 50); // 50ms delay

    // Attach event listeners to navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default full page reload
            const href = e.target.getAttribute('href');
            if (href) {
                navigateTo(href.startsWith('/') ? href : '/' + href);
            }
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        renderContent(window.location.pathname);
    });

    // Dummy fetch for demonstration
    const fetchDummyData = async () => {
        try {
            const response = await fetch('http://localhost:5000/');
            const data = await response.text();
            console.log('Fetched from backend:', data);
        } catch (error) {
            console.error('Error fetching dummy data:', error);
        }
    };
    fetchDummyData(); // Call on DOMContentLoaded

    // --- User Authentication Logic ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const password2 = document.getElementById('register-password2').value;

            if (password !== password2) {
                window.showMessage(registerMessage, 'Passwords do not match!', 'error');
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    window.showMessage(registerMessage, 'Registration successful! Redirecting...', 'success');
                    registerForm.reset();
                    setTimeout(() => navigateTo('/dashboard'), 1500);
                } else {
                    window.showMessage(registerMessage, data.msg || 'Registration failed.', 'error');
                }
            } catch (error) {
                console.error('Error during registration:', error);
                window.showMessage(registerMessage, 'Network error. Please try again.', 'error');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    window.showMessage(loginMessage, 'Login successful! Redirecting...', 'success');
                    loginForm.reset();
                    setTimeout(() => navigateTo('/dashboard'), 1500);
                } else {
                    window.showMessage(loginMessage, data.msg || 'Login failed. Invalid credentials.', 'error');
                }
            } catch (error) {
                console.error('Error during login:', error);
                window.showMessage(loginMessage, 'Network error. Please try again.', 'error');
                }
            });
        }

        // --- Add Car Logic (Admin only) ---
        if (addCarForm) {
            addCarForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const token = localStorage.getItem('token');
                if (!token) {
                    window.showMessage(addCarMessage, 'You must be logged in to add a car.', 'error');
                    navigateTo('/login');
                    return;
                }
                const carData = {
                    make: document.getElementById('car-make').value,
                    model: document.getElementById('car-model').value,
                    year: parseInt(document.getElementById('car-year').value),
                    licensePlate: document.getElementById('car-licensePlate').value,
                    rentalPricePerDay: parseFloat(document.getElementById('car-rentalPricePerDay').value),
                    carType: document.getElementById('car-carType').value,
                    fuelType: document.getElementById('car-fuelType').value,
                    transmission: document.getElementById('car-transmission').value,
                    seats: parseInt(document.getElementById('car-seats').value),
                    imageUrl: document.getElementById('car-imageUrl').value || undefined,
                    location: document.getElementById('car-location').value
                };
                try {
                    const response = await fetch(`${API_BASE_URL}/cars`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                        },
                        body: JSON.stringify(carData)
                    });
                    const data = await response.json();
                    if (response.ok) {
                        window.showMessage(addCarMessage, 'Car added successfully!', 'success');
                        addCarForm.reset();
                    } else {
                        window.showMessage(addCarMessage, data.msg || 'Failed to add car.', 'error');
                        console.error('Error adding car:', data);
                    }
                } catch (error) {
                    console.error('Network error while adding car:', error);
                    window.showMessage(addCarMessage, 'Network error. Could not add car.', 'error');
                }
            });
        }
    }); // End of DOMContentLoaded

    // --- Logout Function (kept global as it might be triggered from HTML) ---
    window.logout = () => {
        localStorage.removeItem('token');
        window.alert('You have been logged out.');
        navigateTo('/login');
    };