
function getCurrentPageId() {

    const urlParams = new URLSearchParams(window.location.search);


    return urlParams.get('id') ;
}

function findPlaceById(id) {

    const categories = ['culthist', 'waterfalls', 'museums', 'romantic', 'plantation', 'trucking', 'wildlife', 'farms', 'sporting', 'food'];
    for (const category of categories) {
        if (siteData[category]) {
            const place = siteData[category].find(p => p.id === id);
            if (place) return { place, category };
        }
    }
    return null;
}


function getLocationNameById(id) {
    return locations.names[id] || null;
}


function getLocationIdByName(name) {
    for (const [id, locationName] of Object.entries(locations.names)) {
        if (locationName === name) {
            return parseInt(id);
        }
    }
    return null;
}

// Function to get nearby places within 25km of Santhi natha Temple
function renderNearbyPlaces() {
    const nearbyCardsContainer = document.getElementById('nearby-cards');
    if (!nearbyCardsContainer) {
        console.error('Could not find nearby-cards container');
        return;
    }


    // Santhi natha Temple has ID 1 in the locations data
    const locId = getCurrentPageId();
    const maxDistance = 25;

    // id we can pass dynamically
    const nearbyPlaces = getNearbyPlaces(locId, maxDistance);

    console.log('Nearby places:', nearbyPlaces);

    if (nearbyPlaces.length === 0) {
        nearbyCardsContainer.innerHTML = '<div class="col-12"><p class="text-center">No nearby places found.</p></div>';
        return;
    }

    // Create HTML for all nearby places
    const placesHTML = nearbyPlaces.map(place => createPlaceCard(place)).join('');

    // Update the container with the new content
    nearbyCardsContainer.innerHTML = placesHTML;
}

// Function to create a card for each nearby place
function createPlaceCard(place) {

    return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${place.name}</h5>
                    <p class="card-text mb-2">
                        <i class="fas fa-road"></i> Distance: ${place.distance} km
                    </p>
                </div>
            </div>
        </div>
    `;
}


document.addEventListener('DOMContentLoaded', renderNearbyPlaces);