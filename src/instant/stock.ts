// Stock photos for the website and card samples, from Unsplash (unsplash.com/license: free for
// commercial use, no permission needed). Unsplash serves them from its CDN at the size we ask for,
// so pages stay light: ~60-120 KB per photo, lazy-loaded, WebP/AVIF where the browser supports it.
// Photographers are credited on /credits/photos.
//
// Each set is [photo id, photographer, Unsplash username]. Products point at sets in STOCK_FOR.

type Shot = readonly [id: string, by: string, user: string];

export const STOCK_SETS = {
  "gym-website": [["1728486145245-d4cb0c9c3470", "Ambitious Studio* | Rick Barrett", "weareambitious"], ["1641337221253-fdc7237f6b61", "Luke Witter", "lukewitter"], ["1722925541142-5db2668ca492", "Tyler Raye", "tcraye"], ["1648995361141-30676a75fd27", "sour moha", "sour_moha"]],
  "personal-trainer": [["1758875570137-8691b7c55033", "Vitaly Gariev", "silverkblack"], ["1758875569423-e9d43652b0a9", "Vitaly Gariev", "silverkblack"], ["1682048682610-20a91f10b29c", "Christopher Campbell", "chrisjoelcampbell"], ["1754839004013-0276d56bc0e7", "Brunxs", "brunxs"]],
  "decorator": [["1604668915840-580c30026e5f", "Lucas Law", "lucaslaw__"], ["1672950631405-05836e68ed6c", "Manav Jain", "manu_manav_j"], ["1771846360155-d1f71e0fb2ff", "Liana S", "cherstve_pechivo"], ["1672950631329-e93b27d28db6", "Manav Jain", "manu_manav_j"]],
  "florist": [["1762088780011-af2da75fa52f", "Zhen Yao", "rex_filmer"], ["1775316762768-2c88bd5e0c1a", "Ryo Tanaka", "callas1900"], ["1775796437897-518871e92627", "Jason Don", "jasondonsh"], ["1790517943321-12a998e71b92", "Denis Gorbuleac", "denisgsv"]],
  "tailor": [["1606501126768-b78d4569d3f9", "Alexander Grey", "sharonmccutcheon"], ["1560796952-f1c9b838544c", "J Williams", "jwill14"], ["1497997092403-f091fcf5b6c4", "Alexander Andrews", "alex_andrews"], ["1630930678172-63343537a00a", "Omar Alrawi", "omaralrawi"]],
  "jeweller": [["1787769499079-a74680d35ad5", "Zayed Ahmed Zadu", "zayed_ahmed_zadu"], ["1777126413365-f4113a23eeab", "PRAHANT STUDIO", "prahantstudio"], ["1601121141461-9d6647bca1ed", "Vaibhav Nagare", "vaibhavnagare"], ["1633934542430-0905ccb5f050", "Segal Jewelry", "segaljewelry"]],
  "electrician": [["1621905251189-08b45d6a269e", "Emmanuel Ikwuegbu", "emmages"], ["1660330589693-99889d60181e", "Raze Solar", "razesolar"], ["1758101755915-462eddc23f57", "Toolmash Expo", "toolmash"], ["1621905251918-48416bd8575a", "Emmanuel Ikwuegbu", "emmages"]],
  "corporate-event": [["1540575467063-178a50c2df87", "Headway", "headwayio"], ["1587825140708-dfaf72ae4b04", "Alexandre Pellaes", "apellaes"], ["1531058020387-3be344556be6", "Jakob Dalbjörn", "jakobdalbjorn"], ["1558008258-3256797b43f3", "Stem List", "stemlist"]],
  "workshop": [["1524178232363-1fb2b075b655", "Quilia", "heyquilia"], ["1591115765373-5207764f72e7", "Matthew Osborn", "matthewosborn"], ["1576085898323-218337e3e43c", "charlesdeluvio", "charlesdeluvio"], ["1551731409-43eb3e517a1a", "Wonderlane", "wonderlane"]],
  "meetup": [["1708578200684-3aa944b73237", "Dennis Zhang", "windagh"]],
  "college-fest": [["1533174072545-7a4b6ad7a6c3", "Danny Howe", "dannyhowe"], ["1459749411175-04bf5292ceea", "Nainoa Shizuru", "nainoa"], ["1470229722913-7c0e2dbbafd3", "Yvette de Wit", "yvettedewit"], ["1506157786151-b8491531f063", "Hanny Naibaho", "hannynaibaho"]],
  "store-opening": [["1472851294608-062f824d29cc", "Mike Petrucci", "mikepetrucci"], ["1575663620136-5ebbfcc2c597", "Tim Mossholder", "timmossholder"], ["1702685873594-6977fc2552c6", "Tim Mossholder", "timmossholder"], ["1698389912782-93fe4c0d3b90", "Tim Mossholder", "timmossholder"]],
  "yoga-studio": [["1787647090307-706df57182d3", "Vitaly Gariev", "silverkblack"], ["1787647089626-e76f1d0275d1", "Vitaly Gariev", "silverkblack"]],
  "salon": [["1634449571010-02389ed0f9b0", "Lindsay Cash", "lindsayrc81"], ["1580618672591-eb180b1a973f", "Adam Winger", "awcreativeut"], ["1562322140-8baeececf3df", "Adam Winger", "awcreativeut"], ["1521590832167-7bcbfaa6381f", "Guilherme Petri", "guipetri"]],
  "spa": [["1600334089648-b0d9d3028eb2", "engin akyurt", "enginakyurt"], ["1598901986949-f593ff2a31a6", "Katherine Hanlon", "tinymountain"], ["1600334129128-685c5582fd35", "engin akyurt", "enginakyurt"], ["1611073615830-9f76902c10fe", "THLT LCX", "thlt_lcx"]],
  "makeup-artist": [["1684868264466-4c4fcf0a5b37", "gurpreet singh", "ajay_gill8054"], ["1638628064365-f08ad0ec8245", "Ashim Das", "das_ashim"], ["1574397188309-e83dfe918ecb", "Pranav Kumar Jain", "peejayvisual"], ["1684868264391-a6dfb89882dd", "gurpreet singh", "ajay_gill8054"]],
  "mehendi-artist": [["1790808415650-9da77af4bba7", "Munmi Boruah", "munmitak"], ["1780247473263-4be70d512f5c", "Mr Catographer", "mrcato"], ["1762950350005-1b235449a4af", "Muneer ahmed ok", "muneerok"], ["1764641851953-0657059e70fc", "Ainur Iman", "mynameisiknow"]],
  "home-baker": [["1499889808931-317a0255c0e9", "Taylor Grote", "taylor_grote"], ["1686221817801-27b85431430d", "Gowtham AGM", "gowthamagm"], ["1592754487253-f64c6f62db21", "Ali Zolghadr", "noobogami"], ["1611980740456-f5d7fddab908", "Nick Fewings", "jannerboy62"]],
  "engagement": [["1484876632310-ddb3b48133cc", "Shelby Deeter", "shelbymary_"], ["1622398925373-3f91b1e275f5", "Mariano Rivas", "colormono"], ["1654699643507-3047b3e07045", "Paige Johnson", "paigelizabethj"], ["1584377334016-464803e03b80", "Kazzle John Delbo", "kzzljhn00"]],
  "save-the-date": [["1496602910407-bacda74a0fe4", "Khamkéo", "mahkeo"], ["1541089404510-5c9a779841fc", "Candice Picard", "candice_picard"], ["1501901609772-df0848060b33", "Carly Rae Hobbins", "carlyrae"], ["1490723186985-6d7672633c86", "Nathan McBride", "nathan_mcb"]],
  "birthday-party": [["1530103862676-de8c9debad1d", "Adi Goldstein", "adigold1"], ["1531956531700-dc0ee0f1f9a5", "Lidya Nada", "lidyanada"], ["1513151233558-d860c5398176", "Jason Leung", "ninjason"], ["1765947383401-87cfa7d3e568", "Samuel Lopez Cruz", "fotogugu"]],
  "baby-shower": [["1768776183122-95c7d3adbf3e", "Samuel Lopez Cruz", "fotogugu"], ["1788462811028-14d4e80bf6de", "gabbiistudios", "gabrielonodegba"], ["1622290319146-7b63df48a635", "Mediamodifier", "mediamodifier"], ["1788462810835-7a36a2402dc4", "gabbiistudios", "gabrielonodegba"]],
  "naming-ceremony": [["1773243086631-962baefccd8a", "Olivia Anne Snyder", "olivialu10"], ["1510154221590-ff63e90a136f", "Omar Lopez", "omarlopez1"], ["1470116945706-e6bf5d5a53ca", "Aditya Romansa", "adroman"], ["1773243086564-a444f7d8a61b", "Olivia Anne Snyder", "olivialu10"]],
  "housewarming": [["1637311252429-634d760e08b2", "Huy Phan", "huyphan2602"], ["1592150621744-aca64f48394a", "vadim kaipov", "vadimkaipov"], ["1604762524889-3e2fcc145683", "Annie Spratt", "anniespratt"], ["1521334884684-d80222895322", "Prudence Earl", "prudenceearl"]],
  "real-estate": [["1682184805271-11671b7ecf4c", "Lumbardh Plluzhina", "bardhplluzhina"], ["1628592102751-ba83b0314276", "Huy Nguyen", "huynguyen_pch"], ["1666282167632-c613fbeb163c", "Lotus Design N Print", "lotusdnp"], ["1738168246881-40f35f8aba0a", "Prydumano Design", "prydumanodesign"]],
  "travel-agent": [["1524492412937-b28074a5d7da", "Julian Yu", "littlej1428"], ["1477587458883-47145ed94245", "Aditya Siva", "msaditya9"], ["1548013146-72479768bada", "Sylwia Bartyzel", "sylwiabartyzel"], ["1496372412473-e8548ffd82bc", "Martin Jernberg", "martinjernberg"]],
  "chartered-accountant": [["1713461983836-de0a45009424", "Jakub Żerdzicki", "jakubzerdzicki"], ["1713946598391-ebf4255cdd64", "Vitaly Gariev", "silverkblack"], ["1664382951020-41874ae61a44", "Centre for Ageing Better", "ageing_better"], ["1511376868136-742c0de8c9a8", "charlesdeluvio", "charlesdeluvio"]],
  "lawyer": [["1758518731462-d091b0b4ed0d", "Vitaly Gariev", "silverkblack"]],
  "architect": [["1488972685288-c3fd157d7c7a", "Anders Jildén", "andersjilden"], ["1766445318570-1dc4bf3f5d79", "zai Dan", "danzai_ph"], ["1758801306823-61a81ee3ede5", "Declan Sun", "declansun"], ["1487958449943-2429e8be8625", "Lance Anderson", "lanceanderson"]],
  "clinic": [["1758691462878-6edc3d3da1be", "Vitaly Gariev", "silverkblack"], ["1758691461990-03b49d969495", "Vitaly Gariev", "silverkblack"], ["1612349317150-e413f6a5b16d", "Usman Yousaf", "usmanyousaf"], ["1673865641073-4479f93a7776", "Bermix Studio", "bermixstudio"]],
  "celebrate-graduation": [["1627556704290-2b1f5853ff78", "RUT MIIT", "rutmiit"], ["1590012314607-cda9d9b699ae", "Joshua Hoehne", "joshua_hoehne"], ["1761781342506-821be95168c5", "Ethan Gowans", "ethan_gowans"]],
  "celebrate-baby": [["1562494855-e008650bb2c6", "Heike Mintel", "erstbelichtung"], ["1551934262-db2d7dd517f4", "Ana Tablas", "tablas08"], ["1696468388498-7a86cbdf8740", "Richard Sagredo", "sagredophotography"]],
  "celebrate-calm": [["1561212856-44e9bae482aa", "David Tomaseti", "dtomaseti"], ["1528351655744-27cc30462816", "Paolo Nicolello", "paul_nic"], ["1476900164809-ff19b8ae5968", "Mike Labrum", "labrum777"]],
  "diwali": [["1757693350857-61d31a1b77bf", "Rohit Dey", "rohit16dey"], ["1761097332824-a80511520bca", "Ash Dhakne", "ashlifestylesol"], ["1577083753695-e010191bacb5", "Udayaditya Barua", "nookscribe"]],
  "holi": [["1603228254119-e6a4d095dc59", "John Thomas", "capturelight"], ["1551757891-24a8dabd2708", "Sandra Seitamaa", "seitamaaphotography"], ["1519802772250-a52a9af0eacb", "Debashis RC Biswas", "rcsalbum"]],
  "raksha-bandhan": [["1692902288473-08b02773fe6c", "Paras Kaushal", "artkitokri"]],
  "plumber": [["1676210134188-4c05dd172f89", "Timur Shakerzianov", "shaker_jpg"], ["1676210134190-3f2c0d5cf58d", "Timur Shakerzianov", "shaker_jpg"], ["1681249537103-9e0c7316d91e", "Erik Mclean", "introspectivedsgn"], ["1673870861507-d72aa6855d89", "Anton Savinov", "tonchik"]],
  "ac-repair": [["1709691928225-ce7874fbdcc6", "Fiqih Alfarish", "fiqihalfarish"], ["1705444509014-fed54b6191bf", "Illia Horokhovsky", "fili_ja"]],
  "car-detailing": [["1632823469850-2f77dd9c7f93", "Deniz Demirci", "ddography"], ["1485291571150-772bcfc10da5", "Samuele Errico Piccarini", "samuele_piccarini"], ["1694678505383-676d78ea3b96", "Nik", "helloimnik"], ["1520340356584-f9917d1eea6f", "Clément M.", "cmreflections"]],
  "bike-repair": [["1636761358757-0a616eb9e17e", "Angry._.Kat", "_ks_"], ["1623220988124-bcd1bad9a408", "Mufid Majnun", "mufidpwt"], ["1650569663338-f6921d483868", "Mick Haupt", "rocinante_11"], ["1517524206127-48bbd363f3d7", "Aaron Huber", "aahubs"]],
  "interior-designer": [["1724582586529-62622e50c0b3", "Prydumano Design", "prydumanodesign"], ["1616137422495-1e9e46e2aa77", "Spacejoy", "spacejoy"], ["1646987916641-1f3c8992daa2", "mahmoud azmy", "mahmoud_azmy"], ["1705326701287-346fc37a2c86", "Pipcke", "pipcke"]],
  "consultant": [["1517245386807-bb43f82c33c4", "Headway", "headwayio"], ["1517048676732-d65bc937f952", "Dylan Gillis", "mainermedia"], ["1551836022-d5d88e9218df", "Amy Hirschi", "amyhirschi"], ["1624555130581-1d9cca783bc0", "Memento Media", "heymemento"]],
  "street-food": [["1769019401093-38f564d6408a", "Zoshua Colah", "zoshuacolah"], ["1788618992931-a1289ef2da41", "Zoshua Colah", "zoshuacolah"]],
  "sweet-shop": [["1760263217153-ef719ca2da19", "Zoshua Colah", "zoshuacolah"], ["1760263217152-009971f0bccc", "Zoshua Colah", "zoshuacolah"], ["1782033032439-a2c656ca2f59", "Bonala Yellender", "yellender"]],
  "product-catalogue": [["1759745063507-8c29644a1c62", "T", "tanyabarrow"], ["1785632662776-9d19c604506f", "Far Chinberdiev", "fardevio"], ["1771865916785-4505e3ca8af4", "andrew davies", "arny231104"], ["1613911528704-5459d003e40a", "Liligance", "liligancephotography"]],
  "boutique-catalogue": [["1610189012906-4c0aa9b9781e", "Bulbul Ahmed", "bulbul252"], ["1787220272461-2c53528c9349", "Richard Williams", "richardjw"], ["1717585679395-bbe39b5fb6bc", "Jainica Dhingra", "jainica"]],
  "jewellery-catalogue": [["1626784213922-d9f1e050cf8f", "MAYANK GEHLOT", "mg_clickers"], ["1606293926249-ed22e446d476", "Sonika Agarwal", "sonika_agarwal"], ["1601121141461-9d6647bca1ed", "Vaibhav Nagare", "vaibhavnagare"]],
  "gift-catalogue": [["1508899203029-1c9eb493c9bd", "Freddie Collins", "visuals_by_fred"], ["1649789093457-3a973148fa27", "ALEXANDRA TORRO", "alexandratorro"]],
  "product-launch": [["1505373877841-8d25f7d46678", "Teemu Paananen", "xteemu"], ["1560523160-754a9e25c68f", "Product School", "productschool"], ["1754373695753-1069438691f8", "The Executive Group", "xecutivegroup"], ["1576085898323-218337e3e43c", "charlesdeluvio", "charlesdeluvio"]],
  "conference": [["1587825140708-dfaf72ae4b04", "Alexandre Pellaes", "apellaes"], ["1540575467063-178a50c2df87", "Headway", "headwayio"], ["1594122230689-45899d9e6f69", "Wan San Yip", "wansan_99"], ["1544531586-fde5298cdd40", "Miguel Henriques", "miguel_photo"]],
  "celebrate-friends": [["1511988617509-a57c8a288659", "Helena Lopes", "helenalopesph"], ["1758272133795-3a21773ebc5e", "Vitaly Gariev", "silverkblack"], ["1758272133803-1cbb513689ca", "Vitaly Gariev", "silverkblack"], ["1519671482749-fd09be7ccebf", "Kelsey Chance", "kchance8"]],
  "celebrate-couple": [["1615966650071-855b15f29ad1", "Vows on the Move", "vowsonthemove"], ["1513279922550-250c2129b13a", "Nathan Dumlao", "nate_dumlao"], ["1501901609772-df0848060b33", "Carly Rae Hobbins", "carlyrae"], ["1496602910407-bacda74a0fe4", "Khamkéo", "mahkeo"]],
  "celebrate-family": [["1730130596425-197566414dc4", "CR", "cr029"], ["1639979511572-ff346bc5b3b7", "Anil Sharma", "anil_sharma_india"], ["1780329943665-ac2d6784e956", "Rohit Dey", "rohit16dey"]],
  "celebrate-flowers": [["1531120364508-a6b656c3e78d", "Niklas Ohlrogge", "ohlrogge"], ["1619962992057-be492a5816f6", "Timo C. Dinger", "tcdinger"], ["1512056495345-913a0c261dc8", "Nick Karvounis", "nickkarvounis"], ["1469317835793-6d02c2392778", "Annie Spratt", "anniespratt"]],
  "freelancer-services": [["1758612215020-842383aadb9e", "Vitaly Gariev", "silverkblack"], ["1777861845890-19fcc843e33a", "Bayu Syaits", "bayusyaits"], ["1759668358660-0d06064f0f84", "The Design Lady", "sarah35"], ["1487338875411-8880f74114a2", "Tran Mau Tri Tam", "tranmautritam"]],
  "restaurant-menu": [["1772730064970-a7b2735c93b9", "Mohammad Fahim", "dischef"], ["1782541370275-6761522e39d1", "Super deluxe kitchen", "superdelux29"]],
  "cafe-menu": [["1635906109702-625260bd1ffd", "Falaq Lazuardi", "falaqkun"], ["1760175445000-0e01e193d1cd", "nameless 3791", "unidentifieduser"], ["1779442563698-11fad08a733e", "Margo Evardson", "stadinstudio"]],
  "bakery-menu": [["1711672284661-bd70e38f31b2", "Elisha Terada", "elishaterada"], ["1568254183919-78a4f43a2877", "Yeh Xintong", "blsnki"], ["1597528662465-55ece5734101", "tabitha turner", "tabithaturnervisuals"], ["1483695028939-5bb13f8648b0", "Mink Mingle", "minkmingle"]],
  "cloud-kitchen": [["1670816978291-a5cf23d87968", "You Le", "le_y0u"], ["1604259597308-5321e8e4789c", "Miu Sua", "phanhfank"], ["1520066391310-428f06ebd602", "Roosa Kulju", "kuljukuvaa"]],
  "tiffin-service": [["1742281257687-092746ad6021", "Zoshua Colah", "zoshuacolah"], ["1680993032090-1ef7ea9b51e5", "Zoshua Colah", "zoshuacolah"], ["1711153419402-336ee48f2138", "fuseviews", "fusewiews"]],
  "christmas": [["1481366574263-f643ed72bccc", "Joanna Kosinska", "joannakosinska"], ["1608132055071-aea9bf8e121e", "Nick Fewings", "jannerboy62"], ["1765154017431-24b6b0fc0d16", "Jim Luo", "jimluo"]],
  "new-year": [["1498931299472-f7a63a5a1cfa", "Ray Hennessy", "rayhennessy"], ["1560986752-2e31d9507413", "DESIGNECOLOGIST", "designecologist"], ["1514876246314-d9a231ea21db", "Jamie Fenn", "jamie_fenn"]],
  "eid": [["1574936293035-134adffbeb6f", "N. K.", "noybnk"], ["1556290401-b8d6ae553395", "Vitamin See", "vitaminsee"]],
  "india-flag": [["1786639949972-43e112840ee7", "Ayush Design", "ayushdesign"], ["1786742881179-3c76a3538bfa", "Shubham Dhage", "theshubhamdhage"]],
  "womens-day": [["1765307639918-a99f7f3d9f75", "Joshua Koblin", "joshkoblin"], ["1582213782179-e0d53f98f2ca", "Hannah Busing", "hannahbusing"], ["1522543558187-768b6df7c25c", "Vonecia Carswell", "voneciacarswell"]],
  "ganesh-chaturthi": [["1631556373338-52e31188effc", "Anand Shetye", "avshetye"], ["1725988415840-b69ae3328e96", "Jayanth Muppaneni", "jay_5"]],
  "navratri": [["1622278934504-56f6241d94c5", "Sonika Agarwal", "sonika_agarwal"], ["1626094306120-f8dc413aff8e", "Sonika Agarwal", "sonika_agarwal"]],
  "makar-sankranti": [["1705633982679-e0f4e68e5348", "John Cameron", "john_cameron"], ["1720749405798-9ec0d5e0c709", "Liz Morgan", "stills_byliz"]],
  "pongal-onam": [["1716714620140-9ed26b67e900", "Joydeep Sensarma", "jsensarma"]],
  "jain": [["1650105518992-e75632583519", "Paurav Shah", "pauravshah"], ["1650119499496-4db82506b6c5", "Paurav Shah", "pauravshah"]],
  "gurpurab": [["1599840309126-7ece88628ded", "Harsharan Singh", "harsharansingh20"], ["1609947017136-9daf32a5eb16", "Laurentiu Morariu", "travelphotographer"]],
  "service-rate-card": [["1562259929-b4e1fd3aef09", "Theme Photos", "themephotos"], ["1676311396794-f14881e9daaa", "Bermix Studio", "bermixstudio"]],
  "salon-rate-card": [["1633681926022-84c23e8cb2d6", "Benyamin Bohlouli", "benyamin_bohlouli"], ["1675034743339-0b0747047727", "Vinicius Amano", "viniciusamano"]],
  "women": [["1706943262459-3ef6ce03305c", "siddharth vyas", "siddharth_vyas1"], ["1646979201169-e83d743bfa8d", "Anil Sharma", "anil_sharma_india"], ["1463335361701-e90f4c5045d0", "Oriol Casas", "oricasas"], ["1646979201225-00e36437d09e", "Anil Sharma", "anil_sharma_india"], ["1604465829955-423e37d50e4b", "Anubhav Shekhar", "_bunny_"]],
  "men": [["1670110531916-41045e83cb0a", "DICSON", "smartdicson"], ["1649433658557-54cf58577c68", "Abhishek Rai", "realabhishekrai"], ["1778692258270-bc0e80e975c0", "Kamal Dharma Teja Dasari", "dharma632"], ["1782323709687-43675cbddd46", "Sairaj Gandhe", "sairajgandhe28"], ["1774437790865-76bfb73d7166", "Tanmay Abhay Mahajan", "mr_bond1999"]],
  "work": [["1621111848501-8d3634f82336", "Faizur Rehman", "fazurrehman"], ["1549833971-c4283bad0032", "James McDonald", "jamesm"]],
  "wedding": [["1722952908609-4b57e23da1ee", "ARTO SURAJ", "artosuraj"], ["1587271636175-90d58cdad458", "AMISH THAKKAR", "amishthakkar"], ["1621801306185-8c0ccf9c8eb8", "Love Arya", "lovearya"], ["1722952908667-f4883b8e6df6", "ARTO SURAJ", "artosuraj"]],
  "event-planner": [["1587271407850-8d438ca9fdf2", "AMISH THAKKAR", "amishthakkar"], ["1756190564669-215843660e93", "roshan pms", "roshanpms"]],
  "tutor": [["1589206946274-929e4da3996b", "Ronald Felton", "ronfel"], ["1664382953647-5c6c76dd63b9", "Centre for Ageing Better", "ageing_better"]],
  "coaching-center": [["1709290749293-c6152a187b14", "CIMT HOOGHLY", "cimthooghly"], ["1719159381916-062fa9f435a6", "Haseeb Modi", "haseebm"], ["1719159381962-4170890ada4e", "Haseeb Modi", "haseebm"]],
  "music-teacher": [["1510915361894-db8b60106cb1", "Jefferson Santos", "jefflssantos"], ["1556379118-7034d926d258", "Karim MANJRA", "karim_manjra"], ["1612225330812-01a9c6b355ec", "Lucia Macedo", "sample_in_photography"], ["1512053459797-38c3a066cabd", "Dolo Iglesias", "dolodol"]],
  "dance-teacher": [["1787724691140-94b3f9867e67", "Vitaly Gariev", "silverkblack"], ["1787724691064-22c08d59c049", "Vitaly Gariev", "silverkblack"], ["1787724691026-60cfd8b2e255", "Vitaly Gariev", "silverkblack"], ["1787724691088-76ed8e29dbc8", "Vitaly Gariev", "silverkblack"]],
  "photographer": [["1541516160071-4bb0c5af65ba", "Marco Xu", "marcute"], ["1542038784456-1ea8e935640e", "Reinhart Julian", "reinhartjulian"], ["1502920917128-1aa500764cbd", "Andrew Hutchings", "a_hutchings5894"], ["1495707902641-75cac588d2e9", "Hanson Lu", "hansonluu"]],
  // schools, stays and shops (October 2026)
  "school": [["1709290749293-c6152a187b14", "CIMT HOOGHLY", "cimthooghly"], ["1692269725836-fbd72e98883f", "Swastik Arora", "swastikarora"], ["1572847748080-bac263fae977", "Raj Rana", "theranaman"], ["1692269725911-87697c558be1", "Swastik Arora", "swastikarora"], ["1522661067900-ab829854a57f", "Nikhita S", "kryptonitenicky"]],
  "preschool": [["1587323655395-b1c77a12c89a", "Gabe Pierce", "gaberce"], ["1578349035260-9f3d4042f1f7", "BBC Creative", "bethbapchurch"], ["1567746455504-cb3213f8f5b8", "Gautam Arora", "gautamarora1991"], ["1484820540004-14229fe36ca4", "Markus Spiske", "markusspiske"], ["1605627079912-97c3810a11a4", "Compagnons", "sigmund"]],
  "hotel": [["1611892440504-42a792e24d32", "visualsofdana", "visualsofdana"], ["1618773928121-c32242e63f39", "Vojtech Bruzek", "vojtechbruzek"], ["1621293954908-907159247fc8", "Frames For Your Heart", "framesforyourheart"], ["1631049307264-da0ec9d70304", "Point3D Commercial Imaging Ltd.", "3dottawa"], ["1582719478250-c89cae4dc85b", "Sasha Kaunas", "akaunas"]],
  "hostel-pg": [["1555854877-bab0e564b8d5", "Marcus Loke", "marcusloke"], ["1768289269971-6171457bed13", "Aditya Karande", "photoisum"], ["1709805619372-40de3f158e83", "Zoshua Colah", "zoshuacolah"], ["1520277739336-7bf67edfa768", "Nicate Lee", "nicn10"]],
  "resort": [["1695124565997-6f6552b1edb2", "Zoshua Colah", "zoshuacolah"], ["1724947053227-2335bf21d0ae", "Ish Consul", "ishconsul"], ["1618670632454-36ffd5a4d735", "Akkash Shah", "im_sky"], ["1592295512743-4825f2b7dbc3", "ar.sanjana marrapu", "ar_sanjana7"], ["1551882547-ff40c63fe5fa", "Valeriia Bugaiova", "bugaiova_valeriya"]],
  "kirana": [["1723158694712-d528f378577a", "Colin White", "ctw71"], ["1757802261994-3c31584daafd", "Zoshua Colah", "zoshuacolah"], ["1604719312566-8912e9227c6a", "Franki Chamaki", "franki"], ["1542838132-92c53300491e", "nrd", "nicotitto"], ["1772460759097-ad68b3232a4f", "Aditya Sethia", "aditya_sethia_97"]],
  "pharmacy": [["1580281657527-47f249e8f4df", "National Cancer Institute", "nci"], ["1696861286643-341a8d7a79e9", "David Trinks", "dtrinksrph"], ["1630620201138-3ede5ee10f48", "Felix Eka Putra Kuntjoro", "fekapk"], ["1586015555751-63bb77f4322a", "freestocks", "freestocks"], ["1696861308115-54a5e5a134b0", "David Trinks", "dtrinksrph"]],
  "mobile-shop": [["1697545806245-9795b6056141", "NSYS Group", "nsys_group"], ["1761494296583-99b15e9063c5", "Bhanu Singh", "insane_scene"], ["1590599145008-e4ec48682067", "Simon Bak", "simon_bak"], ["1697545806136-92d30cb7081e", "NSYS Group", "nsys_group"], ["1785741612674-965f99d5c38f", "Declan Sun", "declansun"]],
  "hardware-store": [["1765744893064-dce3184289ef", "Artem Korolev", "artemisss666"], ["1759200165738-6366977a73c6", "Darien Attridge", "dariendesigns"], ["1602052793312-b99c2a9ee797", "Mitchell Luo", "mitchel3uo"], ["1783309239591-9b63f3599744", "Thilina Alagiyawanna", "thilinaalagiyawanna"], ["1631856954913-c751a44490ec", "Oxana Melis", "oksdesign"]],
  "general-store": [["1758348607292-60f450b10c40", "mdreza jalali", "mdrezajalali"], ["1519520104014-df63821cb6f9", "Jelleke Vanooteghem", "ilumire"], ["1766716946038-7da5ad2b5f27", "Ramneek Singh", "singhramneek54"], ["1775433205046-86e060feff06", "Caitlin James", "caitlin_j"]],
  "stationery-shop": [["1576602976047-174e57a47881", "Nathaniel Yeo", "nathanielyeo"], ["1568871391149-449702439177", "LumenSoft Technologies", "candelarms"], ["1557154683-264bf969e849", "Camille San Vicente", "camillesanvicente"], ["1568301856220-8d0dc08a6d48", "Simple stripes", "simplestripes320"], ["1453749024858-4bca89bd9edc", "Aaron Burden", "aaronburden"]],
  "optical-shop": [["1788347101988-bf40abcbb2c7", "Sabhyata Sahu", "sabbythefreeelf"], ["1545038500-1df28978d761", "Hobi industri", "hobiindustri"], ["1759910546772-73e4bb7fdadd", "mdreza jalali", "mdrezajalali"], ["1775825094939-3759ede3dec2", "atelierbyvineeth", "atelierbyvineeth"], ["1762718900539-c51799fd71b3", "Danny Greenberg", "by_danny_g"]],
  "pet-shop": [["1591946614720-90a587da4a36", "FLOUFFY", "theflouffy"], ["1592194996308-7b43878e84a6", "Alvan Nee", "alvannee"], ["1625316708582-7c38734be31d", "Alvan Nee", "alvannee"], ["1534361960057-19889db9621e", "Joe Caione", "joeyc"], ["1568640347023-a616a30bc3bd", "okeykat", "okeykat"]],
  "agri-store": [["1620901433789-1d2f85a93653", "Saikiran Kesari", "saikirankesari"], ["1574943320219-553eb213f72d", "Rajesh Ram", "rajesh_ram"], ["1530507629858-e4977d30e9e0", "Nandhu Kumar", "nandhukumarndd"], ["1668885309844-5bb50f7c2e61", "Shabeeba Ameen", "shabiba_amin"], ["1604042325351-f649d76813b1", "Nikhil Dafare", "designingsucks"]],
  "wholesaler": [["1553413077-190dd305871c", "Ruchindra Gunasekara", "ruchindra"], ["1587293852726-70cdb56c2866", "CHUTTERSNAP", "chuttersnap"], ["1774946103680-3d34a461a581", "UZ Creative Services", "p8lm_k5vq2rx"], ["1586528116311-ad8dd3c8310d", "Adrian Sulyok", "sulyok_imaging"], ["1627309366653-2dedc084cdf1", "Jacques Dillies", "jacques_dillies"]],
} satisfies Record<string, readonly Shot[]>;

