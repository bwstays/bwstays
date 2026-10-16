/* BWStays service worker.
 *
 * GENERATED: /sw.js is built from this template by `node scripts/build-pwa.mjs`.
 * Edit this file (scripts/pwa/sw.template.js), never /sw.js.
 *
 * Strategy
 *   shell   (css, js, fonts, vendor libraries, small data files, offline page)
 *           precached at install, cache-first; a new VERSION replaces the old shell.
 *   pages   (every HTML page) network-first with a short timeout, then the saved copy,
 *           then /offline.html. Pages visited once are saved; the rest of the site is
 *           saved in the background after the first load (message SYNC_SITE).
 *   data    (availability, stations, places) network-first, saved copy when offline.
 *   images  cache-first, saved on first view (and in the background sync), trimmed to a limit.
 *   other   map tiles and web fonts are cached at runtime within a size limit;
 *           analytics, the booking form, chat and weather requests always go to the network.
 */
const VERSION = '322234d2e6';
const SHELL_CACHE = 'bw-shell-' + VERSION;
const SITE_CACHE = 'bw-site-v1'; // saved pages and data (kept across versions)
const MEDIA_CACHE = 'bw-media-v1'; // images
const RUNTIME_CACHE = 'bw-runtime-v1'; // map tiles, web fonts, third-party static files

