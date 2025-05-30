/**

 * This file contains a complete distance matrix for 30 locations in Wayanad.
 * The data is structured to make it easy to:
 * 1. Look up any location by its ID
 * 2. Find distances between any two locations
 * 3. Get a list of nearby places within a certain distance
 *
 * DATA STRUCTURE:
 * --------------
 * 1. locations.names: A dictionary mapping location IDs to their names
 *    Example: locations.names[1] returns "Santhi natha Temple, Venniyod"
 *
 * 2. locations.distances: A 30x30 matrix where:
 *    - Each row represents distances from one location to all others
 *    - distances[i][j] gives the distance from location i to location j
 *    - All distances are in kilometers
 *    - The diagonal (distances[i][i]) is always 0 (distance to self)
 *
 * Example Usage:
 * -------------
 * 1. To find the name of location ID 1:
 *    locations.names[1]  // Returns "Santhi natha Temple, Venniyod"
 *
 * 2. To find distance from location 1 to location 2:
 *    locations.distances[1][2]  // Returns 13 (km)
 *
 * 3. To get all places within 25km of location 1:
 *    getNearbyPlaces(1)  // Returns array of nearby places sorted by distance
 *
 * Location Categories:
 * ------------------
 * The locations include:
 * - Temples (e.g., Santhi natha Temple, Thirunelly)
 * - Natural attractions (e.g., Papanasini River, Edakal Caves)
 * - Restaurants (e.g., Vantha Mess, Ramvilla Kalpetta)
 * - Religious sites (e.g., Churches, Mosques)
 * - Tourist spots (e.g., Chembra Peak, Thusharagiri)
 */

