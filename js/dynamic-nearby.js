// Import the site data
import { siteData } from './siteData.js';

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

// Function to create a card for each nearby place
function createPlaceCard(place) {
    return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${place.name}</h5>
                    <p class="card-text">
                        <i class="fas fa-road"></i> Distance: ${place.distance} km
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Function to render nearby places
function renderNearbyPlaces() {
    const nearbyCardsContainer = document.getElementById('nearby-cards');
    if (!nearbyCardsContainer) {
        console.error('Could not find nearby-cards container');
        return;
    }

    // Get the current page ID from URL
    const currentId = getCurrentPageId();
    console.log('Current page ID:', currentId);
    
    // Get nearby places for the current location
    const nearbyPlaces = getNearbyPlaces(currentId);
    console.log('Nearby places:', nearbyPlaces);
    
    // Create HTML for all nearby places
    const placesHTML = nearbyPlaces.map(place => createPlaceCard(place)).join('');
    
    // Update the container with the new content
    nearbyCardsContainer.innerHTML = placesHTML;
}

// Call the render function when the DOM is loaded
document.addEventListener('DOMContentLoaded', renderNearbyPlaces);