export type StockSet = keyof typeof STOCK_SETS;

/** Which set each product's sample uses. Products not listed use the set with their own id. */
const STOCK_FOR: Record<string, StockSet[]> = {
  boutique: ["boutique-catalogue", "makeup-artist"],
  lawyer: ["lawyer", "chartered-accountant", "consultant"],
  "ac-repair": ["ac-repair", "electrician"],
  "yoga-studio": ["yoga-studio", "spa"],
  tutor: ["tutor", "coaching-center"],
  "event-planner": ["event-planner", "wedding"],
  "puja-invite": ["diwali", "ganesh-chaturthi"],
  dhanteras: ["diwali"], govardhan: ["diwali"], "bhai-dooj": ["diwali"], "veer-nirvan": ["diwali"],
  meetup: ["meetup", "workshop", "celebrate-friends"],
  "jewellery-catalogue": ["jewellery-catalogue", "jeweller"],
  "gift-catalogue": ["gift-catalogue", "celebrate-flowers"],
  "street-food": ["street-food", "restaurant-menu"],
  // greetings
  "birthday-surprise": ["celebrate-friends"], friendship: ["celebrate-friends"], congratulations: ["celebrate-friends"], farewell: ["celebrate-friends", "workshop"],
  anniversary: ["celebrate-couple"], valentine: ["celebrate-couple"], proposal: ["celebrate-couple", "engagement"], sorry: ["celebrate-flowers"],
  "thank-you": ["celebrate-flowers"], "get-well-soon": ["celebrate-flowers"], tribute: ["celebrate-calm"],
  retirement: ["celebrate-family"], "mothers-day": ["celebrate-family"], "fathers-day": ["celebrate-family"],
  graduation: ["celebrate-graduation"], "teachers-day": ["tutor", "coaching-center"], "baby-announcement": ["celebrate-baby", "naming-ceremony"],
  // festivals
  "independence-day": ["india-flag"], "republic-day": ["india-flag"], "mahavir-jayanti": ["jain"], kshamavani: ["jain", "celebrate-calm"],
  "pongal-onam": ["pongal-onam", "makar-sankranti"],
};