const SHELL = [
  "/",
  "/assets/fonts/fontawesome/fa-brands-400.woff2",
  "/assets/fonts/fontawesome/fa-solid-900.woff2",
  "/assets/img/pwa/apple-touch-icon.png",
  "/assets/img/pwa/apple-touch-icon.png",
  "/assets/img/pwa/icon-192.png",
  "/assets/img/pwa/icon-512.png",
  "/assets/img/pwa/icon-96.png",
  "/assets/img/pwa/icon-maskable-512.png",
  "/bwstays-booking.html",
  "/css/details-page.min.css?v=5416e71f",
  "/css/fontawesome.min.css?v=a611ff0d",
  "/css/maps.min.css?v=cef28474",
  "/css/new-page.min.css?v=f2e8abdc",
  "/css/page-404.min.css?v=1898d2c3",
  "/css/styles.min.css?v=42d28f62",
  "/data/nearbylocationsdata.min.js?v=07ece56e",
  "/data/rates.min.js?v=633df2f6",
  "/data/sitedata.min.js?v=3542ec90",
  "/index.html",
  "/js/booking.min.js?v=be384b4c",
  "/js/chat.min.js?v=71b140e2",
  "/js/decode-email.js",
  "/js/dynamic-evgas.min.js?v=1a3b82d4",
  "/js/dynamic-foodmap.min.js?v=e3ef5086",
  "/js/dynamic-nearby.min.js?v=d7d974bd",
  "/js/knowmore-place-dynamic.min.js?v=30af38d1",
  "/js/language.min.js?v=d8bf0fe7",
  "/js/legal-page.min.js?v=89020b58",
  "/js/map-guard.min.js?v=42197ca9",
  "/js/pdfgen.min.js?v=56444957",
  "/js/promo-banner.min.js?v=56cb74aa",
  "/js/pwa.min.js?v=9f12090c",
  "/js/scripts.min.js?v=7537fada",
  "/js/site-search.min.js?v=b67e0575",
  "/js/specrule.min.js?v=1f8a513f",
  "/js/testimonial.min.js?v=c59378fa",
  "/js/total-booking-reports.min.js?v=5527f1e2",
  "/js/validations.min.js?v=83a714d7",
  "/js/way_food_loc.min.js?v=10afad43",
  "/js/wayanad_kalpetta_trait-one.min.js?v=1bfb78be",
  "/js/widgets.min.js?v=913ebcd9",
  "/manifest.json",
  "/offline.html",
  "/vendor/bootstrap/bootstrap.bundle.min.js?v=4.5.3",
  "/vendor/bootstrap/bootstrap.min.css?v=4.5.3",
  "/vendor/jquery/jquery.easing.min.js?v=1.4.1",
  "/vendor/jquery/jquery.min.js?v=3.5.1",
  "/vendor/leaflet/leaflet-src.min.js?v=1.9.4",
  "/vendor/leaflet/leaflet.min.css?v=1.9.4"
];
const PAGES = [
  "/404.html",
  "/all-fooding-wayanad.html",
  "/all-locations-wayanad.html",
  "/bw-900-kandi-romantic-wayanad.html",
  "/bw-ali-wayanadan-honey-shopping-wayanad.html",
  "/bw-ambalavayal-farm-rars-wayanad.html",
  "/bw-ananthanatha-swamy-jain-temple-pilgrimage-wayanad.html",
  "/bw-arripara-waterfall-wayanad.html",
  "/bw-attamala-view-point-romantic-wayanad.html",
  "/bw-bamboo-forest-valentine-park-wayanad.html",
  "/bw-bamboo-rafting-sporting-wayanad.html",
  "/bw-banasura-sagar-hills-romantic-wayanad.html",
  "/bw-banasurasagar-dam-romantic-wayanad.html",
  "/bw-begur-wildlife-sanctuary-wayanad.html",
  "/bw-boys-town-farm-wayanad.html",
  "/bw-brahmagiri-trucking-wayanad.html",
  "/bw-chain-tree-cultural-heritage-wayanad.html",
  "/bw-cheengeri-hill-trucking-wayanad.html",
  "/bw-cheeyambam-waterfall-wayanad.html",
  "/bw-chembra-peak-trucking-wayanad.html",
  "/bw-chetalayam-waterfall-wayanad.html",
  "/bw-chundail-tea-estate-cycling-wayanad.html",
  "/bw-coffee-plantation-plantation-wayanad.html",
  "/bw-edakkal-caves-trucking-wayanad.html",
  "/bw-en-ooru-tribal-wayanad.html",
  "/bw-folklore-museum-wayanad.html",
  "/bw-football-turf-sporting-wayanad.html",
  "/bw-honey-museum-wayanad.html",
  "/bw-irrupu-waterfall-wayanad.html",
  "/bw-kanthanpara-waterfall-wayanad.html",
  "/bw-kappikalam-waterfall-wayanad.html",
  "/bw-karapuzha-dam-romantic-wayanad.html",
  "/bw-karland-lake-romantic-wayanad.html",
  "/bw-kolagapara-trucking-wayanad.html",
  "/bw-koottamundu-glass-temple-pilgrimage-wayanad.html",
  "/bw-kurumbalakotta-romantic-wayanad.html",
  "/bw-kuruwa-deep-trucking-wayanad.html",
  "/bw-lakkidi-ghats-view-point-wayanad.html",
  "/bw-mailadippara-romantic-wayanad.html",
  "/bw-mananthavady-pazhassi-tomb-heritage-wayanad.html",
  "/bw-manjappara-romantic-wayanad.html",
  "/bw-meenangadi-church-pilgrimage-wayanad.html",
  "/bw-meenmutty-waterfall-wayanad.html",
  "/bw-munneswaran-kunnu-romantic-wayanad.html",
  "/bw-muthanga-wildlife-sanctuary-wayanad.html",
  "/bw-nagarhole-wildlife-sanctuary-wayanad.html",
  "/bw-neelarchalu-lake-romantic-wayanad.html",
  "/bw-neelimala-view-point-romantic-wayanad.html",
  "/bw-one-day-trails-kalpetta-wayanad.html",
  "/bw-our-lady-of-lourdes-shrine-pilgrimage-wayanad.html",
  "/bw-pakshipathalam-wildlife-sanctuary-wayanad.html",
  "/bw-papanasini-river-temple-pilgrimage-wayanad.html",
  "/bw-pepper-farm-wayanad.html",
  "/bw-periya-tea-estate-plantation-wayanad.html",
  "/bw-phanthom-rock-romantic-wayanad.html",
  "/bw-pookode-lake-romantic-wayanad.html",
  "/bw-puliyarmala-trucking-wayanad.html",
  "/bw-pulpally-sitadevi-temple-pilgrimage-wayanad.html",
  "/bw-restaurants-food-wayanad.html",
  "/bw-rippon-tea-estate-plantation-wayanad.html",
  "/bw-rippon-teaestate-cycling-wayanad.html",
  "/bw-santhinatha-temple-heritage-wayanad.html",
  "/bw-sentinel-rock-waterfall-wayanad.html",
  "/bw-sita-lav-kush-temple-pilgrimage-wayanad.html",
  "/bw-soochipara-waterfall-wayanad.html",
  "/bw-stays-kalpetta-gandhi-museum.html",
  "/bw-sultan-batthery-valmiki-ashram-heritage-wayanad.html",
  "/bw-sunrise-valley-romantic-wayanad.html",
  "/bw-tea-museum-wayanad.html",
  "/bw-tholpetty-wildlife-sanctuary-wayanad.html",
  "/bw-thusharagiri-waterfall-wayanad.html",
  "/bw-tirunelli-temple-pilgrimage-wayanad.html",
  "/bw-trikaipatta-temple-pilgrimage-wayanad.html",
  "/bw-trishileri-temple-pilgrimage-wayanad.html",
  "/bw-uravu-bamboo-tribal-wayanad.html",
  "/bw-valliyoorkavu-temple-pilgrimage-wayanad.html",
  "/bw-varampatta-mosque-pilgrimage-wayanad.html",
  "/bw-ziplines-sporting-wayanad.html",
  "/bwstays-booking.html",
  "/footer.html",
  "/index.html",
  "/offline.html",
  "/reciprocal.html",
  "/reports/bwstays-total-booking.html",
  "/search.html"
];
const DATA = [
  "/data/booking-reports.json",
  "/data/ev-stations.json",
  "/data/exchange-rates.json",
  "/data/food-places.json",
  "/data/fuel-places.json",
  "/data/map-places.json",
  "/data/mcp-review.json",
  "/data/search-index.json",
  "/lang/ar.json",
  "/lang/en.json",
  "/lang/es.json",
  "/lang/fr.json",
  "/lang/hi.json",
  "/lang/ml.json",
  "/lang/ta.json"
];
const IMAGES = [
  "/assets/img/bg-masthead.webp",
  "/assets/img/bg-signup.webp",
  "/assets/img/bw-stays-ghats-travel-wayanad.webp",
  "/assets/img/cycling/bw-hotel-stays-chundale-wayanad.webp",
  "/assets/img/cycling/bw-stays-chundale-cycling-group-wayanad.webp",
  "/assets/img/cycling/bw-stays-chundale-cycling-hotel-wayanad.webp",
  "/assets/img/cycling/bw-stays-resort-wayanad-cycle-workation.webp",
  "/assets/img/ev_fuel/bampark-ev.webp",
  "/assets/img/falls/black-and-white-chethalayam-falls-wayanad.webp",
  "/assets/img/falls/black-and-white-kanthanpara-falls-wayanad.webp",
  "/assets/img/falls/bw-homestay-kappikalam-wayanad.webp",
  "/assets/img/falls/bw-homestay-soojipara-waterfalls-wayanad.avif",
  "/assets/img/falls/bw-service-apartment-soochipara-wayanad.webp",
  "/assets/img/falls/bw-stays-arripa-falls-kalpetta.webp",
  "/assets/img/falls/bw-stays-chethalayam-waterfall-homestay.webp",
  "/assets/img/falls/bw-stays-irupu-falls-wayanad-inn.webp",
  "/assets/img/falls/bw-stays-kanthanpara-waterfalls-kalpetta.webp",
  "/assets/img/falls/bw-stays-kanthanpara-waterfalls-wayanad.webp",
  "/assets/img/falls/bw-stays-kanthanpara-waterfalls.webp",
  "/assets/img/falls/bw-stays-meenmutty-falls-wayanad.webp",
  "/assets/img/falls/bw-stays-meenmutty-homestay-wayanad.webp",
  "/assets/img/falls/bw-stays-meenmutty-waterfall-wayanad.webp",
  "/assets/img/falls/bw-stays-sentinal-waterfall-wayanad.webp",
  "/assets/img/falls/bw-stays-thusharagiri-falls-service-apartment.webp",
  "/assets/img/farm/bw-gurukula-botanical-sanctuary-wayanad.webp",
  "/assets/img/farm/bw-stays-boys-town-farm-wayanad.webp",
  "/assets/img/farm/bw-stays-pepper-farm-wayanad.webp",
  "/assets/img/farm/bw-stays-rars-wayanad-ambalavayal.webp",
  "/assets/img/food/bw-kalpetta-food-drinks-collage-all-images.webp",
  "/assets/img/food/bw-stay-nearby-food-restaurant.webp",
  "/assets/img/food/bw-stays-hotel-wayanad-inn.webp",
  "/assets/img/heritage/bw-homestay-shanthinatha-jain-temple-wayanad.webp",
  "/assets/img/heritage/bw-stays-chain-tree-service-apartment.webp",
  "/assets/img/heritage/bw-stays-chain-tree-wayanad-homestay.webp",
  "/assets/img/heritage/bw-stays-pazhassi-tomb-wayanad-resort.webp",
  "/assets/img/heritage/bw-stays-shanthinatha-jain-temple-kalpetta.webp",
  "/assets/img/heritage/bw-stays-shanthinatha-jain-temple-wayanad.webp",
  "/assets/img/heritage/bw-stays-valmiki-ashramam-tourist.webp",
  "/assets/img/heritage/bw-workation-pazhassi-tomb-wayanad.webp",
  "/assets/img/icons/aami12-16-512.webp",
  "/assets/img/icons/apple/apple-touch-icon-114x114.png",
  "/assets/img/icons/apple/apple-touch-icon-120x120.png",
  "/assets/img/icons/apple/apple-touch-icon-144x144.png",
  "/assets/img/icons/apple/apple-touch-icon-152x152.png",
  "/assets/img/icons/apple/apple-touch-icon-180x180.png",
  "/assets/img/icons/apple/apple-touch-icon-57x57.png",
  "/assets/img/icons/apple/apple-touch-icon-60x60.png",
  "/assets/img/icons/apple/apple-touch-icon-72x72.png",
  "/assets/img/icons/apple/apple-touch-icon-76x76.png",
  "/assets/img/icons/bw.svg",
  "/assets/img/icons/cloudy.webp",
  "/assets/img/logo.webp",
  "/assets/img/logo/direction.webp",
  "/assets/img/logo/pin-drop.png",
  "/assets/img/logo/pin.png",
  "/assets/img/logo/pin.webp",
  "/assets/img/museum/bw-guesthouse-wayanad-heritage-museum-ambalavayal.webp",
  "/assets/img/museum/bw-kunkichira-heritage-museum-at-periya-wayanad.webp",
  "/assets/img/museum/bw-stays-honey-museum-wayanad.webp",
  "/assets/img/museum/bw-stays-kalpetta-gandhi-museum.webp",
  "/assets/img/museum/bw-stays-wayanad-heritage-homestay.webp",
  "/assets/img/museum/bw-stays-wayanad-heritage-museum.webp",
  "/assets/img/museum/bw-stays-wayanad-tea-museum.webp",
  "/assets/img/pilgrimage/bw-seetha-lava-kusha-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-staycation-meenagadhi-church-wayanad.webp",
  "/assets/img/pilgrimage/bw-staycation-papanashini-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-anantha-swami-jain-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-korome-mosque-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-lava-kush-ponkuzhi-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-pallikunnu-church-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-papanasini-thirunelli-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-papanasini-wayanad-tourist.webp",
  "/assets/img/pilgrimage/bw-stays-resort-valliyurkavu-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-thirunelli-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-tirunelli-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-trikaipattta-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-trishilerry-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-varambetta-mosque-wayanad.webp",
  "/assets/img/pilgrimage/bw-stays-wayanad-varambetta-mosque.webp",
  "/assets/img/pilgrimage/bw-valliyoorkavu-bhagavathy-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-valliyoorkavu-homestay-wayanad.webp",
  "/assets/img/pilgrimage/bw-valliyurkavu-bhagavathy-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-workation-jain-glass-temple-wayanad.webp",
  "/assets/img/pilgrimage/bw-workation-korome-mosque-wayanad.webp",
  "/assets/img/pilgrimage/bw-workation-pallikkunnu-church-wayanad.webp",
  "/assets/img/pilgrimage/bw-workation-trishilerry-temple-wayanad.webp",
  "/assets/img/plantation/bw-destination-wayanad.webp",
  "/assets/img/plantation/bw-hotel-tea-plantaion-tour-wayanad.webp",
  "/assets/img/plantation/bw-hotel-tea-plantation-wayanad.webp",
  "/assets/img/plantation/bw-periya-estate-wyanad.webp",
  "/assets/img/plantation/bw-stays-coffee-estate-forest.webp",
  "/assets/img/plantation/bw-stays-estate-green-stay-kalpetta-wayanad.webp",
  "/assets/img/plantation/bw-stays-tea-kalpetta-wayanad.webp",
  "/assets/img/plantation/bw-stays-tea-vythiri-wayanad.webp",
  "/assets/img/plantation/bw-tea-estate-kalpetta-india.webp",
  "/assets/img/romantic/black-and-white-mailadanpara-wayanad.webp",
  "/assets/img/romantic/black-and-white-nellarachal-wayanad.webp",
  "/assets/img/romantic/bw-holiday-longstay-manjapara-viewpoint.webp",
  "/assets/img/romantic/bw-kalpetta-neelimala-view-point-wayanad.webp",
  "/assets/img/romantic/bw-lakkidi-view-point-wayanad.webp",
  "/assets/img/romantic/bw-muneeswarankunnu-muneeswaran-wayanad.webp",
  "/assets/img/romantic/bw-resort-banasura-sagar-dam-homestay.webp",
  "/assets/img/romantic/bw-resort-phanthom-rock-wayanad.webp",
  "/assets/img/romantic/bw-rooms-karlad-lake-wayanad.webp",
  "/assets/img/romantic/bw-service-apartment-wayanad-karappuzha-dam.webp",
  "/assets/img/romantic/bw-staycation-banasura-sagar-dam-wayanad.webp",
  "/assets/img/romantic/bw-staycation-banasura-sagar-wayanad.webp",
  "/assets/img/romantic/bw-staycation-karapuzha-dam.webp",
  "/assets/img/romantic/bw-stays-900-thollayiram-kandi-wayanad.webp",
  "/assets/img/romantic/bw-stays-attamala-resort-wayanad.avif",
  "/assets/img/romantic/bw-stays-banasura-sagar-dam-wayanad.webp",
  "/assets/img/romantic/bw-stays-ghats-viewpoint-wayanad.webp",
  "/assets/img/romantic/bw-stays-karlad-lake-wayanad-tourism.webp",
  "/assets/img/romantic/bw-stays-mullanpara-viewpoint-wayanad.webp",
  "/assets/img/romantic/bw-stays-neelimala-view-point-wayanad.webp",
  "/assets/img/romantic/bw-stays-pookode-lake-wayanad.webp",
  "/assets/img/romantic/bw-stays-sunrise-valley-wayanad.webp",
  "/assets/img/romantic/bw-vacation-pookode-lake-wayanad.webp",
  "/assets/img/romantic/bw-villa-holiday-munnewaram-hill.webp",
  "/assets/img/romantic/bw-villa-home-banasura-hills.webp",
  "/assets/img/romantic/bw-weekend-destination-glassbridge-wayanad.webp",
  "/assets/img/romantic/bw-weekend-kurumbalakotta-wayanad.webp",
  "/assets/img/romantic/bw-workation-bamboo-park-wayanad.webp",
  "/assets/img/shopping/bw-ali-s-wayanadan-natural-honey-wayanad-honey.webp",
  "/assets/img/shopping/bw-shopping-nesto-wayanad.webp",
  "/assets/img/shopping/bw-whole-spices-wholesale-kalpetta-wayanad.webp",
  "/assets/img/shopping/cyrup.webp",
  "/assets/img/shopping/photo-coming-soon.svg",
  "/assets/img/sports/bw-green-grass-football-wayanad.webp",
  "/assets/img/sports/bw-stay-bamboo-sport-rafting-wayanad.webp",
  "/assets/img/sports/bw-stay-zipline-vytiri-wayanad.webp",
  "/assets/img/sports/bw-villa-bamboo-sport-rafting-wayanad.webp",
  "/assets/img/sports/bw-villa-wayanad-tourism-rop-cycle.webp",
  "/assets/img/stays/bw-stays-manathavady.webp",
  "/assets/img/stays/bw-stays-old-kalpetta-town.webp",
  "/assets/img/stays/bw-stays-sulthan-bathery.webp",
  "/assets/img/tribal/bw-bamboo-uravu-thrikkaipetta-wayanad.webp",
  "/assets/img/tribal/bw-homestay-en-ooru-tribal-heritage-village-wayanad.webp",
  "/assets/img/tribal/bw-service-apartment-uravu-thrikkaipetta-bamboo-wayanad.webp",
  "/assets/img/tribal/bw-stay-uravu-thrikkaipetta-wayanad-factory.webp",
  "/assets/img/tribal/bw-workation-uravu-thrikkaipetta-bamboo-wayanad-1.webp",
  "/assets/img/trucking/bw-destination-chembra-wayanad.webp",
  "/assets/img/trucking/bw-homestay-kerala-wayanad-edakkal-caves.webp",
  "/assets/img/trucking/bw-kuruva-island-wayanad-2.webp",
  "/assets/img/trucking/bw-kuruva-island-wayanad.webp",
  "/assets/img/trucking/bw-service-villa-brahmagiri-hills-wayanad.webp",
  "/assets/img/trucking/bw-service-villa-kolagappara-wayanad.webp",
  "/assets/img/trucking/bw-staycation-edakkal-caves-wayanad.webp",
  "/assets/img/trucking/bw-stays-ghats-wayanad.webp",
  "/assets/img/trucking/bw-weekend-destination-cheengeri-hills.webp",
  "/assets/img/villa1/black-and-white-wayanad-mist.webp",
  "/assets/img/villa1/bw-destination-chembra-wayanad.webp",
  "/assets/img/wildlife/bw-food-stay-muthanga-wildlife-wayanad.webp",
  "/assets/img/wildlife/bw-homestays-nagarhole-wayanad-wildlife-sanctuary.webp",
  "/assets/img/wildlife/bw-kerala-begur-wildlife-sanctuary-wayanad.webp",
  "/assets/img/wildlife/bw-team-event-tholpetty-wildlife-sanctuary-wayanad.webp",
  "/assets/img/wildlife/bw-villas-pakshipathalam-wayanad.webp",
  "/assets/img/wildlife/bw-weekday-pakshipathalam-bird-sanctuary-wayanad.webp",
  "/favicon.ico"
];
const EXTERNAL = [
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.6.13/flatpickr.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/5.0.2/jspdf.plugin.autotable.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
]; // static libraries on a public CDN that some pages load
// availability files change with every booking, so they are not listed in this file
const FRESH_FILES = ['/data/bookingdata.min.js', '/data/closeddata.min.js', '/data/pendingdata.min.js'];

