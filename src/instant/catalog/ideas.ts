import type { Product } from "../types";
import { ten, type Mood } from "../themes";
import { registerStock, type StockSet } from "../stock";
import { make } from "./business";

// 385 more business websites, from the "1,000 ideas" list (Nov 2026): every idea that fits the business
// layout as it is (a list with prices, WhatsApp enquiries, call and map buttons, a lead form).
// Each kind of business shares its group's wording below and has its own name, sample business and
// three sample lines with prices. An owner replaces all of it in the form.
//
// To add one: add a line to its group, "id|Name on the site|Sample business|Item:price;Item:price;Item:price"
// (leave the price empty for "price on request"), then add its row to ip_products (see the migration
// 20261110090000_idea_websites.sql for the shape). A design shows on the site only once that row exists.

/** Rupee value for every design in this file: the average of the older business websites (₹234), rounded to our usual ending. */
export const IDEA_PRICE = 229;

interface Group {
  id: string; name: string; mood: Mood; glyph: string; verb: string;
  servicesTitle: string; serviceLabel: string; highlightsTitle: string; highlights: string[];
  leadTitle: string; leadButton: string; offerNote: string;
  listing: string;      // what the design gives, shown on its card in the store
  line: string;         // the sample business's own tagline
  about: string;        // "your {about}" in the ready-written WhatsApp message
  stock: StockSet[];    // photo sets borrowed from the nearest older design
  items: string;
}

