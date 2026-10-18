function getCurrentPageId() {
    const urlParams = new URLSearchParams(window.location.search);
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
    const categories = ['plantation', 'waterfalls', 'museums', 'romantic', 'culthist', 'trucking', 'wildlife', 'farms', 'sporting', 'food', 'tribal', 'cycling', 'shopping','pilgrimage','health','stays'];
     for (const category of categories) {
        if (siteData[category]) {
            const place = siteData[category].find(p => p.id === id);
            if (place)
            {
				return { place, category };
			}
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
function getNearbyPlaces(locationId, maxDistance = maxDistance) {
    const nearbyPlaces = [];
    const distances = locations.distances[locationId];
     var loclength=Object.keys(locations.names).length;
    for (let i = 0; i < loclength; i++) {
			var value =locations.names[i+1];
           if ( distances[i]!=""  &&  distances[i] !== undefined &&  distances[i ] <= maxDistance && i != locationId) {
			if( distances[i]!="0")
			{
					var thisId=findPlaceById(i+1);
					if (!thisId) continue;
					nearbyPlaces.push({
						id: i,
						name: locations.names[i+1],
						distance: distances[i],
						rating: thisId.place.rating,
               			knowmore: thisId.place.knowmore,
						timing: thisId.place.timing,
						image: thisId.place.image[0],
						map: thisId.place.map
					});
			}
        }
    }
    return nearbyPlaces.sort((a, b) => a.distance - b.distance);
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;
    if (typeof obj !== "object") return true;
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
}
function renderNearbyPlaces() {
    const nearbyCardsContainer = document.getElementById('nearby-cards');
    if (!nearbyCardsContainer) {
        return;
    }
    const locId = getCurrentPageId();
    const maxDistance = 20;
    const locCat = getCurrentCatagoryId();
    const nearbyPlaces = getNearbyPlaces(locId, maxDistance);
     if (nearbyPlaces.length === 0) {
        nearbyCardsContainer.innerHTML = '<div class="col-12"><p class="text-center">No nearby places found.</p></div>';
        return;
    }
    const cardHTMLArray = [];
		for (let i = 0; i < nearbyPlaces.length; i++) {
		const place = nearbyPlaces[i];
		var html=createPlaceCard(place);
		cardHTMLArray.push(html);
		}
	nearbyCardsContainer.innerHTML = cardHTMLArray.join('');
}
var iconURLPrefix = 'https://www.bwstays.com/';
function createPlaceCard(place) {
    const imageUrl = place.image || iconURLPrefix+'assets/img/villa1/demo-image-02.webp';
    const knowmoreUrl = place.knowmore || '#';
    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
            <div class="card nearby-card h-100 border-0 position-relative" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s ease;"><div class="card-img-top">
                    <a href="${knowmoreUrl}" tabindex="-1" aria-hidden="true" class="text-decoration-none text-white"><img title="Black and White Stays Service Villa" src="${imageUrl}" class="img-fluid" alt="${place.name}"  loading="lazy"  style="width: 100%; height: 160px; object-fit: cover;"></a> </div>
                <div class="card-body p-3">
                    <div class="d-flex">
                        <div style="flex: 1;">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <a href="${knowmoreUrl}" class="text-decoration-none text-white stretched-link"><h3 class="h6 card-title mb-0" style="font-size: 0.85rem; word-wrap: break-word;">
                                     ${place.name}
                                </h3></a>
                                <a ${place.map ? 'href="' + place.map + '"' : 'hidden'} target="_new" rel="noopener" aria-label="${place.name} on Google Maps" class="ms-2" style="position: relative; z-index: 2; background: rgba(255,255,255,0.9); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2); flex-shrink: 0;">
                                    <i class="fas fa-map-marker-alt" style="color: var(--bw-teal);"></i>
                                </a>
                            </div>
                            <div class="text-white mb-1" style="font-size: 0.85rem;">Time: ${place.timing}</div>
                            <div class="mb-1">
                                <span class="text-white" style="font-size: 0.85rem;">
                                    <i class="fas fa-star" style="color: var(--bw-teal);"></i> Rating: <span class="text-warning">${place.rating}</span>
                                </span>
                            </div>
                            <small class="distance-text" style="color: #a8a8a8;">
                                <i class="fas fa-road me-1" style="color: var(--bw-teal);"></i> Distance:  <span class="text-warning">${place.distance} km </span>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
{}
document.addEventListener('DOMContentLoaded', renderNearbyPlaces);