const OFFLINE_URL = '/offline.html';
const NETWORK_TIMEOUT_MS = 4000;
const MAX_MEDIA_ENTRIES = 600;
const MAX_RUNTIME_ENTRIES = 160;
const FRESH_DATA = /\/data\/(bookingdata|closeddata|pendingdata)(\.min)?\.js/;
const DATA_PATH = /\/data\/[^/]+\.(json|js)$|\/llms-full\.txt$/;
// files that are not versioned with ?v= and must not stay stale in the saved copy: manifest, translations, MCP / AI files, sitemaps
const LIVE_FILES = /^\/(manifest\.json|lang\/[^/]+\.json|llms\.txt|mcp\.json|sitemap[^/]*\.(xml|txt)|resources\/.+\.json|tools\/.+\.json|\.well-known\/.+)$/;
const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i;
const RUNTIME_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'tile.openstreetmap.org',
  'maps.google.com',
];

// ---------------------------------------------------------------- helpers
function pageKey(url) {
  const u = new URL(url, self.location.origin);
  let p = u.pathname;
  if (p.endsWith('/')) p += 'index.html';
  return new Request(u.origin + p);
}

// The copy must be taken BEFORE the first await: callers hand the response to the page right after calling this
// (handleNavigation returns it), and once the page starts reading the body a later clone() throws
// "Response body is already used".
async function putIfOk(cacheName, request, response) {
  if (!response || !(response.ok || response.type === 'opaque')) return;
  const copy = response.clone();
  const cache = await caches.open(cacheName);
  await cache.put(request, copy);
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function matchAny(request, opts) {
  return caches.match(request, opts || {});
}

// ---------------------------------------------------------------- lifecycle
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // one failed file must not block the whole install; only the offline page is required
    const results = await Promise.allSettled(SHELL.map(async (url) => {
      const res = await fetch(url, { cache: 'reload' });
      if (!res.ok) throw new Error(url + ' ' + res.status);
      await cache.put(url, res);
    }));
    if (!(await cache.match(OFFLINE_URL))) throw new Error('offline page could not be saved');
    return results;
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith('bw-shell-') && n !== SHELL_CACHE)
      .map((n) => caches.delete(n)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) { /* optional */ }
    }
    await self.clients.claim();
  })());
});

