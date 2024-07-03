// Initialize Leaflet map
const map = L.map('map').setView([52.0907, 5.1214], 8); // Centered around the middle of the Netherlands, zoom level 8

// Add OpenStreetMap tiles to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize circle to represent the radius on the map
const circle = L.circle([52.0907, 5.1214], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 5000 // Default radius set to 5 km
}).addTo(map);

// Array to hold map markers
const markers = [];

// Function to geocode an address (convert address to latitude and longitude)
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
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

// Function to fetch and process locations from a JSON file
async function fetchLocations() {
    try {
        const response = await fetch('locations.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Process each competition category
        for (const category in data) {
            if (data.hasOwnProperty(category)) {
                const competition = data[category];
                
                // Process each competition entry
                for (const item of competition) {
                    const location = await geocodeAddress(item.address);
                    if (location) {
                        const marker = L.marker(location);
                        
                        // Create HTML content for the popup
                        const popupContent = `
                            <div>
                                <h3>${item.address}</h3>
                                <p><strong>Competition:</strong> ${category}</p>
                                <img src="${item.thumbnailUrl}" alt="Video Thumbnail" style="width: 400px; max-width: 400px;">
                                <br><br>
                                <button onclick="window.open('${item.videoUrl}', '_blank')">Watch Video</button>
                            </div>
                        `;
                        
                        marker.bindPopup(popupContent, { maxWidth: 400 }); // Set popup content and maxWidth
                        markers.push(marker); // Add marker to markers array
                    }
                }
            }
        }
        updateRadiusAndFilter(); // Update radius and filter markers after fetching locations
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

// Function to update the radius of the circle
function updateRadius() {
    const radius = document.getElementById("radius").value * 1000; // Convert km to meters
    circle.setRadius(radius); // Set new radius of circle
}

// Function to filter markers based on current radius
function filterMarkers() {
    const radius = document.getElementById("radius").value * 1000; // Convert km to meters
    const center = circle.getLatLng(); // Get center of the circle
    
    // Show or hide markers based on their distance from the center
    markers.forEach(marker => {
        const distance = center.distanceTo(marker.getLatLng());
        if (distance <= radius) {
            if (!map.hasLayer(marker)) {
                marker.addTo(map); // Show marker if not already added
            }
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker); // Hide marker if already added
            }
        }
    });
}

// Function to update radius and filter markers accordingly
function updateRadiusAndFilter() {
    updateRadius(); // Update radius of the circle
    filterMarkers(); // Filter markers based on new radius
}

// Event listener for radius input to update radius and filter markers
document.getElementById("radius").addEventListener("input", updateRadiusAndFilter);

// Event listener for form submission to go to address
document.getElementById("controls").addEventListener("submit", event => {
    event.preventDefault(); // Prevent default form submission
    goToAddress(); // Call goToAddress function
});

// Function to go to address entered by user
async function goToAddress() {
    const address = document.getElementById("address").value;
    const location = await geocodeAddress(address);
    
    if (location) {
        map.setView(location, 11); // Set map view to new location with closer zoom level
        circle.setLatLng(location); // Move circle to new location
        updateRadiusAndFilter(); // Update circle radius and filter markers
    }
}

// Call function to fetch locations when page loads
fetchLocations();