/** Portrait for each profile's sample person, plus pictures for their work. */
export const PROFILE_STOCK: Record<string, { photo: string; work?: string[] }> = {
  "digital-visiting-card": { photo: "women-3" },
  resume: { photo: "men-3" },
  portfolio: { photo: "women-2", work: ["work-0", "freelancer-services-2", "product-catalogue-0"] },
  "freelancer-profile": { photo: "men-4", work: ["freelancer-services-3", "work-1"] },
  "student-profile": { photo: "women-0", work: ["college-fest-2", "workshop-0"] },
  "creator-bio-link": { photo: "men-1" },
  "photographer-portfolio": { photo: "men-0", work: ["wedding-0", "celebrate-family-0", "wedding-2", "celebrate-couple-0"] },
  "designer-portfolio": { photo: "women-1", work: ["work-1", "work-0"] },
  "consultant-profile": { photo: "men-2" },
  "speaker-profile": { photo: "women-4", work: ["conference-3", "workshop-2"] },
};

const UNSPLASH = "https://images.unsplash.com/photo-";

/** A sized Unsplash URL. `w` is the CSS width it will be shown at; the CDN picks WebP/AVIF. */
export const stockUrl = (id: string, w = 800, h?: number) =>
  `${UNSPLASH}${id}?auto=format&fit=crop&q=68&w=${w}${h ? `&h=${h}` : ""}`;