const GROUPS_DATA: Group[] = [
  {
    id: "idea-doctors", name: "Doctors & clinics", mood: "health", glyph: "🩺", verb: "Visit",
    servicesTitle: "Treatments & fees", serviceLabel: "treatment", highlightsTitle: "Why patients choose us",
    highlights: ["Experienced doctors", "Clean, hygienic clinic", "Same-day appointments", "Clear fees", "Wheelchair friendly", "Lab tie-ups", "Parking", "Reports on WhatsApp"],
    leadTitle: "Request an appointment", leadButton: "Send request", offerNote: "Tell us your concern and a time that suits you. We will call to confirm.",
    listing: "Treatments and fees, timings, doctor details and appointment requests on WhatsApp.", line: "Caring treatment, clear fees, close to home.", about: "treatments and timings", stock: ["clinic"],
    items: `dental-clinic|Dental clinic|Smile Dental Care|Scaling & polishing:800;Root canal:3500;Braces consultation:500
eye-hospital|Eye hospital|Drishti Eye Hospital|Eye check-up:400;Cataract surgery:18000;LASIK consultation:600
physiotherapy-centre|Physiotherapy centre|ReMove Physio|Physio session:500;Home visit:800;10-session pack:4500
homeopathy-clinic|Homeopathy clinic|Arogya Homeo Clinic|First consultation:400;Follow-up:200;One-month medicines:600
ayurveda-centre|Ayurveda & Panchakarma centre|Ayushman Ayurveda|Consultation:400;Abhyanga massage:1200;7-day Panchakarma:14000
pathology-lab|Pathology lab|Sure Path Lab|CBC:250;Thyroid profile:450;Full body check-up:1499
diagnostic-centre|Diagnostic & imaging centre|ClearScan Diagnostics|X-ray:400;Ultrasound:900;MRI scan:5500
child-specialist|Child specialist (paediatrician)|Little Steps Child Clinic|Consultation:500;Vaccination visit:300;Growth check-up:400
maternity-home|Maternity & nursing home|Janani Maternity Home|Antenatal check-up:600;Normal delivery package:25000;Caesarean package:45000
skin-hair-clinic|Skin & hair clinic|Glow Skin & Hair Clinic|Consultation:500;Chemical peel:1800;Hair fall treatment:2500
ent-clinic|ENT clinic|Shravan ENT Clinic|Consultation:500;Hearing test:600;Ear cleaning:400
orthopaedic-clinic|Orthopaedic clinic|Asthi Ortho Care|Consultation:600;Plaster:1200;Knee injection:2500
counsellor-psychologist|Counsellor & psychologist|Manas Counselling|First session:800;Follow-up session:700;Couple session:1200
dietitian|Dietitian & nutritionist|NutriBalance|One-time diet plan:999;One-month programme:2499;Three-month programme:5999
fertility-centre|IVF & fertility centre|Aasha Fertility Centre|First consultation:700;Fertility tests:3500;IUI cycle:9000
veterinary-clinic|Veterinary clinic|Happy Paws Vet Clinic|Consultation:400;Vaccination:500;Deworming:200
home-nursing|Home nursing & elder care|CareAtHome Nursing|Attendant, 12 hours:800;Nurse, 12 hours:1400;Nurse, 24 hours:2400
speech-therapy|Speech & occupational therapy|Bol Therapy Centre|Assessment:800;Speech session:600;Occupational session:600
hearing-aid-centre|Hearing aid centre|SunLo Hearing|Hearing test:300;Basic hearing aid:12000;Digital hearing aid:28000
dialysis-centre|Dialysis centre|Jeevan Dialysis Centre|Dialysis session:1500;Monthly pack, 8 sessions:11000;Doctor consultation:500
small-hospital|Multi-speciality hospital|Shanti Hospital|OPD consultation:300;General ward, per day:1200;Private room, per day:2500
medical-equipment-rental|Medical equipment rental|MediRent|Wheelchair, per day:100;Hospital bed, per month:2500;Oxygen concentrator, per month:4500
surgical-supplies|Surgical & medical supplies store|SurgiMart|Gloves, box of 100:350;BP monitor:1400;Nebuliser:1600
health-checkup-packages|Health check-up packages|HealthFirst Check-ups|Basic check-up:799;Women's check-up:1799;Senior check-up:2499`,
  },
  {
    id: "idea-food", name: "Food businesses", mood: "sweets", glyph: "🍲", verb: "Order from",
    servicesTitle: "Our range", serviceLabel: "item", highlightsTitle: "Why people order from us",
    highlights: ["Freshly made", "Hygienic kitchen", "Home delivery", "Bulk orders", "Festive packs", "FSSAI licensed", "UPI accepted", "Custom orders"],
    leadTitle: "Ask for today's rates", leadButton: "Send my order request", offerNote: "Tell us what you need and how much. We will reply with the price and delivery time.",
    listing: "Your items with prices, orders on WhatsApp, delivery areas and bulk order requests.", line: "Fresh, honest food made the way you like it.", about: "items and prices", stock: ["sweet-shop", "street-food"],
    items: `wedding-caterer|Wedding caterer|Annapurna Caterers|Veg menu, per plate:350;Premium menu, per plate:550;Live counter:6000
dhaba|Dhaba|Punjabi Rasoi Dhaba|Dal tadka:140;Paneer butter masala:220;Thali:180
juice-bar|Juice & shake bar|Fresh Sip Juice Bar|Mosambi juice:60;Mango shake:90;Fruit bowl:120
ice-cream-parlour|Ice-cream parlour|Scoops & Smiles|Single scoop:50;Sundae:140;Family pack:280
pickle-papad-brand|Homemade pickle & papad brand|Amma's Achaar|Mango pickle, 500 g:220;Lemon pickle, 500 g:200;Papad, 250 g:120
milk-delivery|Dairy & milk delivery|Gokul Dairy|Cow milk, 1 litre:60;Buffalo milk, 1 litre:72;Paneer, 250 g:110
farm-produce-box|Organic farm produce box|Hara Bhara Farm Box|Small veggie box:399;Family veggie box:699;Monthly plan:2499
spice-brand|Masala & spice brand|Swad Masala|Garam masala, 100 g:85;Chai masala, 100 g:120;Sabzi masala, 100 g:70
chai-brand|Chai brand / tea stall chain|Chai Adda|Kulhad chai:20;Masala chai:25;Bun maska:40
dry-fruits-store|Dry fruits & nuts store|Mewa Bazaar|Almonds, 500 g:480;Cashews, 500 g:520;Gift box:899
meat-fish-shop|Meat & fish shop|Fresh Catch|Chicken curry cut, 1 kg:260;Mutton, 1 kg:780;Rohu fish, 1 kg:240
chocolate-maker|Homemade chocolate maker|Cocoa Cottage|Assorted box of 12:350;Dry fruit chocolates, 250 g:420;Custom gift box:799
millet-foods|Millet foods brand|Mota Anaaj|Ragi flour, 1 kg:110;Millet cookies:150;Jowar flakes:130
ghee-brand|Pure ghee brand|Desi Gir Ghee|Cow ghee, 500 ml:650;Cow ghee, 1 litre:1250;Buffalo ghee, 1 litre:900
honey-brand|Raw honey brand|Van Madhu|Wild forest honey, 500 g:420;Jamun honey, 500 g:460;Honey with comb, 250 g:380
namkeen-maker|Namkeen & snacks maker|Chatpata Namkeen|Ratlami sev, 500 g:160;Mixture, 500 g:150;Khatta meetha, 500 g:150
oil-mill|Cold-pressed oil mill|Kolhu Oil Mill|Groundnut oil, 1 litre:320;Mustard oil, 1 litre:240;Coconut oil, 1 litre:380
jaggery-brand|Jaggery & natural sweeteners|Gud Ghar|Jaggery block, 1 kg:90;Jaggery powder, 500 g:80;Liquid jaggery, 500 g:140
coffee-roaster|Coffee roaster|Bean Story Roasters|Chikmagalur medium roast, 250 g:420;Filter coffee blend, 250 g:320;Cold brew bags:350
mithai-gift-boxes|Mithai gift boxes|Mithaas Gift Boxes|Kaju katli box, 500 g:650;Assorted mithai box:550;Dry fruit hamper:1200
paan-shop|Paan shop|Banarasi Paan Bhandar|Meetha paan:30;Chocolate paan:50;Paan counter for functions:5000
thali-restaurant|Bhojanalaya / thali restaurant|Shree Bhojanalaya|Regular thali:120;Special thali:180;Monthly meal pass:3000
food-truck|Food truck|Rolling Tadka|Pav bhaji:100;Loaded fries:120;Kulhad pizza:140
student-mess|Mess for students|Ghar Jaisa Mess|One meal:70;Monthly, one time a day:1800;Monthly, two times a day:3200`,
  },
  {
    id: "idea-retail", name: "Retail shops", mood: "shop", glyph: "🛍️", verb: "Shop at",
    servicesTitle: "Popular items", serviceLabel: "item", highlightsTitle: "Why shop with us",
    highlights: ["Wide range", "Fair prices", "Trusted brands", "Home delivery", "Easy exchange", "UPI and cards", "Festive offers", "Bulk orders"],
    leadTitle: "Check price and stock", leadButton: "Send enquiry", offerNote: "Tell us what you are looking for. We will reply with price and availability.",
    listing: "Your items with prices, offers, shop timings and price enquiries on WhatsApp.", line: "The range you want, at prices that feel right.", about: "range and prices", stock: ["general-store", "gift-catalogue"],
    items: `furniture-showroom|Furniture showroom|Wood World|Sofa set:28000;Double bed:18000;Dining table, 6 seater:22000
electronics-store|Electronics & appliance store|Bijli Bazaar|LED TV, 43 inch:24000;Fridge, double door:26000;Washing machine:17000
footwear-store|Footwear store|Step In|Men's formal shoes:1299;Women's sandals:799;Kids' school shoes:599
saree-shop|Saree shop|Resham Sarees|Cotton saree:899;Silk saree:4500;Wedding saree:12000
kidswear-store|Kidswear store|Little Champs|Party frock:899;Boys' ethnic set:1199;Daily wear set:399
toy-shop|Toy shop|Khilona Ghar|Building blocks:499;Remote car:899;Soft toy:399
sports-goods-store|Sports goods store|Khel Sports|Cricket bat:1800;Badminton racket:900;Football:650
book-store|Book store|Kitab Ghar|School book set:1500;Novel:299;Competitive exam guide:450
gift-shop|Gift shop|Tohfa Gifts|Photo frame:349;Personalised mug:299;Gift hamper:999
watch-shop|Watch & clock shop|Samay Watch House|Men's watch:1499;Wall clock:499;Battery change:100
paint-shop|Paint shop|Rang Mahal Paints|Interior emulsion, 10 litre:2800;Exterior emulsion, 10 litre:3400;Primer, 10 litre:1400
tiles-sanitaryware|Tiles & sanitaryware|Tile Studio|Floor tiles, per sq ft:45;Wall tiles, per sq ft:38;Wash basin:2200
utensils-store|Kitchen utensils & crockery|Bartan Bhandar|Pressure cooker, 5 litre:1400;Dinner set, 24 pieces:1800;Non-stick tawa:650
puja-samagri-store|Puja samagri store|Shubh Puja Bhandar|Daily puja kit:251;Satyanarayan puja kit:551;Brass diya:199
cycle-store|Cycle store|Pedal Point|Kids' cycle:3500;Gear cycle:9500;Cycle service:250
music-store|Musical instruments store|Sur Sangam Instruments|Acoustic guitar:4500;Harmonium:7500;Tabla set:6500
mattress-store|Mattress store|Neend Mattress Store|Single mattress:4500;Queen mattress:9500;Pillow pair:799
fabric-merchant|Cloth & fabric merchant|Vastra Cloth House|Shirting, per metre:220;Suiting, per metre:480;Cotton, per metre:120
computer-shop|Computer & laptop shop|ByteZone Computers|Laptop:38000;Assembled desktop:28000;Laptop service:500
mobile-accessories-store|Mobile accessories store|Cover Corner|Back cover:149;Tempered glass:99;Fast charger:499
camera-store|Camera & photo store|Click Camera House|Passport photos:60;Camera rent, per day:800;Photo print, 4x6:10
gaming-store|Gaming store|Game On|Console game:2499;Controller:3500;Gaming café, per hour:80
used-phone-store|Second-hand phone store|Phone Exchange|Used phone, good condition:6500;Used phone, like new:14000;Sell your phone:
lighting-store|Lighting & decor store|Roshni Lights|LED bulb:90;Chandelier:6500;Festive string lights:250
home-furnishing-store|Home furnishing store|Ghar Sajawat|Double bedsheet:799;Curtains, per panel:450;Cushion covers, set of 5:499
electrical-store|Electrical goods store|Current Electricals|Ceiling fan:1800;Wire, 90 m coil:1400;Modular switch:60
plywood-dealer|Plywood & laminate dealer|Ply Point|Plywood 18 mm, per sq ft:85;Laminate sheet:950;Flush door:2800
perfume-shop|Perfume & attar shop|Itr Mahal|Attar, 6 ml:250;Perfume, 50 ml:799;Gift set:1200
cosmetics-store|Cosmetics store|Shringar Cosmetics|Lipstick:299;Bridal kit:2500;Skin care combo:899
handloom-store|Handloom & khadi store|Khadi Karigar|Khadi kurta:799;Handloom saree:2200;Cotton stole:399
aquarium-shop|Aquarium & fish shop|Aqua World|Goldfish pair:120;2-ft tank setup:2800;Tank cleaning visit:400
bird-pet-shop|Bird & small pet shop|Chirp Pet Shop|Budgie pair:600;Bird cage:900;Bird feed, 1 kg:180
silver-shop|Silver articles shop|Chandi Ghar|Silver coin, 10 g:1300;Pooja thali:8500;Silver payal, pair:3500
artificial-jewellery-store|Artificial jewellery store|Jhilmil Jewels|Earrings:199;Necklace set:799;Bridal set:2500
bridal-lehenga-store|Bridal lehenga store|Dulhan Lehenga House|Party lehenga:6500;Bridal lehenga:28000;Lehenga on rent:5000
uniform-shop|Uniform shop|School Dress Point|Shirt:350;Trousers or skirt:450;Full uniform set:1100
jewellery-wholesale|Costume jewellery wholesale|Zevar Wholesale|Earrings, dozen:600;Bangles, box:450;Necklace sets, lot of 10:3500
glassware-store|Glassware & bar accessories|Crystal Glassware|Water glasses, set of 6:399;Wine glasses, set of 6:899;Bar tool set:1200
innerwear-store|Ladies' innerwear & nightwear store|Comfort Zone|Everyday bra:349;Night suit:699;Pack of 3 briefs:399
bags-store|Bags & luggage store|Safar Bags|School bag:799;Trolley bag:2800;Laptop backpack:1299`,
  },
  {
    id: "idea-vehicles", name: "Vehicles & transport", mood: "auto", glyph: "🚗", verb: "Call",
    servicesTitle: "Services & rates", serviceLabel: "service", highlightsTitle: "Why customers trust us",
    highlights: ["Trained staff", "Clear rates", "On-time service", "Genuine parts", "Doorstep help", "Insurance help", "UPI and cards", "Open all week"],
    leadTitle: "Get a free quote", leadButton: "Send my request", offerNote: "Share your vehicle and what you need. We will call back with the price.",
    listing: "Your services and rates, booking requests on WhatsApp, call and map buttons.", line: "Reliable service for your vehicle, at clear rates.", about: "services and rates", stock: ["car-detailing", "bike-repair"],
    items: `used-car-dealer|Used car dealer|Bharosa Cars|Hatchback, from:250000;Sedan, from:450000;SUV, from:750000
two-wheeler-showroom|Two-wheeler showroom|Speed Wheels|Scooter, on-road:92000;Commuter bike, on-road:98000;Sports bike, on-road:185000
driving-school|Driving school|Safe Drive Motor School|15-day car course:4500;Two-wheeler course:2000;Licence help:1500
tyre-shop|Tyre & wheel alignment shop|Grip Tyres|Wheel alignment:400;Car tyre, from:3200;Puncture repair:100
self-drive-car-rental|Self-drive car rental|ZipDrive Rentals|Hatchback, per day:1500;Sedan, per day:2200;SUV, per day:3200
taxi-service|Taxi & cab service|City Cab Service|Airport drop:600;Local, 8 hours:1800;Outstation, per km:12
ev-dealer|EV dealer & charging point|GreenRide EV|Electric scooter:95000;E-rickshaw:165000;Charging, per unit:15
spare-parts-store|Auto spare parts store|Motor Parts House|Brake pads:900;Clutch plate:2200;Engine oil, 1 litre:450
car-denting-painting|Car denting & painting|Shine Auto Body|Dent repair, per panel:1500;Full body paint:28000;Scratch removal:800
packers-movers|Packers & movers|SafeShift Packers|1 BHK shifting, local:6000;2 BHK shifting, local:9500;Bike transport:3500
truck-transport|Truck & tempo transport|Bharat Transport|Tempo, local trip:1200;Truck, per km:28;Full load, intercity:
towing-service|Roadside assistance & towing|Rescue Wheels|Towing, up to 10 km:1200;Jump start:400;Flat tyre help:300
school-van|School van service|Bachpan School Van|Up to 3 km, monthly:1200;3 to 6 km, monthly:1600;6 to 10 km, monthly:2100
car-accessories-store|Car accessories store|Car Decor Hub|Seat covers:3500;Music system:6500;Floor mats:1200
battery-shop|Vehicle battery shop|PowerStart Batteries|Bike battery:1400;Car battery:4800;Inverter battery:11500
bike-rental|Bike rental|Ride Easy Rentals|Scooter, per day:400;Bike, per day:600;Bullet, per day:1000
vehicle-insurance-agent|Vehicle insurance agent|Suraksha Insurance Point|Two-wheeler policy, from:900;Car policy, from:4500;Claim help:
ambulance-service|Ambulance service|Jeevan Rakshak Ambulance|Basic ambulance, local:800;Oxygen ambulance, local:1500;Outstation, per km:20
bus-operator|Bus operator|Shree Travels|Seater ticket:350;Sleeper ticket:600;Full bus booking:
tempo-traveller-rental|Tempo traveller rental|YatraVan|12 seater, per km:22;17 seater, per km:26;Local, 8 hours:4500
truck-body-builder|Truck body builder|Vishwakarma Body Builders|Open body:;Container body:;Tipper body:
car-modification|Car modification workshop|Mod Garage|Car wrap:25000;Projector headlamps:8500;Alloy wheels, set:22000`,
  },
  {
    id: "idea-home", name: "Home services", mood: "trade", glyph: "🛠️", verb: "Call",
    servicesTitle: "Services & rates", serviceLabel: "service", highlightsTitle: "Why customers call us",
    highlights: ["Verified staff", "On-time visits", "Clear rates", "Work warranty", "Free inspection", "Clean work", "UPI accepted", "Same-day service"],
    leadTitle: "Book a free visit", leadButton: "Book my visit", offerNote: "Tell us the work and your area. We will call to fix a time.",
    listing: "Your services and rates, visit bookings on WhatsApp, photos of your work.", line: "Skilled work at your doorstep, done right the first time.", about: "services and rates", stock: ["electrician", "plumber", "interior-designer"],
    items: `carpenter|Carpenter|Kaarigar Carpentry|Door repair:500;Wardrobe, per sq ft:1100;Custom bed:16000
house-painter|House painter|Rang De Painters|1 BHK interior:9000;2 BHK interior:16000;Exterior, per sq ft:14
pest-control|Pest control|BugFree Pest Control|Cockroach treatment:900;Termite treatment, per sq ft:8;Yearly plan:3500
deep-cleaning|Home deep cleaning|Chamak Cleaning|1 BHK deep clean:2500;Sofa cleaning, per seat:250;Kitchen deep clean:1500
ro-service|RO water purifier service|Pure Drop RO Service|Service visit:350;Filter change:1200;Yearly plan:2500
cctv-installer|CCTV & security systems|SafeEye CCTV|2-camera set:8500;4-camera set:14500;Service visit:400
solar-installer|Solar panel installer|Surya Solar|3 kW rooftop system:165000;5 kW rooftop system:265000;Site survey:
appliance-repair|Appliance repair|FixIt Appliance Care|Washing machine repair:450;Fridge repair:500;Microwave repair:400
laundry|Laundry & dry cleaning|Fresh Press Laundry|Wash and iron, per kg:80;Shirt dry clean:70;Saree dry clean:180
domestic-help-agency|Domestic help agency|Sahayak Services|Maid placement:3000;Cook placement:4000;Nanny placement:5000
gardener|Gardener & landscaping|Hariyali Gardens|Garden visit:500;Monthly upkeep:2000;Terrace garden setup:15000
waterproofing|Waterproofing contractor|DryRoof Waterproofing|Inspection:;Terrace, per sq ft:45;Bathroom:6500
modular-kitchen|Modular kitchen maker|Rasoi Modular Kitchens|L-shape kitchen, from:120000;Straight kitchen, from:85000;Design visit:
glass-fabricator|Glass & aluminium fabricator|ClearView Glass Works|Sliding window, per sq ft:380;Shower partition:14000;Office partition, per sq ft:320
borewell-drilling|Borewell drilling|Jal Borewells|Drilling, per ft:90;Motor fitting:6500;Site survey:1500
locksmith|Locksmith|Chaabi Wala|Door unlocking:400;Duplicate key:100;Lock fitting:500
inverter-dealer|Inverter & battery dealer|PowerBack Inverters|Inverter with battery:18500;Battery only:11500;Installation:500
welding-fabrication|Welding & fabrication|Loha Works|Main gate, per sq ft:320;Window grill, per sq ft:180;Tin shed, per sq ft:140
false-ceiling|False ceiling & POP|Ceiling Craft|POP ceiling, per sq ft:75;Gypsum ceiling, per sq ft:95;Wall moulding, per ft:60
home-automation|Home automation installer|SmartGhar|Smart switches, per room:6500;Smart door lock:12000;Full home package:
tank-cleaning|Water tank cleaning|Saaf Tank|500-litre tank:500;1000-litre tank:700;Underground tank:1500
sofa-repair|Sofa & upholstery repair|Sofa Doctor|Re-cushioning, per seat:900;Fabric change, per seat:1500;Sofa dry clean, per seat:250
chimney-service|Chimney & hob service|Kitchen Care Service|Chimney cleaning:800;Hob repair:500;Chimney installation:700
lift-maintenance|Lift & elevator maintenance|UpLift Services|Yearly plan, per lift:28000;Breakdown visit:1500;Safety inspection:2500`,
  },
  {
    id: "idea-pros", name: "Professionals & agencies", mood: "professional", glyph: "💼", verb: "Consult",
    servicesTitle: "Services & fees", serviceLabel: "service", highlightsTitle: "Why clients choose us",
    highlights: ["Qualified and registered", "Clear fees", "On-time work", "Confidential", "Document pickup", "Online meetings", "Years of experience", "Reminders before due dates"],
    leadTitle: "Book a first consultation", leadButton: "Book my consultation", offerNote: "Tell us what you need help with. We will call you to fix a time.",
    listing: "Your services and fees, consultation requests on WhatsApp, your profile and timings.", line: "Clear advice and paperwork done on time.", about: "services and fees", stock: ["consultant", "chartered-accountant", "lawyer"],
    items: `gst-practitioner|GST & tax practitioner|TaxSaathi|GST return, monthly:800;Income tax return:1200;GST registration:2000
company-secretary|Company secretary|CS Associates|Company registration:9000;Annual compliance:15000;LLP registration:7500
insurance-advisor|Insurance advisor|Suraksha Advisors|Term plan review:;Health plan comparison:;Claim help:
mutual-fund-distributor|Mutual fund distributor|Nivesh Mitra|Goal planning session:;SIP setup:;KYC help:
notary|Notary & documentation|City Notary Services|Affidavit:200;Rent agreement:800;Notarisation, per page:50
property-valuer|Property valuer|Mulya Valuers|Flat valuation:3500;Land valuation:5000;Bank valuation report:4500
civil-contractor|Civil contractor|Nirman Contractors|House construction, per sq ft:1650;Renovation, per sq ft:900;Consultation:
structural-engineer|Structural engineer|StrongBase Engineers|Structural design, per sq ft:12;Stability certificate:8000;Site inspection:3000
placement-agency|Placement & HR agency|RozgarLink|Candidate registration:;Employer hiring, per position:;Payroll staffing:
digital-marketing-agency|Digital marketing agency|GrowthGali|Social media, monthly:12000;Google ads, monthly:10000;Website audit:
web-developer|Web & app developer|CodeKaar|Business website:18000;Online store:35000;Mobile app:
translator|Translator & interpreter|Bhasha Bridge|Translation, per page:350;Certified translation, per page:600;Interpreter, per hour:1500
astrologer|Astrologer|Jyotish Kendra|Kundli reading:1100;Kundli matching:800;Phone consultation:700
vastu-consultant|Vastu consultant|Vastu Marg|Home vastu visit:3100;Office vastu visit:5100;Plan review online:1500
matrimony-bureau|Matrimony bureau|Shubh Vivah Bureau|Registration:1100;Assisted search, 3 months:7500;Premium service:21000
visa-consultant|Visa & immigration consultant|GoGlobal Visas|Tourist visa help:3500;Student visa help:15000;Eligibility check:
study-abroad|Study abroad consultant|Udaan Overseas|Counselling session:;Application help, per university:5000;Full admission package:35000
detective-agency|Detective agency|Satya Investigations|Pre-matrimonial check:;Employee background check:;Surveillance, per day:
career-counsellor|Career counsellor|Disha Careers|Aptitude test with report:1500;Counselling session:1000;Stream selection package:2500
event-emcee|Event emcee & anchor|Anchor Riya|Wedding sangeet:15000;Corporate event:20000;Birthday party:6000
trademark-agent|Patent & trademark agent|MarkSafe IP|Trademark search:500;Trademark filing:6500;Copyright filing:5000
payroll-consultant|Labour law & payroll consultant|PayRight Consultants|PF and ESI registration:5000;Monthly payroll, per employee:150;Compliance audit:
import-export-consultant|Import-export consultant|TradeSetu|IEC registration:2500;Export documentation:;Buyer search help:
claims-consultant|Insurance claims consultant|ClaimSahayak|Claim review:;Fire claim help:;Motor claim help:
pandit-booking|Pandit & priest booking|Pandit Ji Seva|Griha pravesh puja:5100;Satyanarayan katha:2100;Vivah sanskar:11000`,
  },
  {
    id: "idea-classes", name: "Classes & academies", mood: "learning", glyph: "🎓", verb: "Learn at",
    servicesTitle: "Courses & fees", serviceLabel: "course", highlightsTitle: "Why students join us",
    highlights: ["Small batches", "Experienced teachers", "Demo class", "Weekend batches", "Certificates", "Regular tests", "Parent updates", "Online option"],
    leadTitle: "Book a free demo class", leadButton: "Book my demo", offerNote: "Tell us the student's age and the course. We will share the batch timings.",
    listing: "Your courses and fees, batch timings, results and demo class requests on WhatsApp.", line: "Good teaching, small batches, real progress.", about: "courses and fees", stock: ["coaching-center", "tutor"],
    items: `computer-institute|Computer training institute|TechSkill Computers|Basic computer course:3000;Tally with GST:6000;Web design:12000
spoken-english|Spoken English academy|SpeakWell Academy|Beginner, 2 months:3500;Advanced, 2 months:4500;Interview preparation:2500
abacus-classes|Abacus & vedic maths|Brainy Abacus|Abacus, per month:800;Vedic maths, per month:800;Level kit:600
ielts-coaching|IELTS & PTE coaching|BandUp IELTS|IELTS, 1 month:8000;PTE, 1 month:8000;Mock test:500
upsc-academy|UPSC & civil services academy|Lakshya IAS Academy|Foundation course:85000;Prelims test series:6000;Mains answer writing:12000
robotics-lab|Robotics & STEM lab|RoboKids Lab|Junior course, per month:1500;Senior course, per month:2000;Weekend workshop:800
art-classes|Art & drawing classes|Rang Tarang Art Classes|Kids batch, per month:1000;Adult batch, per month:1500;Exam preparation:2000
chess-academy|Chess academy|Checkmate Academy|Beginner, per month:1200;Intermediate, per month:1800;Online class, per month:1500
swimming-academy|Swimming academy|AquaLearn Swimming|Learn to swim, 1 month:3500;Kids batch, 1 month:3000;Personal coaching, per session:600
cricket-academy|Cricket academy|Stumps Cricket Academy|Junior coaching, per month:2000;Senior coaching, per month:2500;Net session, per hour:500
skating-classes|Skating classes|Roll On Skating|Beginner, per month:1200;Advanced, per month:1500;Skates, pair:2200
karate-classes|Karate & martial arts|Dojo Karate Academy|Kids batch, per month:1000;Adult batch, per month:1200;Self-defence workshop:500
language-classes|Foreign language classes|LinguaHub|German A1:12000;French A1:12000;Japanese N5:14000
study-library|Study library & reading room|Gyan Library|Half day seat, monthly:600;Full day seat, monthly:1000;AC cabin, monthly:1800
tailoring-classes|Sewing & tailoring classes|Silai Kendra|Basic course, 2 months:3000;Blouse making:2500;Advanced course, 3 months:6000
cooking-classes|Cooking classes|Tadka Cooking Classes|One-day workshop:800;Baking course:3500;Kids' baking camp:1500
beautician-institute|Beautician training institute|Glow Beauty Academy|Basic beautician course:15000;Bridal makeup course:25000;Hair styling course:12000
teacher-training|Teacher training institute|Shikshak Training Institute|NTT course:18000;B.Ed entrance prep:8000;Demo teaching workshop:1500
handwriting-classes|Handwriting & calligraphy classes|Sulekh Classes|Handwriting course:2000;Calligraphy course:2500;Online course:1500
online-course-creator|Online course creator|LearnWithMe|Starter course:999;Complete course:2999;One-to-one session:1500
phonics-classes|Phonics & reading classes|Little Readers|Phonics level 1:3000;Phonics level 2:3500;Reading club, per month:800
public-speaking|Public speaking & debate club|SpeakUp Club|Kids programme:4000;Adults programme:5000;Weekend workshop:1200
acting-school|Acting & theatre school|Rangmanch Acting School|Weekend workshop:2500;3-month course:18000;Audition preparation:3000
film-making-course|Film-making & editing course|Reel School|Video editing course:12000;Film-making course:25000;Mobile film-making workshop:2000
stock-market-training|Stock market training|Market Pathshala|Basics course:4000;Technical analysis course:9000;Weekend batch:6000
sanskrit-classes|Sanskrit & shloka classes|Sanskrit Sabha|Kids shloka batch, per month:500;Spoken Sanskrit course:2000;Online class, per month:700
music-production|Music production academy|BeatLab Academy|Music production course:30000;Mixing and mastering:15000;Studio hour:800
coding-for-kids|Coding classes for kids|CodeChamps|Scratch coding, per month:1500;Python for kids, per month:2000;Free trial class:`,
  },
  {
    id: "idea-sports", name: "Fitness, sports & fun", mood: "lively", glyph: "🏅", verb: "Join",
    servicesTitle: "Plans & prices", serviceLabel: "plan", highlightsTitle: "What you get",
    highlights: ["Trained coaches", "Safe equipment", "Beginner friendly", "Morning and evening slots", "Kids' batches", "Group offers", "Parking", "Changing rooms"],
    leadTitle: "Book a trial session", leadButton: "Book my trial", offerNote: "Tell us your age group and preferred time. We will confirm your slot.",
    listing: "Your plans and prices, timings, photos and booking requests on WhatsApp.", line: "Come play, train and feel better.", about: "plans and timings", stock: ["gym-website", "yoga-studio"],
    items: `zumba-studio|Zumba studio|Zumba Zone|Monthly pass:1500;Quarterly pass:4000;Drop-in class:200
crossfit-box|CrossFit & functional training box|Iron Tribe Box|Monthly:3000;Quarterly:8000;Drop-in:400
badminton-academy|Badminton academy & courts|Smash Badminton Arena|Court, per hour:400;Coaching, per month:2500;Monthly court pass:3500
box-cricket-turf|Box cricket turf|Turf Town|Day slot, per hour:800;Night slot, per hour:1200;Tournament booking:
swimming-pool|Swimming pool|Blue Wave Pool|Single entry:150;Monthly pass:2500;Family monthly pass:6000
meditation-centre|Meditation centre|Shanti Dhyan Kendra|Intro session:;8-week course:3500;Weekend retreat:4500
naturopathy-centre|Naturopathy centre|Prakriti Naturopathy|Consultation:500;Day therapy:1500;7-day stay programme:21000
pilates-studio|Pilates studio|Core Pilates Studio|Group class:500;Private class:1500;8-class pack:3600
kids-play-zone|Kids play zone|Masti Zone|1 hour entry:300;Unlimited day pass:500;Birthday party package:12000
old-age-home|Old age home|Aashray Senior Home|Shared room, monthly:12000;Private room, monthly:20000;Assisted care, monthly:28000
rehab-centre|De-addiction & rehab centre|Nayi Subah Centre|Assessment:;One-month programme:;Family counselling session:
sports-club|Sports club|City Sports Club|Monthly membership:2000;Yearly membership:18000;Guest day pass:300
cycling-club|Cycling club|Pedal Pushers|Yearly membership:1000;Sunday ride:;Cycle rent, per ride:300
running-club|Running club|Dawn Runners|Monthly training:800;10K training plan:2500;Yearly membership:5000
trekking-group|Trekking & adventure group|Trail Yatri|One-day trek:1200;Weekend trek:3500;Himalayan trek:14000
gaming-arcade|Gaming arcade & bowling|FunStrike Arcade|Bowling, per game:200;Arcade card:500;Party package:8000
escape-room|Escape room|Lock & Clue|Per person, group of 4:500;Per person, group of 2:700;Corporate booking:
horse-riding-school|Horse riding school|Ashva Riding School|Single lesson:800;8-lesson pack:5500;Pony ride:200
archery-range|Archery & shooting range|Bullseye Range|Archery, 30 minutes:300;Air rifle, 20 shots:250;Coaching, per month:3000
table-tennis-academy|Table tennis academy|Spin TT Academy|Table, per hour:150;Coaching, per month:2000;Monthly table pass:1500
football-academy|Football academy|Kickoff Football Academy|Under-10, per month:1500;Under-16, per month:1800;Turf, per hour:1000
boxing-gym|Boxing gym|Punch Boxing Club|Fitness boxing, per month:2000;Coaching, per month:3000;Trial class:200
paintball|Paintball & laser tag|Battle Zone|Paintball, 30 balls:400;Laser tag, 15 minutes:250;Team package for 10:3500
snooker-parlour|Snooker & pool parlour|Cue Club|Pool, per hour:150;Snooker, per hour:200;Monthly membership:2500
water-park|Water park|Splash World|Adult ticket:600;Child ticket:400;Group of 20, per person:450
amusement-park|Amusement park|Wonder Park|Entry with 10 rides:500;All rides pass:900;School group, per student:350
kids-adventure-camp|Adventure camp for kids|Camp Junoon|Day camp:800;3-day summer camp:4500;7-day summer camp:9500
yoga-teacher-training|Yoga teacher training school|Yog Path School|200-hour course:35000;100-hour course:20000;Weekend intensive:6000`,
  },
  {
    id: "idea-beauty", name: "Beauty & fashion", mood: "beauty", glyph: "💇", verb: "Book at",
    servicesTitle: "Services & prices", serviceLabel: "service", highlightsTitle: "Why clients love us",
    highlights: ["Trained stylists", "Hygienic tools", "Top brands", "Bridal packages", "Home service", "Appointments on WhatsApp", "Air-conditioned", "Offers for members"],
    leadTitle: "Book an appointment", leadButton: "Book my slot", offerNote: "Tell us the service and time you want. We will confirm on WhatsApp.",
    listing: "Your services and prices, photos of your work and appointment requests on WhatsApp.", line: "Look your best, without the wait.", about: "services and prices", stock: ["salon", "makeup-artist", "boutique-catalogue"],
    items: `barber-shop|Barber shop|Sharp Cuts|Haircut:120;Shave:60;Haircut and beard:160
nail-studio|Nail studio|Nail Bar|Gel polish:600;Nail extensions:1500;Nail art, per nail:50
tattoo-studio|Tattoo studio|Inked Studio|Small tattoo:1500;Per square inch:600;Cover-up consultation:
lash-brow-studio|Lash & brow studio|Lash Lounge|Lash extensions:2500;Brow lamination:1500;Lash lift:1200
saree-draping|Saree draping artist|Drape by Meera|Saree draping:800;Bridal draping:2500;Group of 5:3000
fashion-designer|Fashion designer label|Label Aarohi|Custom blouse:1800;Designer lehenga, from:25000;Consultation:
ethnic-wear-rental|Ethnic wear on rent|Rent the Royal|Lehenga, 3 days:4500;Sherwani, 3 days:3500;Jewellery set, 3 days:800
costume-rental|Costume rental|Fancy Dress House|Kids costume, per day:250;Adult costume, per day:400;Group dance set of 10:2000
sherwani-store|Sherwani & menswear store|Shaan Menswear|Kurta pyjama:1800;Sherwani:12000;Indo-western suit:8500
handbag-brand|Handbag brand|Jhola Co.|Tote bag:1299;Sling bag:999;Clutch:799
wig-studio|Wig & hair extension studio|Crown Hair Studio|Hair extensions:6500;Hair patch:9500;Private consultation:
kids-salon|Kids' salon|Tiny Trims|Kids haircut:200;First haircut with certificate:400;Party hairstyle:300
hair-transplant-clinic|Hair transplant clinic|Regrow Hair Clinic|Consultation:500;Transplant, per graft:30;PRP session:3500
threading-parlour|Threading & waxing parlour|Roop Beauty Parlour|Eyebrow threading:40;Full arms waxing:200;Facial:500
mens-grooming|Men's grooming lounge|The Gentleman's Lounge|Haircut and wash:350;Beard styling:200;Groom package:4500
image-consultant|Image consultant & stylist|StyleSutra|Wardrobe audit:3500;Personal shopping session:4000;Colour analysis:2500
plus-size-boutique|Plus-size fashion boutique|Curve Couture|Kurti:1199;Dress:1899;Custom fitting:
kurti-wholesaler|Kurti wholesaler|Kurti Kingdom Wholesale|Cotton kurtis, set of 10:2800;Rayon kurtis, set of 10:3500;Kurti with pant, set of 6:3200
shoe-customisation|Shoe customisation studio|Kicks Custom|Hand-painted sneakers:2500;Name customisation:800;Bridal sneakers:3500`,
  },
  {
    id: "idea-stays", name: "Stays, venues & travel", mood: "stay", glyph: "🏡", verb: "Stay at",
    servicesTitle: "Rooms & rates", serviceLabel: "room or package", highlightsTitle: "What guests like",
    highlights: ["Clean rooms", "Home-style food", "Hot water", "Parking", "Family friendly", "Wi-Fi", "Power backup", "Local guidance"],
    leadTitle: "Check availability", leadButton: "Check my dates", offerNote: "Share your dates and number of guests. We will reply with what is free and the rates.",
    listing: "Your rooms or packages with rates, photos, the way to reach you and date enquiries on WhatsApp.", line: "A comfortable stay with people who care.", about: "rates and free dates", stock: ["hotel", "resort", "hostel-pg"],
    items: `homestay|Homestay|Aangan Homestay|Double room, per night:1800;Family room, per night:2800;Home-cooked dinner:250
farmhouse-rental|Farmhouse on rent|Green Acres Farmhouse|Day picnic:8000;Night stay:15000;Weekend package:26000
banquet-hall|Banquet hall|Utsav Banquet|Hall rent:45000;Veg plate:650;Decoration, from:25000
marriage-garden|Marriage garden & lawn|Vrindavan Marriage Garden|Lawn rent:90000;Lawn with rooms:125000;Decoration, from:40000
dharamshala|Dharamshala|Shri Ram Dharamshala|Dormitory bed:150;Double room:600;AC room:1100
camping-site|Camping site|Starlit Camps|Tent for two:2200;Tent with meals:3200;Bonfire evening:500
houseboat|Houseboat|Backwater Bliss|Day cruise:6500;One-bedroom overnight:9500;Two-bedroom overnight:14500
pilgrimage-tours|Pilgrimage tour operator|Teerth Yatra Tours|Char Dham yatra:38000;Jyotirlinga yatra:22000;Jain tirth yatra:15000
coworking-space|Coworking space|DeskHub|Day pass:350;Dedicated desk, monthly:6000;Meeting room, per hour:500
guest-house|Guest house|Atithi Guest House|Single room:900;Double room:1400;AC double room:1900
serviced-apartment|Serviced apartment|StayEase Apartments|Studio, per night:2200;1 BHK, per night:3200;1 BHK, monthly:42000
villa-rental|Villa rental|Casa Verde Villa|Weekday, per night:14000;Weekend, per night:20000;Extra guest:1200
bed-breakfast|Bed & breakfast|Morning Glory B&B|Double room with breakfast:2400;Family room with breakfast:3600;Extra bed:600
ticket-agent|Ticket booking agent|Safar Tickets|Train ticket booking:50;Flight ticket booking:300;Bus ticket booking:30
hajj-umrah-tours|Hajj & Umrah tours|Al Noor Tours|Umrah, 15 days:95000;Umrah, Ramadan:135000;Hajj package:
party-hall|Small party hall|Celebration Hall|Hall, 4 hours:8000;Hall with decor:12000;Snacks, per plate:180
meeting-room-rental|Conference & meeting room rental|MeetPoint|6-seater, per hour:500;12-seater, per hour:900;Full day:6000
hill-cottage|Hill station cottage|Pine View Cottage|Off-season, per night:3500;Season, per night:5500;Extra mattress:500
beach-shack|Beach shack|Sunset Shack|Beach hut, per night:2500;Seafood thali:450;Evening party booking:
safari-resort|Wildlife safari resort|Jungle Trails Resort|Cottage, per night:6500;Jeep safari:4500;Two-night package:18000
tour-guide|Local tour guide|Galiyon Ke Guide|Heritage walk:500;Food walk:800;Full-day guide:2500
adventure-sports|Adventure sports operator|Thrill Factory|River rafting:1500;Paragliding:3000;Bungee jump:3500
glamping-site|Luxury tent & glamping site|Canvas & Stars|Luxury tent, per night:7500;Tent with meals:9500;Candlelight dinner:2500`,
  },
  {
    id: "idea-events", name: "Events & entertainment", mood: "lively", glyph: "🎉", verb: "Book",
    servicesTitle: "Packages & rates", serviceLabel: "package", highlightsTitle: "Why people book us",
    highlights: ["Experienced team", "On-time setup", "Own equipment", "Custom themes", "Outstation events", "Clear rates", "Backup arrangements", "Photos and videos of past events"],
    leadTitle: "Check date and price", leadButton: "Check my date", offerNote: "Tell us your event date, place and guest count. We will send a quote.",
    listing: "Your packages and rates, photos of past events and date enquiries on WhatsApp.", line: "We make your function the one people remember.", about: "packages and free dates", stock: ["event-planner", "decorator"],
    items: `dj-service|DJ service|DJ Beatz|Birthday party:8000;Wedding sangeet:25000;Corporate event:20000
band-baaja|Band baaja & dhol|Shehnai Band|Dhol, 2 players:5000;Band, 11 members:21000;Band, 21 members:41000
tent-house|Tent house|Mangal Tent House|Pandal, per sq ft:25;Chair, per piece:12;Stage setup:8000
sound-light-rental|Sound & lighting rental|SoundCraft Rentals|Speaker pair with mic:2500;DJ sound setup:9000;Stage lights:6000
magician|Magician & kids entertainer|Jadugar Raju|Birthday magic show:5000;School show:8000;Balloon and tattoo artist:2500
wedding-choreographer|Wedding choreographer|Step Up Sangeet|One dance:3500;Family package, 5 dances:15000;Couple dance:6000
live-band|Live band|Sur Taal Live|Acoustic duo:15000;Four-piece band:35000;Sufi night:50000
photo-booth-rental|Photo booth rental|SnapBooth|2 hours:8000;4 hours:14000;360 video booth:18000
wedding-card-printer|Wedding card printer|Shubh Cards|Simple card, per 100:1500;Designer card, per 100:4500;Box card, per 100:9000
baggi-horse|Baggi & horse for baraat|Royal Baggi|Ghodi:6000;Baggi, two horses:15000;Vintage car:12000
fireworks-shop|Fireworks shop|Roshni Fireworks|Family pack:1500;Sparklers, box of 10:120;Sky shot, 30 shots:900
drone-shoot|Drone shoot service|SkyFrame Drones|Wedding drone, per day:8000;Property shoot:5000;Event shoot, 2 hours:4000
led-wall-rental|LED wall & stage rental|BrightStage|LED wall, per sq ft:120;Stage, 20 by 12 ft:12000;Truss setup:8000
party-rentals|Bouncy castle & party rentals|Jump & Joy Rentals|Bouncy castle, 4 hours:3500;Popcorn machine:1500;Game stalls, set of 3:3000
event-security|Event security & bouncers|ShieldGuard Security|Bouncer, per shift:1500;Team of 5:7000;Lady guard, per shift:1500
balloon-decorator|Balloon decorator|Balloon Bash|Birthday decor:2500;Baby shower decor:4500;Car decoration:1500
comedy-club|Stand-up & comedy club|Hasi Ghar Comedy Club|Show ticket:399;Open mic spot:;Private show booking:
kavi-sammelan|Kavi sammelan organiser|Kavya Manch|Three poets:;Five poets:;Hasya kavi evening:
folk-artists|Puppet show & folk artists|Kathputli Kala Mandal|Puppet show:4000;Folk dance troupe:12000;Rajasthani music group:9000
garba-organiser|Garba & dandiya organiser|Raas Garba Nights|Single night pass:300;Season pass:1500;Garba practice classes:800`,
  },
  {
    id: "idea-b2b", name: "Manufacturing & B2B", mood: "wholesale", glyph: "🏭", verb: "Enquire with",
    servicesTitle: "Products & supply", serviceLabel: "product", highlightsTitle: "Why buyers work with us",
    highlights: ["Own unit", "Bulk supply", "Custom orders", "Quality checked", "GST invoice", "On-time dispatch", "Delivery across India", "Samples available"],
    leadTitle: "Request a quote", leadButton: "Send my requirement", offerNote: "Share the product, quantity and delivery city. We will send our best rate.",
    listing: "Your products, what you can supply, photos of your unit and quote requests on WhatsApp.", line: "Dependable supply, consistent quality, fair rates.", about: "products and rates", stock: ["wholesaler", "hardware-store"],
    items: `manufacturer|Manufacturer company site|Shakti Industries|Standard products:;Custom manufacturing:;Bulk supply:
exporter|Exporter|Bharat Exports|Product catalogue:;Private labelling:;Export shipments:
printing-press|Printing press|Chhap Printers|Visiting cards, per 1000:400;Pamphlets, per 1000:900;Bill books, per book:120
packaging-manufacturer|Packaging manufacturer|BoxWala Packaging|Corrugated boxes:;Printed cartons:;Mithai boxes:
garment-manufacturer|Garment manufacturer|StitchLine Garments|T-shirts, per piece:180;Uniforms, per set:550;Private label orders:
furniture-manufacturer|Furniture manufacturer|OakLine Furniture|Office workstations:;Hotel furniture:;School furniture:
steel-trader|Steel & iron trader|Loha Mandi Traders|TMT bars, per kg:62;MS angles, per kg:65;Sheets and plates:
chemical-supplier|Chemical supplier|ChemSource|Industrial solvents:;Cleaning chemicals:;Water treatment chemicals:
plastic-moulding|Plastic moulding unit|PolyForm Plastics|Injection moulding:;Blow moulding:;Mould making:
machinery-dealer|Machinery dealer|MachWorld|Packaging machines:;Food processing machines:;Demo and installation:
scrap-dealer|Scrap dealer|Kabadi Express|Newspaper, per kg:14;Iron, per kg:28;Plastic, per kg:10
cold-storage|Cold storage|Himalaya Cold Storage|Potato, per bag per season:150;Fruit chamber, per crate:;Frozen storage:
warehouse-rental|Warehouse for rent|StoreSpace Warehouses|Per sq ft, monthly:18;Racked storage, per pallet:350;Open yard, per sq ft:8
courier-franchise|Courier franchise|Speedy Courier|Local parcel, up to 500 g:40;National parcel, up to 500 g:80;Bulk pickup:
safety-products|Industrial safety products|SafeHands PPE|Safety helmet:180;Safety shoes:850;Reflective jacket:120
signage-printing|Signage & flex printing|SignCraft|Flex banner, per sq ft:12;Glow sign board, per sq ft:450;Vinyl print, per sq ft:35
cnc-laser-cutting|CNC & laser cutting|PrecisionCut|MS laser cutting:;Acrylic cutting:;CNC wood carving:
water-tanker|Water tanker supplier|Jal Seva Tankers|5000-litre tanker:700;10000-litre tanker:1200;Monthly contract:
corporate-gifting|Corporate gifting company|GiftWorks|Diwali gift box:650;Branded diary and pen:350;Welcome kit:1200
office-supplies|Office supplies distributor|DeskMart Supplies|A4 paper, per ream:260;Printer cartridge:650;Monthly supply account:
industrial-electrical|Industrial electrical contractor|PowerLine Contractors|Panel installation:;Factory wiring:;Annual maintenance:
fire-safety-dealer|Fire safety equipment dealer|FireShield|ABC extinguisher, 4 kg:1400;Refilling:350;Yearly maintenance:
label-printing|Label & sticker printing|StickIt Labels|Product labels, per 1000:600;Barcode labels, per roll:220;Custom stickers:
textile-mill|Textile mill / powerloom|Tana Bana Textiles|Cotton grey fabric:;Dyed fabric:;Job work:
handicraft-exporter|Brass & handicraft exporter|Peetal Kala Exports|Brass idols:;Decor pieces:;Custom designs:
agarbatti-manufacturer|Agarbatti manufacturer|Sugandh Agarbatti|Agarbatti, per kg:160;Dhoop sticks, per dozen box:240;Private label packing:
pharma-franchise|Pharma franchise (PCD)|MediCure Pharma|Tablets and capsules:;Syrups:;Franchise enquiry:
motor-rewinding|Electric motor rewinding|Motor Clinic|Fan rewinding:350;1 HP motor rewinding:1200;Submersible pump repair:2500`,
  },
  {
    id: "idea-farm", name: "Farm & rural", mood: "agri", glyph: "🌾", verb: "Buy from",
    servicesTitle: "Products & rates", serviceLabel: "product", highlightsTitle: "Why buyers come to us",
    highlights: ["Farm fresh", "Fair rates", "Bulk supply", "Home delivery", "Farm visits", "Expert advice", "Seasonal produce", "UPI accepted"],
    leadTitle: "Ask for today's rates", leadButton: "Send enquiry", offerNote: "Tell us what you need and how much. We will reply with today's rate.",
    listing: "Your products and rates, photos of your farm and buyer enquiries on WhatsApp.", line: "Straight from the farm, at honest rates.", about: "products and today's rates", stock: ["agri-store"],
    items: `dairy-farm|Dairy farm|Nandini Dairy Farm|A2 milk, 1 litre:80;Ghee, 500 ml:700;Farm visit, per person:150
poultry-farm|Poultry farm|Sunrise Poultry|Eggs, tray of 30:190;Desi eggs, dozen:150;Broiler, per kg:120
fish-farm|Fish farm|Matsya Fish Farm|Rohu, per kg:180;Katla, per kg:200;Fish seed, per 1000:
plant-nursery|Plant nursery|Hara Bhara Nursery|Indoor plant:250;Flowering plant:120;Garden setup visit:800
tractor-dealer|Tractor dealer|Kisan Tractors|35 HP tractor:;45 HP tractor:;Service:1800
farm-equipment-rental|Farm equipment rental|Krishi Rentals|Rotavator, per hour:900;Harvester, per acre:1800;Tractor with trolley, per day:2500
fpo|Farmer producer organisation (FPO)|Annadata FPO|Wheat, per quintal:;Soybean, per quintal:;Pulses, per quintal:
goat-farm|Goat farm|Bakri Baug|Sirohi goat, per kg live weight:400;Kids, each:4500;Training, one day:1000
mushroom-farm|Mushroom farm|ShroomFresh|Button mushroom, 200 g:50;Oyster mushroom, 200 g:60;Training, one day:1500
honey-farm|Beekeeping & honey farm|Madhu Vatika|Raw honey, 500 g:400;Bee box:4500;Beekeeping training:2000
flour-mill|Flour mill (chakki)|Taza Atta Chakki|Wheat grinding, per kg:5;Fresh atta, 10 kg:420;Multigrain atta, 5 kg:320
rice-mill|Rice mill|Annapurna Rice Mill|Basmati, 25 kg:2400;Sona masoori, 25 kg:1500;Broken rice, 25 kg:900
drip-irrigation|Drip irrigation dealer|BoondBoond Irrigation|Drip system, per acre:35000;Sprinkler set:9000;Site visit:
agro-tourism|Agro-tourism farm|Mitti Farm Stay|Day visit with lunch:700;Night stay, per person:2200;School trip, per student:350
cattle-feed|Fodder & cattle feed supplier|Pashu Aahar Kendra|Cattle feed, 50 kg:1350;Mineral mixture, 1 kg:140;Green fodder, per quintal:
krishi-kendra|Krishi seva kendra|Kisan Seva Kendra|Seeds:;Fertilisers:;Soil testing:300
vermicompost|Vermicompost producer|Kechua Khad|Vermicompost, 5 kg:150;Vermicompost, 50 kg:600;Training, half day:500
horticulture-farm|Horticulture farm|Phal Bagicha|Mangoes, per kg:120;Guava, per kg:60;Orchard visit:100
sugarcane-jaggery-unit|Sugarcane juice & jaggery unit|Ganna Ghar|Sugarcane juice, glass:20;Fresh jaggery, 1 kg:80;Liquid jaggery, 1 litre:160`,
  },
  {
    id: "idea-property", name: "Real estate & construction", mood: "property", glyph: "🏗️", verb: "Enquire with",
    servicesTitle: "What we offer", serviceLabel: "item", highlightsTitle: "Why people choose us",
    highlights: ["Clear paperwork", "Site visits", "Fair rates", "Experienced team", "On-time delivery", "Loan guidance", "Quality materials", "Local knowledge"],
    leadTitle: "Book a site visit", leadButton: "Book my visit", offerNote: "Tell us what you are looking for and your budget. We will call you.",
    listing: "What you offer with rates, photos, your location and visit requests on WhatsApp.", line: "Clear deals and solid work you can trust.", about: "rates and details", stock: ["real-estate", "architect"],
    items: `builder-project|Builder project site|Shanti Heights|2 BHK, from:3800000;3 BHK, from:5600000;Site visit:
plot-seller|Plot & layout seller|Green Valley Plots|1000 sq ft plot:1200000;1500 sq ft plot:1800000;Corner plot:
building-materials|Building materials supplier|Majboot Building Materials|Cement, per bag:380;Sand, per trolley:4500;Aggregate, per trolley:3800
ready-mix-concrete|Ready-mix concrete plant|RockMix RMC|M20, per cubic metre:4800;M25, per cubic metre:5200;Pump charges:
land-surveyor|Land surveyor|Seema Surveyors|Plot demarcation:5000;Total station survey, per acre:3500;Contour survey:
marble-granite|Marble & granite showroom|Sangemarmar Stone House|Marble, per sq ft:90;Granite, per sq ft:120;Fitting, per sq ft:35
scaffolding-rental|Scaffolding & shuttering rental|Jack & Plate Rentals|Shuttering plate, per day:3;Scaffolding set, per day:25;Props, per day:2
prefab-structures|Prefab & PEB structures|SteelNest Prefab|Site office cabin:;Warehouse shed:;Portable toilet:
property-management|Property management service|GharSambhal|Rent collection:;Tenant search:;Maintenance plan, monthly:1500
landscape-architect|Landscape architect|GreenLine Landscapes|Garden design, per sq ft:40;Terrace garden:;Consultation:2000
brick-kiln|Brick kiln|Lal Eent Bhatta|Red bricks, per 1000:7500;Fly ash bricks, per 1000:5500;Delivery, per trip:1500
pool-builder|Swimming pool builder|AquaBuild Pools|Home pool, from:900000;Pool renovation:;Yearly maintenance:60000
home-inspection|Home inspection service|GharCheck Inspections|Flat inspection:4500;Villa inspection:8000;Rental move-in check:2500
wooden-flooring|Wooden flooring dealer|FloorCraft|Laminate flooring, per sq ft:95;Engineered wood, per sq ft:280;Fitting, per sq ft:20
paver-blocks|Paver blocks manufacturer|PaveLine Blocks|Zigzag paver, per sq ft:38;Colour paver, per sq ft:48;Laying, per sq ft:12
co-living|Co-living operator|NestTogether|Shared room, monthly:7500;Private room, monthly:13000;Meals, monthly:3500`,
  },
  {
    id: "idea-pets", name: "Pet services", mood: "pets", glyph: "🐾", verb: "Book",
    servicesTitle: "Services & prices", serviceLabel: "service", highlightsTitle: "Why pet parents choose us",
    highlights: ["Gentle handling", "Trained staff", "Clean space", "Pickup and drop", "Vet on call", "Updates on WhatsApp", "All breeds welcome", "Home visits"],
    leadTitle: "Book a slot", leadButton: "Book my slot", offerNote: "Tell us about your pet and the service you need. We will confirm the time.",
    listing: "Your services and prices, photos and booking requests on WhatsApp.", line: "Kind, careful hands for your pet.", about: "services and prices", stock: ["pet-shop"],
    items: `pet-groomer|Pet groomer|Fluffy Tails Grooming|Bath and blow dry:600;Full grooming:1200;Home service:1500
dog-trainer|Dog trainer|Good Boy Training|Puppy basics, 8 sessions:6000;Obedience course:12000;Single session:900
pet-boarding|Pet boarding & daycare|Wag Stay|Daycare:400;Overnight boarding:700;Weekly boarding:4200
pet-food-brand|Pet food brand|Tail Treats|Dog food, 3 kg:900;Cat food, 1.2 kg:480;Fresh meal subscription, monthly:3500
pet-photographer|Pet photographer|Paw Portraits|Mini shoot:2500;Outdoor shoot:5000;Framed print:1200
pet-taxi|Pet taxi|Pet Cab|Vet visit, round trip:500;Airport transfer:1200;Per km:20`,
  },
  {
    id: "idea-makers", name: "Home businesses & makers", mood: "gifts", glyph: "🎁", verb: "Order from",
    servicesTitle: "Products & prices", serviceLabel: "product", highlightsTitle: "Why people order from us",
    highlights: ["Handmade", "Custom orders", "Gift packing", "Bulk orders", "Ships across India", "Made to order", "Festive specials", "Order on WhatsApp"],
    leadTitle: "Ask for a custom order", leadButton: "Send my order", offerNote: "Tell us what you would like, the quantity and the date you need it.",
    listing: "Your products with prices, photos of your work and orders on WhatsApp.", line: "Made by hand, made for you.", about: "products and prices", stock: ["gift-catalogue", "home-baker"],
    items: `saree-reseller|Saree reseller|Sakhi Sarees|Cotton saree:750;Georgette saree:1100;Silk blend saree:1900
candle-maker|Candle maker|Glow & Wick|Scented jar candle:349;Gift set of 3:899;Bulk favours, each:120
resin-art|Resin art studio|Resin Raag|Name plate:1500;Wall clock:1800;Workshop:1200
crochet-maker|Crochet & knitting maker|Loop & Yarn|Crochet toy:600;Baby set:900;Custom order:
embroidery-work|Embroidery work|Dhaaga Embroidery|Blouse embroidery:1200;Hand embroidery hoop:800;Name on fabric:250
rangoli-artist|Rangoli artist|Rangoli by Rekha|Home rangoli:800;Wedding rangoli:3500;Corporate event rangoli:5000
gift-hamper-maker|Gift hamper maker|Hamper House|Birthday hamper:999;Festive hamper:1499;Corporate hamper:
return-gifts|Return gifts supplier|Return Gift Wala|Gifts under 50 rupees, each:45;Gifts under 100 rupees, each:90;Premium gifts, each:220
home-salon|Home salon service|Glam at Home|Facial at home:700;Waxing, full arms and legs:500;Party makeup:2000
saree-fall-pico|Saree fall-pico & alteration|Fall Pico Corner|Fall and pico:80;Blouse alteration:120;Pickup and drop:50
soap-maker|Handmade soap maker|Sabun Studio|Handmade soap:120;Box of 4:420;Wedding favours, each:90
block-print-studio|Block print studio|Thappa Block Prints|Printed dupatta:650;Cotton fabric, per metre:220;Workshop:1000
terrarium-maker|Terrarium & plant decor maker|Tiny Jungle|Small terrarium:800;Large terrarium:2200;Workshop:1200
macrame-maker|Macramé maker|Knot Story|Wall hanging:900;Plant hanger:400;Custom order:
rakhi-maker|Rakhi maker|Rakhi Ghar|Thread rakhi:40;Designer rakhi:120;Rakhi box for abroad:900
potli-bags|Potli bags maker|Potli Palace|Potli bag:250;Embroidered potli:450;Wedding favours, each:120
cake-toppers|Custom cake toppers & decor|Topper Tales|Name topper:250;Theme topper set:600;Custom order:
paper-craft|Paper craft & quilling|Quill & Fold|Quilled card:150;Photo frame:450;Custom order:
clay-jewellery|Clay jewellery maker|Mitti Jewels|Earrings:250;Necklace set:650;Custom order:
mehndi-cones|Mehndi cones maker|Hina Cones|Cone:25;Box of 12:250;Wholesale, 100 cones:1800
lippan-art|Lippan art & mud mirror work|Lippan Kala|Small frame:900;Large wall piece:4500;Workshop:1200
painted-diyas|Hand-painted diyas & pots|Diya Decor|Painted diyas, set of 6:180;Painted pot:350;Bulk, 100 diyas:2200
personalised-gifts|Personalised gifts studio|NameIt Gifts|Engraved pen:350;Photo cushion:499;Name keychain:150`,
  },
  {
    id: "idea-agents", name: "Local agents & services", mood: "business", glyph: "🧾", verb: "Visit",
    servicesTitle: "Services & fees", serviceLabel: "service", highlightsTitle: "Why people come to us",
    highlights: ["Quick service", "Clear fees", "Document help", "Trusted locally", "Open all week", "UPI accepted", "Home pickup", "Form filling help"],
    leadTitle: "Ask about a service", leadButton: "Send enquiry", offerNote: "Tell us the work. We will reply with the fee and the papers to bring.",
    listing: "Your services and fees, the papers people should bring, timings and enquiries on WhatsApp.", line: "Your paperwork and small jobs, sorted quickly.", about: "services and fees", stock: ["stationery-shop", "mobile-shop"],
    items: `csc-centre|Common service centre (CSC)|Jan Seva Kendra|Aadhaar update:100;PAN card application:150;Income certificate:100
passport-help-desk|Passport & visa help desk|Passport Sahayata|Passport form filling:300;Appointment booking:200;Police verification help:
print-shop|Photocopy, print & lamination shop|Print Point|Photocopy, per page:2;Colour print, per page:10;Lamination:30
cyber-cafe|Cyber café|NetZone Cyber Café|Internet, per hour:30;Online form filling:100;Print, per page:5
rto-agent|RTO agent|Vahan Sahayak|Learner's licence:600;Driving licence:1500;RC transfer:1800
recharge-shop|Recharge & bill payment shop|PayPoint|Mobile recharge:;Electricity bill payment:10;Money transfer:
typing-drafting|Typing & legal drafting shop|Dastavez Typing Centre|Affidavit typing:100;Rent agreement drafting:500;Hindi typing, per page:30
stamp-vendor|Stamp vendor|Stamp Paper Wala|100-rupee stamp paper:110;500-rupee stamp paper:520;E-stamp help:50
mobile-repair|Mobile repair shop|Phone Doctor|Screen replacement, from:1200;Battery replacement:700;Charging port repair:400
watch-jewellery-repair|Watch & jewellery repair|Ghadi Saaz|Watch battery:100;Chain repair:200;Gold polish:300
key-shop|Key & duplicate key shop|Chaabi Ghar|Duplicate key:60;Car remote key:1800;Lock repair:200
parcel-booking|Courier & parcel booking point|Parcel Point|Document, within India:60;Parcel, per kg:120;International document:1800
shoe-repair|Shoe repair & polish|Mochi Xpress|Sole pasting:100;Shoe polish:40;Heel replacement:150
umbrella-bag-repair|Umbrella & bag repair|Repair Hut|Umbrella repair:60;Bag zip repair:80;Trolley wheel repair:250
data-recovery|Laptop data recovery|DataBack Lab|Diagnosis:;Deleted file recovery:2500;Hard disk recovery:6500
gas-stove-repair|Gas stove repair|Chulha Care|Service visit:250;Burner replacement:350;Pipe and regulator change:450`,
  },
];

