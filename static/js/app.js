// Update greeting based on time
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Good evening";
    
    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 18) {
        greeting = "Good afternoon";
    }
    
    document.querySelector('.greeting-time').textContent = greeting;
}

// Get precise location if available
async function getLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(`/api/location?lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        resolve(data.city || 'your location');
                    } catch {
                        resolve('your location');
                    }
                },
                () => resolve('your location')
            );
        } else {
            resolve('your location');
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    updateGreeting();
    
    // Update location if we have geolocation
    const locationEl = document.querySelector('.greeting-location');
    const preciseLocation = await getLocation();
    if (preciseLocation !== 'your location') {
        locationEl.textContent = `Ready to discover amazing music from ${preciseLocation}?`;
    }
    
    // Load recommended tracks
    loadRecommendedTracks();
});
