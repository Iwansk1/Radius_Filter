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

// Function to geocode an address
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data.length > 0) {
            const { lat, lon } = data[0];
            return L.latLng(parseFloat(lat), parseFloat(lon));
        } else {
            throw new Error('Address not found');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to geocode address. Please check your network connection or use a valid address.');
        return null;
    }
}

// Function to go to an address
async function goToAddress() {
    const address = document.getElementById("address").value;
    const location = await geocodeAddress(address);
    if (location) {
        map.setView(location, 13);
        circle.setLatLng(location);
        updateRadiusAndFilter(); // Update radius and filter markers
    }
}

// Function to fetch and process addresses from JSON file
async function fetchLocations() {
    try {
        const response = await fetch('locations.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        for (const item of data) {
            const location = await geocodeAddress(item.address);
            if (location) {
                const marker = L.marker(location);
                markers.push(marker);
                marker.addTo(map); // Add marker to the map
            }
        }
        updateRadiusAndFilter(); // Update radius and filter markers
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

// Function to update radius circle
function updateRadius() {
    const radius = document.getElementById("radius").value * 1000; // Convert km to meters
    circle.setRadius(radius);
}

// Function to filter markers based on the current radius
function filterMarkers() {
    const radius = document.getElementById("radius").value * 1000; // Convert km to meters
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

// Update radius and filter markers
function updateRadiusAndFilter() {
    updateRadius(); // Update radius circle
    filterMarkers(); // Filter markers
}

// Bind event listeners
document.getElementById("radius").addEventListener("input", updateRadiusAndFilter);
document.getElementById("controls").addEventListener("submit", event => {
    event.preventDefault();
    goToAddress();
});

// Call the function to fetch locations when the page loads
fetchLocations();
