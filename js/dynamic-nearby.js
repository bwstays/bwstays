function getCurrentLocationId() {
    // Get the current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || 'tirunelli'; // Default to tirunelli if no id provided
}

function findPlaceById(id) {

 					 var locations = [
						["Koottamundu Glass Temple,Wayanad",23,11,0,55,55,39,20,19,36,17,42,48,27,34,39,28,55,14,25,14,29,25,10,37,13,11,24,44,62,0,54,43,46,21,20,40,16,14,13,34,67,41,22,10,28,8,33,22,4,25,24,20,22,20,23,14,13,18,17,4,4,1,40,23,,,,,,,7,37,30],
						["Thirunelly",41,44,55,0,0,39,47,41,35,53,21,70,43,25,21,79,1,65,56,65,59,56,45,25,64,56,56,67,22,0,18,18,46,71,71,51,74,56,64,86,27,51,55,61,46,47,43,58,55,54,40,50,73,71,67,65,64,69,53,55,54,48,37,56,,,,,,,48,25,53],

					 ];


					let nearbyplaces = [];
					for (j= 1; j <= locations[1].length; j++) {
					 // places less than 25 Kms
					 if(locations[1][j]<=25)
					  nearbyplaces.push(j);

					}

					 var allplaces =[
						 [1,"Santhi natha Temple Venniyod",	"Cultural & Historical",1,,,,],
						 [2,"Ananthanatha Swami temple Puliyarmala",	"Cultural & Historical",1,,,,],
						 [3,"Glass temple of kottumude-jain","Cultural & Historical",3,,,,],
						 [4,"Glass temple of kottumude-jain","Cultural & Historical",3,,,,],
						 [5,"Thirunelly",	"Cultural & Historical",3,,,,],
					 ];

                   let getnearbyplacesdata = [];
					for (j= 0; j < allplaces.length; j++) {
						 for (i= 0; i < nearbyplaces.length; i++) {
							 if(nearbyplaces[i]==allplaces[j][0])
								 getnearbyplacesdata.push(allplaces[j]);
						 }
					}
					return getnearbyplacesdata;
    // Search through all categories in siteData
    /*const categories = ['culthist', 'waterfalls', 'museums', 'romantic', 'plantation'];
    for (const category of categories) {
        const place = siteData[category].find(p => p.id === id);
        if (place) return { place, category };
    }

    return null;
    */
}

function getNearbyPlaces(currentId) {
    const result = findPlaceById(currentId);
    if (!result) return [];

    const { place } = result;
    if (!place.nearby) return [];

	/*
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
    }
    );
    */
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
    const currentId = getCurrentLocationId();
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