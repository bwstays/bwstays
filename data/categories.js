/**
 * The types of place on the site: one label, one Font Awesome icon and one photo each.
 * Single source for every page that names a type of place: the home page "Discover" rows, the place pages
 * ("Type", "... Places"), the all-locations map filters, the trails planner (through data/map-places.json,
 * written by scripts/build-map-data.mjs from this file).
 *
 * Keys are the category keys of data/sitedata.js; `short` is an optional shorter name for small tiles. The photos are the ones the home page shows for each row.
 * After a change: node scripts/build-map-data.mjs, node scripts/minify-assets.mjs, node scripts/version-assets.mjs,
 * node scripts/prerender.mjs; a new icon also needs python scripts/build-fontawesome.py.
 */
const bwCategories = {
  plantation: { label: 'Plantations', icon: 'fa-leaf', img: 'assets/img/plantation/bw-hotel-tea-plantaion-tour-wayanad.webp' },
  waterfalls: { label: 'Waterfalls & Lakes', icon: 'fa-water', img: 'assets/img/falls/bw-stays-thusharagiri-falls-service-apartment.webp' },
  museums: { label: 'Museums & Crafts', icon: 'fa-landmark', img: 'assets/img/museum/bw-stays-wayanad-heritage-museum.webp' },
  romantic: { label: 'Viewpoints & Romantic Spots', short: 'Viewpoints', icon: 'fa-mountain', img: 'assets/img/romantic/bw-kalpetta-neelimala-view-point-wayanad.webp' },
  culthist: { label: 'Culture & History', icon: 'fa-monument', img: 'assets/img/heritage/bw-stays-chain-tree-service-apartment.webp' },
  trucking: { label: 'Trekking', icon: 'fa-hiking', img: 'assets/img/trucking/bw-staycation-edakkal-caves-wayanad.webp' },
  wildlife: { label: 'Wildlife', icon: 'fa-paw', img: 'assets/img/wildlife/bw-weekday-pakshipathalam-bird-sanctuary-wayanad.webp' },
  farms: { label: 'Farm Visits', icon: 'fa-tractor', img: 'assets/img/farm/bw-gurukula-botanical-sanctuary-wayanad.webp' },
  sporting: { label: 'Adventure Sports', icon: 'fa-running', img: 'assets/img/sports/bw-villa-wayanad-tourism-rop-cycle.webp' },
  food: { label: 'Restaurants', icon: 'fa-utensils', img: 'assets/img/food/bw-kalpetta-food-drinks-collage-all-images.webp' },
  tribal: { label: 'Tribal Heritage', icon: 'fa-feather-alt', img: 'assets/img/tribal/bw-bamboo-uravu-thrikkaipetta-wayanad.webp' },
  cycling: { label: 'Cycling', icon: 'fa-bicycle', img: 'assets/img/cycling/bw-hotel-stays-chundale-wayanad.webp' },
  shopping: { label: 'Shopping', icon: 'fa-shopping-bag', img: 'assets/img/shopping/bw-ali-s-wayanadan-natural-honey-wayanad-honey.webp' },
  pilgrimage: { label: 'Pilgrimage', icon: 'fa-place-of-worship', img: 'assets/img/pilgrimage/bw-staycation-meenagadhi-church-wayanad.webp' },
  health: { label: 'Health & Wellness', icon: 'fa-spa', img: 'assets/img/health/bw-keluvaidyar-kattikulam-tribal-healer-wayanad.webp' },
};
