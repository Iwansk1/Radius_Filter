// Initialize the map and set its view to a specific location (Friesland) and zoom level (9)
const map = L.map('map').setView([53.1653, 5.7815], 9);

// Add OpenStreetMap tiles to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize a circle to represent the radius on the map
let circle = L.circle([53.1653, 5.7815], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 5000 // Default radius set to 5 km
}).addTo(map);

// Array to hold the map markers
let markers = [];

// Function to geocode an address (convert address to latitude and longitude)
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

// Function to go to an address entered by the user
async function goToAddress() {
    const address = document.getElementById("address").value;
    const location = await geocodeAddress(address);

    if (location) {
        map.setView(location, 11); // Set the map view to the new location with a closer zoom level
        circle.setLatLng(location); // Move the circle to the new location
        updateRadiusAndFilter(); // Update the circle radius and filter markers
    }
}

// Function to fetch and process locations from a JSON file
async function fetchLocations() {
    try {
        const response = await fetch('locations.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Geocode each address and add a marker to the map
        for (const item of data) {
            const location = await geocodeAddress(item.address);
            if (location) {
                const marker = L.marker(location);
                markers.push(marker); // Add marker to the markers array
                marker.addTo(map); // Add marker to the map
            }
        }
        updateRadiusAndFilter(); // Update radius and filter markers after fetching all locations
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

// Function to update the radius of the circle
function updateRadius() {
    const radius = document.getElementById("radius").value * 1000; // Convert km to meters
    circle.setRadius(radius); // Set the new radius of the circle
}

// Function to filter markers based on the current radius
function filterMarkers() {
    const radius = document.getElementById("radius").value * 1000; // Convert km to meters
    const center = circle.getLatLng(); // Get the center of the circle

    // Show or hide markers based on their distance from the center
    markers.forEach(marker => {
        const distance = center.distanceTo(marker.getLatLng());
        if (distance <= radius) {
            marker.addTo(map); // Show marker
        } else {
            map.removeLayer(marker); // Hide marker
        }
    });
}

// Function to update the radius and filter markers accordingly
function updateRadiusAndFilter() {
    updateRadius(); // Update the radius of the circle
    filterMarkers(); // Filter the markers based on the new radius
}

// Bind the radius input to update radius and filter markers when its value changes
document.getElementById("radius").addEventListener("input", updateRadiusAndFilter);

// Bind the goToAddress function to the Go button click event
document.getElementById("controls").addEventListener("submit", event => {
    event.preventDefault(); // Prevent the default form submission behavior
    goToAddress(); // Call the goToAddress function
});

// Call the function to fetch locations when the page loads
fetchLocations();
