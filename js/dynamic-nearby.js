function getCurrentPageId() {
    const urlParams = new URLSearchParams(window.location.search);

    //61 is the first catagory code in the sitedata
    var currId = urlParams.get('id');
    if (currId === null || typeof currId == "undefined" || currId === '')
        currId = 61;
    return currId;

}

function getCurrentCatagoryId() {
    const urlParams = new URLSearchParams(window.location.search);

    var catId = urlParams.get('cat');
    if (catId === null || typeof catId == "undefined" || catId === '')
        catId = 0;
    return catId;

}

function findPlaceById(id) {

    //0 plantation
    //1 waterfalls
    //2,museums
    //3,romantic
    //4,culthist
    //5, trucking
    //6 wildlife
    //7 farms
    //8,sporting
    //9,food
    //10,tribal
    //11,cycling
    //12,shopping
    //12,pilgrimage


    const categories = ['plantation', 'waterfalls', 'museums', 'romantic', 'culthist', 'trucking', 'wildlife', 'farms', 'sporting', 'food', 'tribal', 'cycling', 'shopping','pilgrimage'];
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


/**
 * Function to get nearby places within a certain distance
 *
 * @param {number} locationId - The ID of the current location (1-30)
 * @param {number} maxDistance - Maximum distance in kilometers (default: 25)
 * @returns {Array} Array of nearby places sorted by distance, each containing:
 *                  - id: Location ID (1-30)
 *                  - name: Full name of the location
 *                  - distance: Distance in kilometers
 *
 * Example Usage:
 * -------------
 * 1. Get all places within 25km of Santhi natha Temple (ID: 1):
 *    const nearby = getNearbyPlaces(1);
 *    // Returns: [
 *    //   { id: 26, name: "Vantha Mess", distance: 1 },
 *    //   { id: 27, name: "Ramvilla Kalpetta", distance: 1 },
 *    //   { id: 23, name: "Puliyarmala", distance: 3 },
 *    //   ...
 *    // ]
 *
 * 2. Get all places within 10km of Thirunelly (ID: 4):
 *    const nearby = getNearbyPlaces(4, 10);
 *    // Returns places within 10km of Thirunelly
 */
function getNearbyPlaces(locationId, maxDistance = maxDistance) {
    const nearbyPlaces = [];
    const distances = locations.distances[locationId];
    //alert("distances"+distances)
    // alert("maxDistance"+maxDistance);
    // alert("locationId"+locationId);



    for (let i = 1; i <= Object.keys(locations.names).length; i++) {

        if (distances[i - 1] <= maxDistance && i != locationId) {
            // alert(locations.names[i]);
            nearbyPlaces.push({
                id: i,
                name: locations.names[i],
                distance: distances[i - 1]
            });
        }
    }

    /*for (let i = 0; i <nearbyPlaces.length; i++)
    {
          alert(nearbyPlaces[i].distance + " " + i);
    }
      */

    return nearbyPlaces.sort((a, b) => a.distance - b.distance);
}



// Function to get nearby places within 25km of Santhi natha Temple
function renderNearbyPlaces() {
    const nearbyCardsContainer = document.getElementById('nearby-cards');
    if (!nearbyCardsContainer) {
        console.error('Could not find nearby-cards container');
        return;
    } s









    const locId = getCurrentPageId();
    const maxDistance = 20;
    const locCat = getCurrentCatagoryId();
    // id we can pass dynamically
    const nearbyPlaces = getNearbyPlaces(locId, maxDistance);

    console.log('Nearby places:', nearbyPlaces);

    if (nearbyPlaces.length === 0) {
        nearbyCardsContainer.innerHTML = '<div class="col-12"><p class="text-center">No nearby places found.</p></div>';
        return;
    }

    // Create HTML for all nearby places
    const placesHTML = nearbyPlaces.map(place => {
        // Find the full place details from siteData
        const fullPlaceDetails = findPlaceById(place.id);
        if (fullPlaceDetails) {
            return createPlaceCard({
                ...place,
                image: fullPlaceDetails.place.image[0],
                knowmore: fullPlaceDetails.place.knowmore,
                rating: fullPlaceDetails.place.rating,
                timing: fullPlaceDetails.place.timing,
                map: fullPlaceDetails.place.map,

            });
        }
        return createPlaceCard(place);
    }).join('');

    // Update the container with the new content
    nearbyCardsContainer.innerHTML = placesHTML;
}

// Function to create a card for each nearby place
function createPlaceCard(place) {
    const imageUrl = place.image || 'assets/img/villa1/demo-image-02.avif';
    const knowmoreUrl = place.knowmore || '#';

    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
            <div class="card nearby-card h-100 border-0" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s ease;">
                <div class="card-img-top">
                    <img alt="Black and White Stays Wayanad" src="${imageUrl}" class="img-fluid" alt="${place.name}" style="width: 100%; height: 160px; object-fit: cover;">
                </div>
                <div class="card-body p-3">
                    <div class="d-flex">
                        <div style="flex: 1;">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h6 class="card-title mb-0" style="font-size: 0.95rem; word-wrap: break-word; max-width: calc(100% - 40px);">
                                    <a href="${knowmoreUrl}" class="text-decoration-none text-white">${place.name}</a>
                                </h6>
                                <a href="${place.map}" target="_new" class="ms-2" style="background: rgba(255,255,255,0.9); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2); flex-shrink: 0;">
                                    <i class="fas fa-map-marker-alt" style="color: #64a19d;"></i>
                                </a>
                            </div>
                            <div class="text-white mb-1" style="font-size: 0.85rem;">Time: ${place.timing}</div>
                            <div class="mb-1">
                                <span class="text-white" style="font-size: 0.85rem;">
                                    <i class="fas fa-star" style="color: #64a19d;"></i> Rating: ${place.rating}
                                </span>
                            </div>
                            <small class="distance-text" style="color: #a8a8a8;">
                                <i class="fas fa-road me-1" style="color: #64a19d;"></i> Distance: ${place.distance}  km
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

{/* <div class="icon-container me-2">
    <a href="${place.map}" class="text-decoration-none"><i class="fas fa-map-marker-alt" style="color: #64a19d; font-size: 1.1rem;"></i></a>
</div> */}

document.addEventListener('DOMContentLoaded', renderNearbyPlaces);