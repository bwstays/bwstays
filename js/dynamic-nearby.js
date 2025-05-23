function getCurrentPageId() {
    // Get the current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || 'tirunelli'; // Default to tirunelli if no id provided
}

function findPlaceById(id) {
    // Search through all categories in siteData
    const categories = ['culthist', 'waterfalls', 'museums', 'romantic', 'plantation'];
    for (const category of categories) {
        const place = siteData[category].find(p => p.id === id);
        if (place) return { place, category };
    }
    return null;
}

function getNearbyPlaces(currentId) {
    const result = findPlaceById(currentId);
    if (!result) return [];
    
    const { place } = result;
    if (!place.nearby) return [];
    

    return place.nearby.map(nearby => {

        const categories = ['culthist', 'waterfalls', 'museums', 'romantic', 'plantation'];
        for (const category of categories) {
            const fullPlace = siteData[category].find(p => p.name === nearby.name);
            if (fullPlace) {
                return {
                    ...fullPlace,
                    distance: nearby.distance 
                };
            }
        }

        return {
            name: nearby.name,
            distance: nearby.distance,
            image: 'assets/img/default.jpg', 
            rating: 'N/A',
            id: nearby.name.toLowerCase().replace(/\s+/g, '-'),
            knowmore: './knowmore.html'
        };
    });
}

function createPlaceCard(place) {
    return `
        <div class="col-md-3 mb-4">
            <div class="card h-100 d-flex flex-column">
                <!-- <img src="${place.image}" class="card-img-top" alt="${place.name}" style="height: 200px; object-fit: cover;"> -->
                <div class="card-body d-flex flex-column">
                    <div class="flex-grow-1">
                        <h5 class="card-title">${place.name}</h5>
                        <p class="card-text">
                            <small class="text-muted">
                                <i class="fas fa-map-marker-alt"></i> ${place.distance} km away
                            </small>
                            <br>
                            <small class="text-muted">
                                <i class="fas fa-star"></i> ${place.rating} Rating
                            </small>
                        </p>
                    </div>
                    <div class="mt-2">
                        <a href="${place.knowmore}?id=${place.id}" class="btn btn-primary btn-sm w-100">Learn More</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initNearbyPlaces() {
    const currentId = getCurrentPageId();
    const nearbyPlaces = getNearbyPlaces(currentId);
    const cardsContainer = document.getElementById('nearby-cards');
    
    if (cardsContainer) {
        cardsContainer.innerHTML = nearbyPlaces
            .map(place => createPlaceCard(place))
            .join('');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initNearbyPlaces);