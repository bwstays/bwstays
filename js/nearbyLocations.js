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
        1: "Santhi natha Temple, Venniyod",
        2: "Ananthanatha Swami temple, Puliyarmala",
        3: "Glass temple of kottumude-jain",
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
        20: "Ghats",
        21: "Edakal Caves",
        22: "Cheengeri hills",
        23: "Puliyarmala",
        24: "Boys Town",
        25: "Ambalavayal Farm",
        26: "Vantha Mess, Restaurant -Veg-Non Veg",
        27: "Ramvilla Kalpetta (Morn/Afternoon), Restaurant -Veg",
        28: "Nesto, All Food",
        29: "Avil Milk, Deserts",
        30: "Ruchi Pura, Restaurant -Veg-Non Veg"
    },

    // Distance matrix where distances[i][j] represents the distance from location i to j
    // For example:
    // - distances[1][2] = 13 means it's 13km from Santhi natha Temple to Ananthanatha Swami temple
    // - distances[1][1] = 0 means distance from a location to itself is always 0
    // - distances[1][4] = 65 means it's 65km from Santhi natha Temple to Thirunelly
    // All distances are in kilometers
    distances: {
        1: [0, 13, 24, 65, 66, 32, 13, 14, 34, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        2: [13, 0, 24, 65, 66, 32, 13, 14, 34, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        3: [24, 24, 0, 65, 66, 32, 13, 14, 34, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        4: [65, 65, 65, 0, 1, 32, 13, 14, 34, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        5: [66, 66, 66, 1, 0, 32, 13, 14, 34, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        6: [32, 32, 32, 32, 32, 0, 13, 14, 34, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        7: [13, 13, 13, 13, 13, 13, 0, 14, 34, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        8: [14, 14, 14, 14, 14, 14, 14, 0, 34, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        9: [34, 34, 34, 34, 34, 34, 34, 34, 0, 11, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        10: [11, 11, 11, 11, 11, 11, 11, 11, 11, 0, 36, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        11: [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 0, 33, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        12: [33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 0, 22, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        13: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 0, 31, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        14: [31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 0, 35, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        15: [35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 0, 31, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        16: [31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 0, 49, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        17: [49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 49, 0, 15, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        18: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 8, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        19: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 15, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        20: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 27, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        21: [27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 0, 23, 3, 45, 25, 1, 1, 1, 1, 20],
        22: [23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 0, 3, 45, 25, 1, 1, 1, 1, 20],
        23: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 45, 25, 1, 1, 1, 1, 20],
        24: [45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 0, 25, 1, 1, 1, 1, 20],
        25: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 0, 1, 1, 1, 1, 20],
        26: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 20],
        27: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 20],
        28: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 20],
        29: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 20],
        30: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 0]
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
    
    for (let i = 1; i <= Object.keys(locations.names).length; i++) {
        if (distances[i-1] <= maxDistance && i !== locationId) {
            nearbyPlaces.push({
                id: i,
                name: locations.names[i],
                distance: distances[i-1]
            });
        }
    }
    
    return nearbyPlaces.sort((a, b) => a.distance - b.distance);
}

