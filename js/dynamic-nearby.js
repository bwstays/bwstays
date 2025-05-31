function getCurrentPageId() {
    const urlParams = new URLSearchParams(window.location.search);

	var currId=urlParams.get('id') ;
 	if (currId === null || typeof currId == "undefined" || currId === '')
		 currId=1;
    return currId;

}

function getCurrentCatagoryId() {
    const urlParams = new URLSearchParams(window.location.search);

	var catId=urlParams.get('cat') ;
	if (catId === null || typeof catId == "undefined" || catId === '')
		 catId=0;
    return catId ;

}

function findPlaceById(id) {
    const categories = ['culthist', 'waterfalls', 'museums', 'romantic', 'plantation', 'trucking', 'wildlife', 'farms', 'sports', 'food'];
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
            <div class="card nearby-card h-100 border-0">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-container">
                            <i class="fas fa-map-marker-alt" style="color: #64a19d;"></i>
                        </div>
                        <div>
                            <h5 class="card-title">${place.name}</h5>
                            <small class="distance-text">
                                <i class="fas fa-road"></i>${place.distance} km away
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
 
document.addEventListener('DOMContentLoaded', renderNearbyPlaces);