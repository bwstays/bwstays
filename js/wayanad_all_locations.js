var iconURLPrefix = 'https://www.bwstays.com/';

var loc = [];
var wayalocations = [

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-rippon-tea-estate-plantation-wayanad.html" title="Shanthinatha Swamy Jain Temple">Shanthinatha Swamy Jain Temple</a></h6><span>10km</span><a target="_blank" href="'+iconURLPrefix+'bw-rippon-tea-estate-plantation-wayanad.html" title="Shanthinatha Swamy Jain Temple"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/heritage/bw-stays-jain-temple-shanthi-wayanad.webp" width="300" ></a>', 11.6788328, 76.0221398, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Shanthinatha Swamy Jain Temple"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-puliyarmala-trucking-wayanad.html" title="Puliyarmala">Puliyarmala</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-puliyarmala-trucking-wayanad.html" title="Puliyarmala"><img title="Black and White Stays Service Villa"   alt="Black and White Stays Wayanad"  src="'+iconURLPrefix+'assets/img/trucking/bw-staycation-edakkal-caves-wayanad.webp" width="300" ></a>', 11.6268407, 76.08420612038587, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Puliyarmala"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-tea-museum-wayanad.html" title="Tea Museum">Tea Museum</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-tea-museum-wayanad.html" title="Tea Museum"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/museum/bw-stays-wayanad-tea-museum.webp" width="300" ></a>', 11.600747990313033, 76.0148553711638, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Tea Museum"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-ananthanatha-swamy-jain-temple-pilgrimage-wayanad.html" title="Ananthanatha Swamy Jain Temple Puliyarmala">Ananthanatha Swamy Jain Temple Puliyarmala</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-ananthanatha-swamy-jain-temple-pilgrimage-wayanad.html" title="Ananthanatha Swamy Jain Temple Puliyarmala"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/heritage/bw_Anantnatha_Swami_Jain_temple.avif" width="300" ></a>', 11.6963, 76.1411, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Ananthanatha Swamy Jain Temple Puliyarmala"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-koottamundu-glass-temple-pilgrimage-wayanad.html" title="Koottamundu Glass Temple Wayanad">Koottamundu Glass Temple</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-koottamundu-glass-temple-pilgrimage-wayanad.html" title="Koottamundu Glass Temple"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-workation-jain-glass-temple-wayanad.webp" width="300"></a>',11.571875045855256,76.08657265424115,2,iconURLPrefix+"assets/img/logo/pin-drop.png","Koottamundu Glass Temple Wayanad"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-banasura-sagar-hills-romantic-wayanad.html" title="Banasura Hills">Banasura Hills</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-banasura-sagar-hills-romantic-wayanad.html" title="Banasura Hills"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-villa-home-banasura-hills.webp" width="300" ></a>', 11.695175204242553, 75.90797008546211, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Banasura Hills"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-cheengeri-hill-trucking-wayanad.html" title="Cheengeri">Cheengeri</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-cheengeri-hill-trucking-wayanad.html" title="Cheengeri"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/trucking/bw-weekend-destination-cheengeri-hills.webp" width="300" ></a>', 11.619354812785145, 76.19931730771042, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Cheengeri"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-cheeyambam-waterfall-wayanad.html" title="Cheeyambam waterfalls">Cheeyambam waterfalls</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-cheeyambam-waterfall-wayanad.html" title="Cheeyambam waterfalls"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-stays-cheeyappara-waterfalls-wayanad.avif" width="300" ></a>', 11.766189025300932, 76.25203494478279, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Cheeyambam waterfalls"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-brahmagiri-trucking-wayanad.html" title="Brahmagiri Hills">Brahmagiri Hills</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-brahmagiri-trucking-wayanad.html" title="Brahmagiri Hills"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"  alt="Black and White Stays Wayanad"  src="'+iconURLPrefix+'assets/img/trucking/bw-service-villa-brahmagiri-hills-wayanad.webp" width="300" ></a>', 11.932026, 75.994078, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Brahmagiri Hills"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-chembra-peak-trucking-wayanad.html" title="Chembra Peak">Chembra Peak</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-chembra-peak-trucking-wayanad.html" title="Chembra Peak"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/trucking/bw-homestay-chembra-wayanad.webp" width="300" ></a>', 11.5472138, 76.0827242, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Chembra Peak"],

['<h6><a target="_blank" href="https://www.bwstays.com" title="Black & White">Black & White</a><span>10km</span></h6><a target="_blank" href="'+iconURLPrefix+'assets/img/romantic/bw-service-villa-chembra-peak-wayanad.webp" title="BW"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/bw.avif" width="300" ></a>', 11.605943, 76.083429, 2, iconURLPrefix+"assets/img/logo/bw.png","Black & White"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-varampatta-mosque-pilgrimage-wayanad.html" title="Korome Mosque">Korome Mosque</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-varampatta-mosque-pilgrimage-wayanad.html" title="Korome Mosque"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-stays-korome-mosque-wayanad.webp" width="300" ></a>', 11.744250584874738, 75.88027044523321, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Korome Mosque"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-our-lady-of-lourdes-shrine-pilgrimage-wayanad.html" title="Pallikunnu Church">Pallikunnu Church</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-our-lady-of-lourdes-shrine-pilgrimage-wayanad.html" title="Pallikunnu Church"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-workation-pallikkunnu-church-wayanad.webp" width="300" ></a>', 11.638232, 76.010695, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Pallikunnu Church"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-sita-lav-kush-temple-pilgrimage-wayanad.html" title="Seethadevi Lava Kusa Temple">Seethadevi Lava Kusa Temple</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-sita-lav-kush-temple-pilgrimage-wayanad.html" title="Seethadevi Lava Kusa Temple"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-stays-lava-kush-ponkuzhi-wayanad.webp" width="300" ></a>', 11.792823, 76.168709, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Seethadevi Lava Kusa Temple"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-sentinel-rock-waterfall-wayanad.html" title="Sentinel Rock Waterfall">Sentinel Rock Waterfall</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-sentinel-rock-waterfall-wayanad.html" title="Sentinel Rock Waterfall"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-stays-sentinal-waterfall-wayanad.webp" width="300" ></a>', 11.495418956600835, 76.16077748465527, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Sentinel Rock Waterfall"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-chundail-tea-estate-cycling-wayanad.html" title="Chundail Tea Estate">Chundail Tea Estate</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-chundail-tea-estate-cycling-wayanad.html" title="Chundail Tea Estate"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-workation-chundale-tea-estate-wayanad.webp" width="300" ></a>', 11.6076643, 76.1350769, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Chundail Tea Estate"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-phanthom-rock-romantic-wayanad.html" title="Phantom rock">Phantom rock</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-phanthom-rock-romantic-wayanad.html" title="Phanthom rock"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-resort-phanthom-rock-wayanad.webp" width="300" ></a>', 11.636687345789426, 76.20460141779273, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Phantom rock"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-kurumbalakotta-romantic-wayanad.html" title="Kurumbalakotta">Kurumbalakotta</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-kurumbalakotta-romantic-wayanad.html" title="Kurumbalakotta"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-weekend-kurumbalakotta-wayanad.webp" width="300" ></a>', 11.698245, 76.028686, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Kurumbalakotta"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-attamala-view-point-romantic-wayanad.html" title="Attamala View Point">Attamala View Point</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-attamala-view-point-romantic-wayanad.html" title="Attamala View Point"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-stays-attamala-resort-wayanad.avif" width="300" ></a>', 11.498498126983506, 76.17549155352333, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Attamala View Point"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-sunrise-valley-romantic-wayanad.html" title="Sunrise valley">Sunrise valley</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-sunrise-valley-romantic-wayanad.html" title="Sunrise valley"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-stays-sunrise-valley-wayanad.webp" width="300" ></a>', 11.5233771, 76.2140645, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Sunrise valley"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-neelimala-view-point-romantic-wayanad.html" title="Neelimala view point">Neelimala view point</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-neelimala-view-point-romantic-wayanad.html" title="Neelimala view point"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-kalpetta-neelimala-view-point-wayanad.webp" width="300" ></a>', 11.53679433721778, 76.22909644232763, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Neelimala view point"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-sultan-batthery-valmiki-ashram-heritage-wayanad.html" title="Sultans Bathery Valmiki Ashram">Sultans Bathery Valmiki Ashram</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-sultan-batthery-valmiki-ashram-heritage-wayanad.html" title="Sultans Bathery Valmiki Ashram	"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/heritage/bw-stays-valmiki-ashramam-tourist.webp" width="300" ></a>', 11.778971412702218, 76.19547348280202, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Sultans Bathery Valmiki Ashram"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-meenangadi-church-pilgrimage-wayanad.html" title="Meenangadi Church">Meenangadi Church</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-meenangadi-church-pilgrimage-wayanad.html" title="Meenangadi Church"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-staycation-meenagadhi-church-wayanad.webp" width="300" ></a>', 11.65965314607536, 76.1676252001014, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Meenangadi Church"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-trikaipatta-temple-pilgrimage-wayanad.html" title="Trikaipatta temple">Trikaipatta temple</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-trikaipatta-temple-pilgrimage-wayanad.html" title="Trikaipatta temple"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-stays-trikaipattta-temple-wayanad.webp" width="300" ></a>', 11.6057586, 76.133523, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Trikaipatta temple"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-trishileri-temple-pilgrimage-wayanad.html" title="Trishileri temple ">Trishileri temple </a></h6><a target="_blank" href="'+iconURLPrefix+'bw-trishileri-temple-pilgrimage-wayanad.html" title="Trishileri temple "><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-workation-trishilerry-temple-wayanad.webp" width="300" ></a>', 11.8516904520993, 76.01646686931055, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Trishileri temple "],

['<h6><a target="_blank"  href="'+iconURLPrefix+'bw-tirunelli-temple-pilgrimage-wayanad.html"   title="Thirunelli Temple">Thirunelli Temple</a></h6><a target="_blank"  href="'+iconURLPrefix+'bw-tirunelli-temple-pilgrimage-wayanad.html"  title="Thirunelli Temple"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-stays-tirunelli-temple-wayanad.webp" width="300" ></a>', 11.9116989, 75.995828, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Thirunelli Temple"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-valliyoorkavu-temple-pilgrimage-wayanad.html" title="Valliyoorkavu Bhagavathy Temple">Valliyoorkavu Bhagavathy Temple</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-valliyoorkavu-temple-pilgrimage-wayanad.html" title="Valliyoorkavu Bhagavathy Temple"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/pilgrimage/bw-valliyoorkavu-bhagavathy-temple-wayanad.webp" width="300" ></a>',11.802496912934904, 76.02997277047147, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Valliyoorkavu Bhagavathy Temple"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-lakkidi-ghats-view-point-wayanad.html" title="Lakkidi Ghats view point">Lakkidi Ghats  view point</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-lakkidi-ghats-view-point-wayanad.html" title="Lakkidi Ghats  view point"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-stays-ghats-viewpoint-wayanad.webp" width="300" ></a>', 11.512393990351887, 76.01895535767235, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Lakkidi Ghats View point"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-en-ooru-tribal-wayanad.html" title="En ooru">En ooru</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-en-ooru-tribal-wayanad.html" title="En ooru"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/tribal/bw-homestay-en-ooru-tribal-heritage-village-wayanad.webp" width="300" ></a>', 11.529899800439996, 76.01535511645811, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","En ooru"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-900-kandi-romantic-wayanad.html" title="900 Kandi">900 Kandi</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-900-kandi-romantic-wayanad.html" title="900 Kandi"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-weekend-destination-glassbridge-wayanad.webp" width="300" ></a>',11.4967237, 76.1051083, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","900 Kandi"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-uravu-bamboo-tribal-wayanad.html" title="Uravu">Uravu</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-uravu-bamboo-tribal-wayanad.html" title="Uravu"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/tribal/bw-bamboo-uravu-thrikkaipetta-wayanad.webp" width="300" ></a>',11.6076643, 76.1350769, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Uravu"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-rippon-tea-estate-plantation-wayanad.html" title="Rippon Tea estate">Rippon Tea estate</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-rippon-tea-estate-plantation-wayanad.html" title="Rippon Tea estate"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/plantation/bw-hotel-tea-plantaion-tour-wayanad.webp" width="300" ></a>',11.534836134024715, 76.17498437471619, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Rippon Tea estate"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-coffee-plantation-plantation-wayanad.html" title="Coffee Plantation">Coffee Plantation</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-coffee-plantation-plantation-wayanad.html" title="Coffee Plantation"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/plantation/bw_Arabica-Coffee-Estate-wayanad.avif" width="300" ></a>',11.758218103566884, 75.99955554569163, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Coffee Plantation"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-boys-town-farm-wayanad.html" title="Boys Town">Boys Town</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-boys-town-farm-wayanad.html" title="Boys Town"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/farm/bw-stays-rars-wayanad-ambalavayal.webp" width="300" ></a>',11.842370909585952, 75.92226125826711, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Boys Town"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-ambalavayal-farm-rars-wayanad.html" title="Ambalavayal">Ambalavayal RARS</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-ambalavayal-farm-rars-wayanad.html" title="Ambalavayal"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/farm/bw_wayanad_amalavayal.avif" width="300" ></a>',11.616591290587456, 76.21447474945045, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Ambalavayal"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-meenmutty-waterfall-wayanad.html" title="Banasura Meenmutty Waterfalls"> Meenmutty Waterfalls</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-meenmutty-waterfall-wayanad.html" title="Banasura Meenmutty Waterfalls"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-homestay-meenmufalls-wayanad.webp" width="300" ></a>', 11.74131093962623, 75.935689, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Banasura Meenmutty Waterfalls"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-chain-tree-cultural-heritage-wayanad.html" title="Chain Tree, Lakkidi">Chain Tree, Lakkidi</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-chain-tree-cultural-heritage-wayanad.html" title="Chain Tree, Lakkidi"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/heritage/bw-stays-chain-tree-service-apartment.webp" width="300" ></a>', 11.519108, 76.020890, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Chain Tree, Lakkidi"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-edakkal-caves-trucking-wayanad.html" title="Edakkal Caves">Edakkal Caves</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-edakkal-caves-trucking-wayanad.html" title="Edakkal Caves"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/trucking/bw-staycation-edakkal-caves-wayanad.webp" width="300" ></a>', 11.626856, 76.234269, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Edakkal Caves"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-nagarhole-wildlife-sanctuary-wayanad.html" title="Nagarhole wild life sanctuary">Nagarhole wild life sanctuary</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-nagarhole-wildlife-sanctuary-wayanad.html" title="Nagarhole wild life sanctuary"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/wildlife/bw-homestays-nagarhole-wayanad-wildlife-sanctuary.webp" width="300" ></a>', 11.99814346014371, 76.06648764392638, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Nagarhole wild life sanctuary"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-kanthanpara-waterfall-wayanad.html" title="Kanthanpara Waterfalls">Kanthanpara Waterfalls</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-kanthanpara-waterfall-wayanad.html" title="Kanthanpara Waterfalls"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-stays-kanthanpara-waterfalls-wayanad.webp" width="300" ></a>', 11.5239348, 76.1526896, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Kanthanpara Waterfalls"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-kappikalam-waterfall-wayanad.html" title="Kappikalam waterfalls">Kappikalam waterfalls</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-kappikalam-waterfall-wayanad.html" title="Kappikalam waterfalls"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw_meenmufalls_wayanad.avif" width="300" ></a>', 11.524617527477, 76.15260365204358, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Kappikalam waterfalls"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-karland-lake-romantic-wayanad.html" title="Karland Lake">Karland Lake</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-karland-lake-romantic-wayanad.html" title="Karland Lake"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-stays-karlad-lake-wayanad-tourism.webp" width="300" ></a>', 11.650035025731679, 75.9824076530733, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Karland Lake"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-arripara-waterfall-wayanad.html" title="Arripara falls">Arripara falls</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-arripara-waterfall-wayanad.html" title="Arripara falls"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-stays-arripa-falls-kalpetta.webp" width="300" ></a>', 11.43840307285013, 76.04597666931055, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Arripara falls"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-Irrupu-waterfall-wayanad.html" title="Irrupu falls ">Irrupu falls </a></h6><a target="_blank" href="'+iconURLPrefix+'bw-Irrupu-waterfall-wayanad.html" title="Irrupu falls "><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-stays-irupu-falls-wayanad-inn.webp" width="300" ></a>', 11.967284462093113, 75.98393572809631, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Irrupu falls "],
['<h6><a target="_blank" href="'+iconURLPrefix+'bw-muthanga-wildlife-sanctuary-wayanad.html" title="Muthanga Wildlife Sanctuary">Muthanga Wildlife Sanctuary</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-muthanga-wildlife-sanctuary-wayanad.html" title="Muthanga Wildlife Sanctuary"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/wildlife/bw-night-safari-muthanga-wildlife-wayanad.webp" width="300" ></a>', 11.671597, 76.368656, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Muthanga Wildlife Sanctuary"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-mananthavady-pazhassi-tomb-heritage-wayanad.html" title="Pazhassi Smarakam">Pazhassi Smarakam</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-mananthavady-pazhassi-tomb-heritage-wayanad.html" title="Pazhassi Smarakam"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/heritage/bw-stays-pazhassi-tomb-wayanad-resort.webp" width="300" ></a>', 11.8013942, 76.0006489, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Pazhassi Smarakam"],
['<h6><a target="_blank" href="'+iconURLPrefix+'bw-pookode-lake-romantic-wayanad.html" title="Pookode Lake">Pookode Lake</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-pookode-lake-romantic-wayanad.html" title=Pookode Lake"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-vacation-pookode-lake-wayanad.webp" width="300" ></a>',  11.542470, 76.027224, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Pookode Lake"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-soochipara-waterfall-wayanad.html" title="Soochipara Waterfalls">Soochipara Waterfalls</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-soochipara-waterfall-wayanad.html" title="Soochipara Waterfalls"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-service-apartment-soochipara-wayanad.webp" width="300" ></a>', 11.51173007949638, 776.16378589573601, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Soochipara Waterfalls"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-mailadippara-romantic-wayanad.html" title="Mailadippara">Mailadippara</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-mailadippara-romantic-wayanad.html" title="Mailadippara"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/black-and-white-mailadanpara-wayanad.webp" width="300" ></a>', 11.624409556486977, 76.0923043558191, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Mailadippara"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-manjappara-romantic-wayanad.html" title="Manjappara">Manjappara</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-manjappara-romantic-wayanad.html" title="Manjappara"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-holiday-longstay-manjapara-viewpoint.webp" width="300" ></a>', 11.602130295485557, 76.19922151534472, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Manjappara"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-begur-wildlife-sanctuary-wayanad.html" title="Begur wild life sanctuary">Begur wild life sanctuary</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-begur-wildlife-sanctuary-wayanad.html" title="Begur wild life sanctuary"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/wildlife/bw-home-away-wildlife-safari-tholpetty-sanctuary.webp" width="300" ></a>', 11.84916385461648, 76.08839341349146, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Begur wild life sanctuary"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-tholpetty-wildlife-sanctuary-wayanad.html"title="Tholpetty Wildlife Sanctuary">Tholpetty Wildlife Sanctuary</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-tholpetty-wildlife-sanctuary-wayanad.html" title="Tholpetty Wildlife Sanctuary"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/wildlife/bw_tholpetty-wildlife-sanctuary-wayanad.webp" width="300" ></a>', 11.952121335686247, 76.0601520539344, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Tholpetty Wildlife Sanctuary"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-folklore-museum-wayanad.html" title="Wayanad Heritage Museum">Wayanad Heritage Museum</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-folklore-museum-wayanad.html" title="Wayanad Heritage Museum"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/museum/bw-stays-wayanad-heritage-museum.webp" width="300" ></a>', 11.619335, 76.210626, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Wayanad Heritage Museum"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-thusharagiri-waterfall-wayanad.html" title="Thusharagiri">Thusharagiri</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-thusharagiri-waterfall-wayanad.html" title="Thusharagiri"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/falls/bw-stays-thusharagiri-falls-service-apartment.webp" width="300" ></a>', 11.472979462955495, 76.05414413068944, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Thusharagiri"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-kuruwa-deep-trucking-wayanad.html" title="Kuruva Island">Kuruva Island</a></h6><a target=" blank" href="'+iconURLPrefix+'bw-kuruwa-deep-trucking-wayanad.html" title="Kuruva Island"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"  src="'+iconURLPrefix+'assets/img/trucking/bw-kuruva-island-wayanad.webp" width="300" ></a>', 11.821667, 76.092222, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Kuruva Island"],

['<h6><a target="_blank" href="'+iconURLPrefix+'bw-banasurasagar-dam-romantic-wayanad.html" title="Banasura Sagar Dam">Banasura Sagar Dam</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-banasurasagar-dam-romantic-wayanad.html" title="Banasura Sagar Dam"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-stays-banasura-sagar-dam-wayanad.avif" width="300" ></a>', 11.670692, 75.955571, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Banasura Sagar Dam"],
['<h6><a target="_blank" href="'+iconURLPrefix+'bw-karapuzha-dam-romantic-wayanad.html" title="Karapuzha Dam">Karapuzha Dam</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-karapuzha-dam-romantic-wayanad.html" title="Karapuzha Dam"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/romantic/bw-service-apartment-wayanad-karappuzha-dam.webp" width="300" ></a>', 11.6182113, 76.1722152, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Karapuzha Dam"],
['<h6><a target="_blank" href="'+iconURLPrefix+'bw-ziplines-sporting-wayanad.html" title="Zipline">Longest Zipline</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-ziplines-sporting-wayanad.html" title="Longest Zipline"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/sports/bw-stay-zipline-vytiri-wayanad.webp" width="300" ></a>', 11.6076643, 76.1350769, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Zipline"],
['<h6><a target="_blank" href="'+iconURLPrefix+'bw-pepper-farm-wayanad.html" title="Pepper Farm">Pepper Farm</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-pepper-farm-wayanad.html" title="Pepper Farm"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/farm/bw-stays-pepper-farm-wayanad.webp" width="300" ></a>', 11.69283527987838, 76.1911296389339, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Pepper Farm"],
['<h6><a target="_blank" href="'+iconURLPrefix+'bw-honey-museum-wayanad.html" title="Honey Museaum">Honey Museaum</a></h6><a target="_blank" href="'+iconURLPrefix+'bw-honey-museum-wayanad.html" title="Pepper Farm"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="'+iconURLPrefix+'assets/img/farm/bw-stays-honey-museum-wayanad.webp" width="300" ></a>',  11.5375175, 76.0434972, 2, iconURLPrefix+"assets/img/logo/pin-drop.png","Honey Museaum"]
];


var foodations =

[
['<h6><a target="_blank" href="Muzwalla Resturant" title="Muzwalla Resturant">Muzwalla Resturant</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.6963, 76.1411, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Muzwalla Resturant"],

['<h6><a target="_blank" href="Hotel Paradise" title="Majestic Bakes">Majestic Bakes</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.604323109796422, 76.08630892473452, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Majestic Bakes"],

['<h6><a target="_blank" href="Krishna Bhavan Pure Veg" title="Krishna Bhavan Pure Veg">Krishna Bhavan Pure Veg</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.60585860731025, 76.08680326940188, 2, iconURLPrefix+"assets/img/logo/restaurant.png",""],

['<h6><a target="_blank" href="Majestic Bakes and Restaurants" title="Majestic Bakes">Majestic Bakes and Restaurants</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.604780705721431, 76.08324548447946, 2, iconURLPrefix+"assets/img/logo/restaurant.png",""],

['<h6><a target="_blank" href="Nesto Hyper market " title="Nesto Hyper market">Nesto Hyper market</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-shopping-nesto-wayanad.webp" width="300" ></a>', 11.60340794748994, 76.08304528423753, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Nesto Hyper market"],

['<h6><a target="_blank" href="Chatiyum Chorum " title="Chatiyum Chorum">Chatiyum Chorum</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.605200936482868, 76.08393188530898, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Chatiyum Chorum"],

['<h6><a target="_blank" href="The Bungalow " title="The Bungalow">The Bungalow</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.606377579247457, 76.08390328527442, 2, iconURLPrefix+"assets/img/logo/restaurant.png","The Bungalow"],

['<h6><a target="_blank" href="Affas Pure Vegiterian " title="Affas Pure Vegiterian">Affas Pure Vegiterian</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.607133989832576, 76.08324548447946, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Affas Pure Vegiterian"],

['<h6><a target="_blank" href="Jallels Kitchen " title="Jallels Kitchen">Jallels Kitchen</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.610667798353557, 76.0833430886246, 2, iconURLPrefix+"assets/img/logo/cafe.png","allels Kitchen"],

['<h6><a target="_blank" href="Alibaba and 41 Dishes" title="Alibaba and 41 Dishes">Alibaba and 41 Dishes</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.610318686152537, 76.08084825487074, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Alibaba and 41 Dishes"],

['<h6><a target="_blank" href="Dosa Cafe " title="Dosa Cafe ">Dosa Cafe </a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.61319990659965, 76.08091551813482, 2, iconURLPrefix+"assets/img/logo/cafe.png","Dosa Cafe"],

['<h6><a target="_blank" href="New Form Resturant " title="New Form Resturant">New Form Resturant</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.614539422188063, 76.08262490982439, 2, iconURLPrefix+"assets/img/logo/restaurant.png","New Form Resturant"],

['<h6><a target="_blank" href="Holiday Village " title="Holiday Village">Holiday Village</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.616672058724552, 76.08291280737211, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Holiday Village"],


['<h6><a target="_blank" href="Beyco Wayanad " title="Beyco Wayanad ">Beyco Wayanad </a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.612653523348222, 76.08800499522312, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Beyco Wayanad"],


['<h6><a target="_blank" href="Rayan Resturant " title="Rayan Resturant ">Rayan Resturant </a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.619758043374217, 76.08496651902011, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Rayan Resturant"],


['<h6><a target="_blank" href="Kabab Shack" title="Kabab Shack">Kabab Shack</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.6203363540984, 76.08884269768355, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Kabab Shack"],


['<h6><a target="_blank" href="1980 Nostalgia " title="1980 Nostalgia">1980 Nostalgia</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.620851803949527, 76.08899671802779, 2, iconURLPrefix+"assets/img/logo/restaurant.png","1980 Nostalgia"],


['<h6><a target="_blank" href="Oshin Resturant " title="Oshin Resturant">Oshin Resturant</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.626228731134612, 76.087809496246, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Oshin Resturant"],


['<h6><a target="_blank" href="Bevco Beverages " title="Bevco Beverages">Bevco Beverages</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-alcohol-shop-wayanad-bevco-kalpetta.webp" width="300" ></a>', 11.624334351501458, 76.09030848070677, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Bevco Beverages"],

['<h6><a target="_blank" href="Ramavilas Vegiterain" title="Ramavilas Vegiterain">Ramavilas Vegiterain</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.610380054042501, 76.08310942611584, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Ramavilas Vegiterain"],


['<h6><a target="_blank" href="Ruchi Pura " title="Ruchi Pura ">Ruchi Pura </a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.605751134803608, 76.08368257503619, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Ruchi Pura"],

['<h6><a target="_blank" href="Hotel Paradise" title="Hotel Paradise">Hotel Paradise</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.60176526999694, 76.08164659461592, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Hotel Paradise"],

['<h6><a target="_blank" href="Ruchi Pura " title="Muzwalla Resturant ">Muzwalla Resturant</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.600690382919279, 76.08111456843432, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Muzwalla Resturant"],

['<h6><a target="_blank" href="Fruit Bae" title="Fruit Bae">Fruit Bae</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.60119739560447, 76.08164781022073, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Fruit Bae"],

['<h6><a target="_blank" href="Chicking" title="Chicking">Chicking</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.603008465130017, 76.08304000088835, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Chicking"],


['<h6><a target="_blank" href="Cafe Cocktail" title="Cafe Cocktail">Cafe Cocktail</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.604506794638315, 76.08376943606282, 2, iconURLPrefix+"assets/img/logo/cafe.png","Cafe Cocktail"],


['<h6><a target="_blank" href="Cup Coffee" title="Cup Coffee">Cup Coffee</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.60659514471941, 76.08388093697519, 2, iconURLPrefix+"assets/img/logo/cafe.png","Cup Coffee"],


['<h6><a target="_blank" href="Cup Coffee" title="Cup Coffee">Cup Coffee</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.614914415984193, 76.08302861096685, 2, iconURLPrefix+"assets/img/logo/cafe.png","Cup Coffee"],


['<h6><a target="_blank" href="New Hotel" title="New Hotel">New Hotel</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.607452677265156, 76.08362059821074, 2, iconURLPrefix+"assets/img/logo/restaurant.png","New Hotel"],

['<h6><a target="_blank" href="Chill Out" title="Chill Out">Chill Out</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.608996367231134, 76.08346178431843, 2, iconURLPrefix+"assets/img/logo/cafe.png","Chill Out"],

['<h6><a target="_blank" href="Vanita Mess" title="Vanita Mess">Vanita Mess</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.609012788111084, 76.0832646419536, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Vanita Mess"],

['<h6><a target="_blank" href="Walnuts cake shop" title="Walnuts cake shop">Walnuts cake shop</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.614855354258184, 76.08281021303468, 2, iconURLPrefix+"assets/img/logo/cafe.png","Walnuts cake shop"],

['<h6><a target="_blank" href="Cafe 41 Kalpetta" title="Cafe 41 Kalpetta">Cafe 41 Kalpetta</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.610153825099772, 76.08097305952563, 2, iconURLPrefix+"assets/img/logo/cafe.png","Cafe 41 Kalpetta"],

['<h6><a target="_blank" href="Olan Resturant" title="Olan Resturant">Olan Resturant</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.644692054539417, 76.11396083068944, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Olan Resturant"],

['<h6><a target="_blank" href="Touffequqee Resturant" title="Touffequqee Resturant">Touffequqee Resturant</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.615868291399686, 76.08321320185325, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Touffequqee Resturant"],

['<h6><a target="_blank" href="Hotel Pankaj" title="Hotel Pankaj">Hotel Pankaj</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.609547800012608, 76.08195152328292, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Hotel Pankaj"],

['<h6><a target="_blank" href="Night Tattu Kada" title="Night Tattu Kada">Night Tattu Kada</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.604806010573219, 76.08376805542096, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Night Tattu Kada"],

['<h6><a target="_blank" href="Maracana Restaurants" title="Maracana Restaurants">Maracana Restaurants</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.600071240199552, 76.0812581584653, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Maracana Restaurants"],

['<h6><a target="_blank" href="Casa Mia 2.1" title="Casa Mia 2.1">Casa Mia 2.1</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.608590691762718, 76.08721315614605, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Casa Mia 2.1"],

['<h6><a target="_blank" href="The Coffee Shop" title="The Coffee Shop">The Coffee Shop</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.617154317507989, 76.06854264615934, 2, iconURLPrefix+"assets/img/logo/restaurant.png","The Coffee Shop"],

['<h6><a target="_blank" href="Ramavilas Chundale" title="Ramavilas Chundale">Ramavilas Chundale</a></h6><a target="_blank" href="https://Muzwalla Resturantd" title="Muzwalla Resturant"><img title="Black and White Stays Service Villa"  alt="Black and White Stays Wayanad"   src="https://www.bwstays.com/assets/img/food/bw-stay-nearby-food-restaurant.webp" width="300" ></a>', 11.5738608278821, 76.05500967074094, 2, iconURLPrefix+"assets/img/logo/restaurant.png","Ramavilas Chundale"]

  ];

 if(mapType==1){
 loc=foodations ;
}else
{
 loc=wayalocations;
}



var element1 = document.getElementById('mapall');
// Create Leaflet map on map element.

var map1 = L.map(element1).setView([11.6057872, 76.0833109], 12);


// Add OSM tile layer to the Leaflet map.
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).on('tileload', function(e) {
    e.tile.alt = 'Food joins at wayand'; // Customize your alt text here
}).addTo(map1);


let customIcon1 = {
    iconUrl:"https://www.bwstays.com/assets/img/logo/pin.webp",
    iconSize:[40,40]
}
let myIcon1 = L.icon(customIcon1);

   // Add main location marker
  L.marker([11.6057872, 76.0833109], {
    icon: L.icon({
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
  }).addTo(map1);

var  i;
for (i = 0; i < loc.length; i++) {



// Target's GPS coordinates.
var target = L.latLng(loc[i][1], loc[i][2]);
// Set map's center to target with zoom 10.
map1.setView(target, 12);
// Place a marker on the same location.
L.marker(target,  {    title:loc[i][5],icon:myIcon1}).addTo(map1).bindPopup( loc[i][0]);



/*L.Routing.control({
    waypoints: [
      L.latLng(origin),
      L.latLng(dest)
    ],
    routeWhileDragging: true,
    //router: L.Routing.osrmv1({
      //serviceUrl: 'https://router.project-osrm.org/route/v1'
    //})
}).addTo(map1);*/

}