const rows = (g: Group) => g.items.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
  const [id, name, sampleName, svc] = l.split("|");
  const services = svc.split(";").map((s) => { const i = s.lastIndexOf(":"); return [s.slice(0, i).trim(), s.slice(i + 1).trim(), ""] as [string, string, string]; });
  return { id, name, sampleName, services };
});

// Photos: each new design borrows the photo sets of the nearest older design in its group.
registerStock(Object.fromEntries(GROUPS_DATA.flatMap((g) => rows(g).map((r) => [r.id, g.stock]))));

/** "Dental clinic", "Chai brand / tea stall chain", "Pharma franchise (PCD)" → the plain noun used in sentences. */
const nounOf = (name: string) => name.replace(/\s*\(.*?\)/g, "").split(" / ")[0].trim().replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());

export const IDEA_SITES: Product[] = GROUPS_DATA.flatMap((g) => rows(g).map((r) => {
  const noun = nounOf(r.name);
  return make({
    id: r.id, name: r.name, glyph: g.glyph, price: IDEA_PRICE, themes: ten(g.mood), noun, heroVerb: g.verb,
    nameLabel: "Business name", namePlaceholder: r.sampleName, tagline: g.listing,
    servicesTitle: g.servicesTitle, serviceLabel: g.serviceLabel, highlightsTitle: g.highlightsTitle, highlightOptions: g.highlights,
    leadTitle: g.leadTitle, leadButton: g.leadButton,
    wa: {
      enquire: `Hi {name}, I found your website on EZYOURLIFE and I'd like to know more about your ${g.about}.`,
      service: "Hi {name}, I'm interested in {item} ({price}). Could you please share the details?",
      lead: "Hi {name}, I'm {lead_name}. I just sent a request on your website. When can we talk?",
    },
    sample: { name: r.sampleName, tagline: g.line, services: r.services, highlights: g.highlights, offer: g.leadTitle, offer_note: g.offerNote },
  });
}));

/** The groups these designs sit under on the Websites page. */
export const IDEA_GROUPS: { id: string; name: string; ids: string[] }[] = GROUPS_DATA.map((g) => ({ id: g.id, name: g.name, ids: rows(g).map((r) => r.id) }));