/** "women-3" style key → its photo id. */
export function shot(key: string): Shot | null {
  const i = key.lastIndexOf("-");
  const set = (STOCK_SETS as Record<string, readonly Shot[]>)[key.slice(0, i)];
  return set?.[Number(key.slice(i + 1))] ?? null;
}

/** All stock photos for a product: the first is its cover. */
export function stockFor(productId: string): readonly Shot[] {
  const sets = STOCK_FOR[productId] ?? [productId as StockSet];
  const all = sets.flatMap((s) => (STOCK_SETS as Record<string, readonly Shot[]>)[s] ?? []);
  return all.filter((x, i) => all.findIndex((y) => y[0] === x[0]) === i);
}

/** Sample-content image values: plain URLs, so the builder shows them and owners can swap them. */
export const stockPhoto = (s: Shot | null, w = 1200) => (s ? stockUrl(s[0], w) : "");
export const coverFor = (productId: string) => stockPhoto(stockFor(productId)[0] ?? null, 1600);
export const galleryFor = (productId: string, n = 4, skip = 1) =>
  stockFor(productId).slice(skip, skip + n).map((s) => ({ photo: stockPhoto(s), caption: "" }));

export const isStock = (src: unknown) => typeof src === "string" && src.startsWith(UNSPLASH);

/** Responsive srcset for a stock URL; other images get none. */
export function stockSrcSet(src: string): string | undefined {
  if (!isStock(src)) return undefined;
  const base = src.replace(/([?&])w=\d+/, "$1w=__W__").replace(/&h=\d+/, "");
  return [480, 800, 1200, 1600].map((w) => `${base.replace("__W__", String(w))} ${w}w`).join(", ");
}
