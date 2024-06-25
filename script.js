// Initialize the map
const map = L.map('map').setView([53.1653, 5.7815], 9); // Centered on Friesland

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize circle for radius
let circle = L.circle([53.1653, 5.7815], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 5000 // Default 5 km radius
}).addTo(map);

// Array to hold markers
let markers = [];

// Function to update radius circle
function updateRadius() {
    const radius = document.getElementById("radius").value * 1000; // Convert km to meters
    circle.setRadius(radius);
    circle.setLatLng(map.getCenter());
    filterMarkers(radius); // Filter markers based on the new radius
}

// Function to geocode an address
function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                return L.latLng(lat, lon);
            } else {
                throw new Error('Address not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to geocode address. Please check your network connection.');
            return null;
        });
}

// Function to go to an address
function goToAddress() {
    const address = document.getElementById("address").value;
    geocodeAddress(address).then(location => {
        if (location) {
            map.setView(location, 13);
            circle.setLatLng(location);
            updateRadiusAndFilter(); // Update radius and filter markers
        }
    });
}

// Function to fetch and process addresses from JSON file
function fetchLocations() {
    fetch('locations.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            data.forEach(item => {
                geocodeAddress(item.address).then(location => {
                    if (location) {
                        const marker = L.marker(location);
                        markers.push(marker);
                        marker.addTo(map); // Add marker to the map
                    }
                });
            });
            updateRadiusAndFilter(); // Update radius and filter markers
        })
        .catch(error => console.error('Error fetching locations:', error));
}

// Call the function to fetch locations when the page loads
fetchLocations();

// Function to filter markers based on the current radius
function filterMarkers(radius) {
    const center = circle.getLatLng();

    markers.forEach(marker => {
        const distance = center.distanceTo(marker.getLatLng());
        if (distance <= radius) {
            marker.addTo(map); // Show marker
        } else {
            map.removeLayer(marker); // Hide marker
        }
    });
}

// Update radius and filter markers when clicking Update Radius button
function updateRadiusAndFilter() {
    const radius = document.getElementById("radius").value * 1000; // Convert km to meters
    updateRadius(); // Update radius circle
    filterMarkers(radius); // Filter markers
}

// Bind updateRadiusAndFilter function to radius input change
document.getElementById("radius").addEventListener("input", updateRadiusAndFilter);

// Bind goToAddress function to Go button click
document.getElementById("controls").addEventListener("submit", function(event) {
    event.preventDefault();
    goToAddress();
});