// ---------------------------------------------------------------- fetch
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname === '/sw.js') return;
    if (request.mode === 'navigate') {
      event.respondWith(handleNavigation(event));
    } else if (FRESH_DATA.test(url.pathname) || DATA_PATH.test(url.pathname) || LIVE_FILES.test(url.pathname)) {
      event.respondWith(networkFirst(request));
    } else if (IMAGE_EXT.test(url.pathname) || request.destination === 'image') {
      event.respondWith(cacheFirst(request, MEDIA_CACHE, MAX_MEDIA_ENTRIES));
    } else {
      event.respondWith(cacheFirst(request, SITE_CACHE, 0));
    }
    return;
  }
  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE, MAX_RUNTIME_ENTRIES));
  }
  // everything else (analytics, forms, chat, weather, rates) goes straight to the network
});

async function handleNavigation(event) {
  const request = event.request;
  const key = pageKey(request.url);
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const response = preload || await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    if (response && response.ok) {
      event.waitUntil(putIfOk(SITE_CACHE, key, response));
      return response;
    }
    // a server error page should not hide a saved copy
    const saved = await matchAny(key);
    return saved || response;
  } catch (err) {
    const saved = await matchAny(key, { ignoreSearch: true });
    if (saved) return saved;
    const fallback = await matchAny(OFFLINE_URL);
    return fallback || new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function networkFirst(request) {
  try {
    const response = await withTimeout(fetch(request), 5000);
    if (response && response.ok) await putIfOk(SITE_CACHE, request, response);
    return response;
  } catch (err) {
    const saved = (await matchAny(request)) || (await matchAny(request, { ignoreSearch: true }));
    if (saved) return saved;
    throw err;
  }
}

async function cacheFirst(request, cacheName, max) {
  const hit = await matchAny(request);
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      await putIfOk(cacheName, request, response);
      if (max) trim(cacheName, max);
    }
    return response;
  } catch (err) {
    // offline: an older copy of the same file (different ?v= hash) is better than nothing
    const older = await matchAny(request, { ignoreSearch: true });
    if (older) return older;
    throw err;
  }
}