const locations = {
    // Location names mapped to their indices
    // Each location has a unique ID (1-30) and a corresponding name
    // IDs are used as keys for quick lookup
    names: {
        1: "Shanthinatha Swamy Jain Temple  Venniyod",
        2: "Ananthanatha Swamy Jain Temple Puliyarmala",
        3: "Koottamundu Glass Temple Wayanad",
        4: "Thirunelly",
        5: "Papanasini River",
        6: "Sultan's Batthery Valmiki Ashram",
        7: "Meenangadi Church and temple",
        8: "Pallikunnu church",
        9: "Pulpally Sitadevi temple",
        10: "Trikaipatta temple",
        11: "Trishileri temple",
        12: "Sita Lav Kush Temple ponkuzhy",
        13: "Varampatta mosque",
        14: "Valliyoorkavu temple",
        15: "Kuruwa Deep",
        16: "Thusharagiri",
        17: "Brahmagiri",
        18: "Chembrapeak Near Mippady town",
        19: "Cheengeri Hill",
        20: "Lakkidi Ghats",
        21: "Edakal Caves",
        22: "Cheengeri hills",
        23: "Puliyarmala",
        24: "Mananthavady Pazhassi Tomb",
		25: "Chain tree",
		26: "Tea Museum wayanad",
		27: "Heritage Museum",
		28: "Wayanad wild life sanctuary Near to Muthanga",
		29: "Nagarhole wild life sanctury",
		30: "Pakshipathalam",
		31: "Tholpetty wild life sanctuary",
		32: "Begur wild life sanctuary",
		33: "Meen Mutty Waterfalls",
		34: "Sentinel Rock Waterfall",
		35: "Soochipara Water falls",
		36: "Cheeyambam waterfalls                  ",
		37: "Kanthanpara waterfalls                 ",
		38: "Kappikalam waterfalls                  ",
		39: "Karland chira    wayanad                  ",
		40: "Arripara falls ",
		41: "Irrupu falls ",
		42: "chetalayam falls ",
		43: "Karapuzhs Dam",
		44: "Pookode Lake",
		45: "Banasurasagar Dam",
		46: "Mailadippara",
		47: "Banasura Sagar Hills                   ",
		48: "Manjappara wayanad",
		491: "Chundail Tea Estate",
		50: "Phanthom rock",
		51: "Kurumbalakotta ",
		52: "Karlad Lake",
		53: "Attamala View Point",
		54: "Sunrise valley",
		55: "Neelimala view point",
		56: "Lakkidi view point",
		57: "En ooru ",
		58: "900 Kandi",
		59: "Uravu",
		60: "Chundale",
		61: "Tea Plantation wayanad",
		62: "Coffee Plantation",
		63: "Boys Town",
		64: "Ambalavayal Farm ",
		65: "Vanitha Mess Resturant -Veg-Non Veg",
		66: "Ramvilla Kalpetta ",
		67: "Nesto All Food",
		68: "Avil Milk,Deserts",
		69: "Ruchi Pura",
		70: "zipline",
		71: "Black & White ( Kalpetta)",
		72: "Manathavady",
		73: "Sulthan Batery",
    },

    // Distance matrix where distances[i][j] represents the distance from location i to j
    // For example:
    // - distances[1][2] = 13 means it's 13km from Santhi natha Temple to Ananthanatha Swami temple
    // - distances[1][1] = 0 means distance from a location to itself is always 0
    // - distances[1][4] = 65 means it's 65km from Santhi natha Temple to Thirunelly
    // All distances are in kilometers
    distances: {
        1: [0,12,23,41,41,30,20,5,26,21,28,48,12,20,26,43,42,31,28,26,32,28,12,20,28,11,28,45,48,45,40,30,29,37,36,35,33,16,25,49,53,35,22,25,11,14,20,30,20,26,7,9,38,41,39,29,25,36,21,19,30,17,33,28,,,,,,,,,],
        2: [12,0,11,44,44,26,11,8,26,9,32,38,21,23,29,34,45,21,18,20,22,19,1,27,19,15,18,35,51,47,43,33,40,27,27,32,22,17,20,41,56,32,13,17,24,3,33,21,10,17,14,18,29,30,31,21,20,24,18,10,10,5,40,20,,,,,,,,,],
        3: [23,11,0,55,55,39,20,19,36,17,42,48,27,34,39,28,55,14,25,14,29,25,10,37,13,11,24,44,62,0,54,43,46,21,20,40,16,14,13,34,67,41,22,10,28,8,33,22,4,25,24,20,22,20,23,14,13,18,17,4,4,1,40,23,,,,,,,7,37,30],
        4: [41,44,55,0,0,39,47,41,35,53,21,70,43,25,21,79,1,65,56,65,59,56,45,25,64,56,56,67,22,0,18,18,46,71,71,51,74,56,64,86,27,51,55,61,46,47,43,58,55,54,40,50,73,71,67,65,64,69,53,55,54,48,37,56,,,,,,,48,25,53],
		5: [41,44,55,0,0,39,47,41,35,53,21,70,43,25,21,79,1,65,56,65,59,56,45,25,64,56,56,67,22,0,18,18,46,71,71,51,74,56,64,86,27,51,55,61,46,47,43,58,55,54,40,50,73,71,67,65,64,69,53,55,54,48,37,56,0,0,0,0,0,0,0,0,0],
		6: [30,26,39,39,0,0,20,24,5,29,29,39,41,41,24,63,40,45,27,48.3,30,27,30,27,47,37,27,35,18,0,38,27,48,51,51,13,47,40,37,69,60,13,27,44,41,30,42,28,38,25,30,38,53,41,38,48,47,49,28,38,38,29,40,27,,,,,,,32,27,23],
		7: [20,11,20,47,0,20,0,17,22,11,39,27,35,27,34,45,49,31,8,30,11,8,12,31,30,25,8,24,56,0,48,37,47,37,37,22,26,27,30,51,61,22,1,26,35,12,40,9,20,6,23,28,35,21,19,30,29,31,10,20,20,11,43,8,,,,,,,14,30,10],
		8: [5,8,19,41,0,24,17,0,26,17,28,48,16,20,25,45,41,29,27,31,32,30,30,23,45,40,24,41,47,0,39,29,32,37,35,30,30,17,28,49,52,30,21,25,16,11,26,26,19,22,6,13,39,37,35,29,28,33,17,19,19,13,32,25,,,,,,,12,19,27],
		9: [26,26,36,35,0,5,22,26,0,32,25,41,37,20,20,60,35,46,30,46,33,30,30,23,23,37,30,38,42,0,35,23,44,53,53,16,48,41,45,67,46,16,30,42,37,28,38,31,36,27,25,35,56,44,41,46,45,50,34,36,35,27,35,30,,,,,,,30,23,26],
		10: [21,9,17,53,0,29,11,17,32,0,40,40,33,39,37,43,53,17,11,28,21,11,10,35,27,23,12,35,60,0,52,41,49,22,22,31,15,25,27,49,64,31,6,24,32,10,39,14,18,16,22,26,24,19,23,28,27,20,1,18,17,8,48,13,,,,,,,12,35,21],
		11: [28,32,42,21,0,29,39,28,25,40,0,60,28,9,13,67,22,53,44,53,47,44,32,9,51,40,43,57,30,0,21,11,30,60,60,41,62,42,52,73,34,41,44,49,30,35,29,45,42,41,25,36,61,56,55,53,56,57,40,42,42,36,16,44,,,,,,,36,9,43],
		12: [48,38,48,70,0,39,27,48,41,40,60,0,62,52,55,72,70,52,31,58,31,30,40,56,57,52,28,4,77,0,69,58,71,57,57,31,47,55,57,79,82,31,34,54,62,40,65,30,48,29,50,56,59,41,40,58,57,55,38,48,47,39,67,29,,,,,,,41,55,18],
		13: [12,21,27,43,0,41,35,16,37,33,28,62,0,21,32,47,42,39,44,34,43,44,24,17,48,18,42,59,49,0,41,30,19,45,45,47,40,20,32,54,54,47,37,29,4,23,8,44,23,40,15,11,47,44,48,32,31,43,33,23,23,28,30,43,,,,,,,21,17,45]

    }


};

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
function getNearbyPlaces(locationId, maxDistance = 25) {
    const nearbyPlaces = [];
    const distances = locations.distances[locationId];
    //alert("distances"+distances)
    //alert("locationId"+locationId);



    for (let i = 1; i <= Object.keys(locations.names).length; i++) {

        if (distances[i-1] <= maxDistance && i !== locationId) {

			// alert(locations.names[i]);

            nearbyPlaces.push({
                id: i,
                name: locations.names[i],
                distance: distances[i-1]
            });
        }
    }

    return nearbyPlaces.sort((a, b) => a.distance - b.distance);
}