// ---------------------------------------------------------------- background sync of the whole site
let syncing = false;

async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage(message));
}

async function syncSite() {
  if (syncing) return;
  syncing = true;
  const jobs = [];
  PAGES.forEach((u) => jobs.push({ url: u, cache: SITE_CACHE, page: true }));
  DATA.forEach((u) => jobs.push({ url: u, cache: SITE_CACHE, page: false }));
  FRESH_FILES.forEach((u) => jobs.push({ url: u, cache: SITE_CACHE, page: false, refresh: true }));
  EXTERNAL.forEach((u) => jobs.push({ url: u, cache: RUNTIME_CACHE, page: false }));
  IMAGES.forEach((u) => jobs.push({ url: u, cache: MEDIA_CACHE, page: false }));
  const total = jobs.length;
  let done = 0;
  let failed = 0;
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      try {
        const key = job.page ? pageKey(job.url) : new Request(job.url);
        const cache = await caches.open(job.cache);
        const existing = job.page || job.refresh ? null : await cache.match(key);
        if (!existing) {
          // pages are revalidated (cheap 304 when unchanged); files with a ?v= hash never change
          const res = await fetch(job.url, job.page || job.refresh ? { cache: 'no-cache' } : undefined);
          if (res.ok) await cache.put(key, res);
          else failed++;
        }
      } catch (e) {
        failed++;
      }
      done++;
      if (done % 10 === 0 || done === total) broadcast({ type: 'SYNC_PROGRESS', done, total });
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  await trim(MEDIA_CACHE, MAX_MEDIA_ENTRIES);
  syncing = false;
  broadcast({ type: 'SYNC_DONE', done, total, failed, version: VERSION });
}

async function status() {
  const site = await caches.open(SITE_CACHE);
  const media = await caches.open(MEDIA_CACHE);
  const siteKeys = await site.keys();
  const pages = siteKeys.filter((r) => /\.html$/.test(new URL(r.url).pathname)).length;
  return { version: VERSION, pages, totalPages: PAGES.length, images: (await media.keys()).length, totalImages: IMAGES.length };
}

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'SYNC_SITE') {
    event.waitUntil(syncSite());
  } else if (data.type === 'STATUS') {
    event.waitUntil(status().then((s) => event.source && event.source.postMessage({ type: 'STATUS', ...s })));
  }
});
