#!/usr/bin/env node
/**
 * Stage 5: build src/data/saints.json + meta.json from cached raw data.
 * Usage: node scripts/build-saints.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, ".cache");
const OUT = join(HERE, "..", "src", "data");
mkdirSync(OUT, { recursive: true });

const load = (n) => JSON.parse(readFileSync(join(CACHE, n), "utf8"));
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const slug = (s) =>
  norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ------------------------------------------------------------- orders ----
/** Canonical religious orders/families, matched in this order (specific first). */
const ORDERS = [
  { id: "franciscan", en: "Franciscans", es: "Franciscanos", kw: ["friars minor", "order of friars minor", "franciscan", "franciscano", "franciscana"] },
  { id: "capuchin", en: "Capuchins", es: "Capuchinos", kw: ["capuchin", "capuchino", "capuchina"] },
  { id: "poor-clares", en: "Poor Clares", es: "Clarisas", kw: ["poor clare", "order of saint clare", "clarisa"] },
  { id: "dominican", en: "Dominicans", es: "Dominicos", kw: ["order of preachers", "dominican", "dominico", "dominica", "predicadores"] },
  { id: "jesuit", en: "Jesuits", es: "Jesuitas", kw: ["society of jesus", "jesuit", "jesuita", "compañía de jesús", "compania de jesus"] },
  { id: "benedictine", en: "Benedictines", es: "Benedictinos", kw: ["order of saint benedict", "benedictine", "benedictino", "benedictina"] },
  { id: "cistercian", en: "Cistercians", es: "Cistercienses", kw: ["cistercian", "cisterciense"] },
  { id: "trappist", en: "Trappists", es: "Trapenses", kw: ["trappist", "trapense"] },
  { id: "carmelite", en: "Carmelites", es: "Carmelitas", kw: ["discalced carmelite", "carmelite", "carmelita", "descalzo", "descalza"] },
  { id: "augustinian", en: "Augustinians", es: "Agustinos", kw: ["order of saint augustine", "augustinian", "agustino", "agustina"] },
  { id: "mercedarian", en: "Mercedarians", es: "Mercedarios", kw: ["mercedarian", "order of mercy", "mercedario", "mercedaria", "merced"] },
  { id: "trinitarian", en: "Trinitarians", es: "Trinitarios", kw: ["trinitarian", "order of the holy trinity", "trinitario", "trinitaria"] },
  { id: "servite", en: "Servites", es: "Servitas", kw: ["servite", "servants of mary", "servita"] },
  { id: "carthusian", en: "Carthusians", es: "Cartujos", kw: ["carthusian", "cartujo", "cartuja"] },
  { id: "camaldolese", en: "Camaldolese", es: "Camaldulenses", kw: ["camaldolese", "camaldulense"] },
  { id: "vallumbrosan", en: "Vallumbrosans", es: "Valumbrosanos", kw: ["vallumbrosan"] },
  { id: "olivetan", en: "Olivetans", es: "Olivetanos", kw: ["olivetan", "olivetano"] },
  { id: "premonstratensian", en: "Premonstratensians", es: "Premonstratenses", kw: ["premonstratensian", "norbertine", "premonstratense"] },
  { id: "hospitaller", en: "Hospitallers", es: "Hospitalarios", kw: ["knights hospitaller", "order of saint john", "hospitaller", "hospitalario"] },
  { id: "theatine", en: "Theatines", es: "Teatinos", kw: ["theatine", "teatino", "teatina"] },
  { id: "barnabite", en: "Barnabites", es: "Barnabitas", kw: ["barnabite", "clerks regular of saint paul", "barnabita"] },
  { id: "somascan", en: "Somaschi", es: "Somascos", kw: ["somascan", "somaschi", "somasco"] },
  { id: "oratorian", en: "Oratorians", es: "Oratorianos", kw: ["congregation of the oratory", "oratorian", "oratoriano"] },
  { id: "piarist", en: "Piarists", es: "Escolapios", kw: ["piarist", "scolopi", "escolapio", "escolapia", "poor clerics"] },
  { id: "camillian", en: "Camillians", es: "Camilos", kw: ["camillian", "ministers of the sick", "camilo"] },
  { id: "salesian", en: "Salesians", es: "Salesianos", kw: ["salesian", "salesiano", "salesiana"] },
  { id: "redemptorist", en: "Redemptorists", es: "Redentoristas", kw: ["redemptorist", "redentorista"] },
  { id: "passionist", en: "Passionists", es: "Pasionistas", kw: ["passionist", "pasionista"] },
  { id: "vincentian", en: "Vincentians", es: "Vicentinos", kw: ["vincentian", "congregation of the mission", "daughters of charity", "lazarist", "vicentino", "vicentina", "paules"] },
  { id: "missionaries-charity", en: "Missionaries of Charity", es: "Misioneras de la Caridad", kw: ["missionaries of charity", "missionary of charity", "misioneras de la caridad"] },
  { id: "claretian", en: "Claretians", es: "Claretianos", kw: ["claretian", "sons of the immaculate heart", "claretiano"] },
  { id: "marist", en: "Marists", es: "Maristas", kw: ["marist brother", "marist", "marista"] },
  { id: "marianist", en: "Marianists", es: "Marianistas", kw: ["marianist", "marianista"] },
  { id: "lasallian", en: "De La Salle Brothers", es: "Hermanos de La Salle", kw: ["de la salle", "lasallian", "christian brothers", "la salle"] },
  { id: "oblates", en: "Oblates of Mary Immaculate", es: "Oblatos de María Inmaculada", kw: ["oblates of mary immaculate", "oblato"] },
  { id: "divine-word", en: "Society of the Divine Word", es: "Misioneros del Verbo Divino", kw: ["society of the divine word", "divine word", "verbo divino"] },
  { id: "comboni", en: "Comboni Missionaries", es: "Combonianos", kw: ["comboni", "comboniano"] },
  { id: "spiritan", en: "Spiritans", es: "Espiritanos", kw: ["spiritan", "congregation of the holy spirit", "espiritano"] },
  { id: "white-fathers", en: "Missionaries of Africa", es: "Misioneros de África", kw: ["white father", "missionaries of africa", "padres blancos"] },
  { id: "pallottine", en: "Pallottines", es: "Palotinos", kw: ["pallottine", "palotino", "palotina"] },
  { id: "ursulines", en: "Ursulines", es: "Ursulinas", kw: ["ursuline", "ursulina"] },
  { id: "visitation", en: "Order of the Visitation", es: "Visitandinas", kw: ["order of the visitation", "visitandine"] },
  { id: "bridgettine", en: "Bridgettines", es: "Brígidas", kw: ["bridgettine", "brigidine", "order of the holy saviour", "brígida"] },
  { id: "sisters-mercy", en: "Sisters of Mercy", es: "Hermanas de la Misericordia", kw: ["sisters of mercy", "sister of mercy"] },
  { id: "sisters-charity", en: "Sisters of Charity", es: "Hermanas de la Caridad", kw: ["sisters of charity"] },
  { id: "little-sisters-poor", en: "Little Sisters of the Poor", es: "Hermanitas de los Pobres", kw: ["little sisters of the poor"] },
];

function findOrder(text) {
  const t = ` ${norm(text)} `;
  for (const o of ORDERS) {
    for (const k of o.kw) {
      const kn = norm(k);
      if (t.includes(` ${kn} `) || t.includes(` ${kn},`) || t.includes(` ${kn}.`) || t.includes(` ${kn}(`)) return o.id;
    }
  }
  return null;
}

// ------------------------------------------------------------ demonyms ---
const DEMONYMS = {
  italian: ["IT", "Italy", "Italia"], spanish: ["ES", "Spain", "España"], french: ["FR", "France", "Francia"],
  german: ["DE", "Germany", "Alemania"], portuguese: ["PT", "Portugal", "Portugal"], english: ["GB", "England", "Inglaterra"],
  british: ["GB", "United Kingdom", "Reino Unido"], irish: ["IE", "Ireland", "Irlanda"], polish: ["PL", "Poland", "Polonia"],
  dutch: ["NL", "Netherlands", "Países Bajos"], belgian: ["BE", "Belgium", "Bélgica"], austrian: ["AT", "Austria", "Austria"],
  swiss: ["CH", "Switzerland", "Suiza"], mexican: ["MX", "Mexico", "México"], brazilian: ["BR", "Brazil", "Brasil"],
  argentine: ["AR", "Argentina", "Argentina"], argentinian: ["AR", "Argentina", "Argentina"], colombian: ["CO", "Colombia", "Colombia"],
  peruvian: ["PE", "Peru", "Perú"], chilean: ["CL", "Chile", "Chile"], venezuelan: ["VE", "Venezuela", "Venezuela"],
  ecuadorian: ["EC", "Ecuador", "Ecuador"], ecuadoran: ["EC", "Ecuador", "Ecuador"], bolivian: ["BO", "Bolivia", "Bolivia"],
  paraguayan: ["PY", "Paraguay", "Paraguay"], uruguayan: ["UY", "Uruguay", "Uruguay"], cuban: ["CU", "Cuba", "Cuba"],
  haitian: ["HT", "Haiti", "Haití"], american: ["US", "United States", "Estados Unidos"], canadian: ["CA", "Canada", "Canadá"],
  indian: ["IN", "India", "India"], filipino: ["PH", "Philippines", "Filipinas"], korean: ["KR", "Korea", "Corea"],
  japanese: ["JP", "Japan", "Japón"], chinese: ["CN", "China", "China"], vietnamese: ["VN", "Vietnam", "Vietnam"],
  lebanese: ["LB", "Lebanon", "Líbano"], syrian: ["SY", "Syria", "Siria"], egyptian: ["EG", "Egypt", "Egipto"],
  ethiopian: ["ET", "Ethiopia", "Etiopía"], nigerian: ["NG", "Nigeria", "Nigeria"], ugandan: ["UG", "Uganda", "Uganda"],
  kenyan: ["KE", "Kenya", "Kenia"], congolese: ["CD", "DR Congo", "R.D. del Congo"], rwandan: ["RW", "Rwanda", "Ruanda"],
  tanzanian: ["TZ", "Tanzania", "Tanzania"], sudanese: ["SD", "Sudan", "Sudán"], eritrean: ["ER", "Eritrea", "Eritrea"],
  croatian: ["HR", "Croatia", "Croacia"], slovenian: ["SI", "Slovenia", "Eslovenia"], slovak: ["SK", "Slovakia", "Eslovaquia"],
  czech: ["CZ", "Czechia", "Chequia"], hungarian: ["HU", "Hungary", "Hungría"], romanian: ["RO", "Romania", "Rumanía"],
  bulgarian: ["BG", "Bulgaria", "Bulgaria"], serbian: ["RS", "Serbia", "Serbia"], bosnian: ["BA", "Bosnia", "Bosnia"],
  albanian: ["AL", "Albania", "Albania"], greek: ["GR", "Greece", "Grecia"], turkish: ["TR", "Turkey", "Turquía"],
  armenian: ["AM", "Armenia", "Armenia"], georgian: ["GE", "Georgia", "Georgia"], russian: ["RU", "Russia", "Rusia"],
  ukrainian: ["UA", "Ukraine", "Ucrania"], belarusian: ["BY", "Belarus", "Bielorrusia"], lithuanian: ["LT", "Lithuania", "Lituania"],
  latvian: ["LV", "Latvia", "Letonia"], estonian: ["EE", "Estonia", "Estonia"], finnish: ["FI", "Finland", "Finlandia"],
  swedish: ["SE", "Sweden", "Suecia"], norwegian: ["NO", "Norway", "Noruega"], danish: ["DK", "Denmark", "Dinamarca"],
  icelandic: ["IS", "Iceland", "Islandia"], scottish: ["GB", "Scotland", "Escocia"], welsh: ["GB", "Wales", "Gales"],
  maltese: ["MT", "Malta", "Malta"], cypriot: ["CY", "Cyprus", "Chipre"], israeli: ["IL", "Israel", "Israel"],
  palestinian: ["PS", "Palestine", "Palestina"], iraqi: ["IQ", "Iraq", "Irak"], iranian: ["IR", "Iran", "Irán"],
  pakistani: ["PK", "Pakistan", "Pakistán"], bangladeshi: ["BD", "Bangladesh", "Bangladés"], "sri lankan": ["LK", "Sri Lanka", "Sri Lanka"],
  nepali: ["NP", "Nepal", "Nepal"], thai: ["TH", "Thailand", "Tailandia"], burmese: ["MM", "Myanmar", "Myanmar"],
  indonesian: ["ID", "Indonesia", "Indonesia"], malaysian: ["MY", "Malaysia", "Malasia"], australian: ["AU", "Australia", "Australia"],
  "new zealand": ["NZ", "New Zealand", "Nueva Zelanda"], guatemalan: ["GT", "Guatemala", "Guatemala"], honduran: ["HN", "Honduras", "Honduras"],
  salvadoran: ["SV", "El Salvador", "El Salvador"], nicaraguan: ["NI", "Nicaragua", "Nicaragua"], "costa rican": ["CR", "Costa Rica", "Costa Rica"],
  panamanian: ["PA", "Panama", "Panamá"], "south african": ["ZA", "South Africa", "Sudáfrica"], ghanaian: ["GH", "Ghana", "Ghana"],
  cameroonian: ["CM", "Cameroon", "Camerún"], senegalese: ["SN", "Senegal", "Senegal"], malawian: ["MW", "Malawi", "Malaui"],
  zambian: ["ZM", "Zambia", "Zambia"], zimbabwean: ["ZW", "Zimbabwe", "Zimbabue"], mozambican: ["MZ", "Mozambique", "Mozambique"],
  angolan: ["AO", "Angola", "Angola"], "sierra leonean": ["SL", "Sierra Leone", "Sierra Leona"], liberian: ["LR", "Liberia", "Liberia"],
  guinean: ["GN", "Guinea", "Guinea"], malian: ["ML", "Mali", "Mali"], burkinabe: ["BF", "Burkina Faso", "Burkina Faso"],
  nigerien: ["NE", "Niger", "Níger"], chadian: ["TD", "Chad", "Chad"], "central african": ["CF", "Central African Republic", "Rep. Centroafricana"],
  gabonese: ["GA", "Gabon", "Gabón"], togolese: ["TG", "Togo", "Togo"], beninese: ["BJ", "Benin", "Benín"],
  "ivorian": ["CI", "Ivory Coast", "Costa de Marfil"], mauritian: ["MU", "Mauritius", "Mauricio"], seychellois: ["SC", "Seychelles", "Seychelles"],
  madagascan: ["MG", "Madagascar", "Madagascar"], malagasy: ["MG", "Madagascar", "Madagascar"], mauritanian: ["MR", "Mauritania", "Mauritania"],
  somali: ["SO", "Somalia", "Somalia"], djiboutian: ["DJ", "Djibouti", "Yibuti"], comoran: ["KM", "Comoros", "Comoras"],
  "cape verdean": ["CV", "Cape Verde", "Cabo Verde"], "são toméan": ["ST", "São Tomé and Príncipe", "Santo Tomé y Príncipe"],
  "equatorial guinean": ["GQ", "Equatorial Guinea", "Guinea Ecuatorial"], "sahrawi": ["EH", "Western Sahara", "Sáhara Occidental"],
  namibian: ["NA", "Namibia", "Namibia"], botswanan: ["BW", "Botswana", "Botsuana"], lesotho: ["LS", "Lesotho", "Lesoto"],
  eswatini: ["SZ", "Eswatini", "Esuatini"], jordanian: ["JO", "Jordan", "Jordania"],
  "romano-british": ["GB", "United Kingdom", "Reino Unido"], "gallo-roman": ["FR", "France", "Francia"],
  persian: ["IR", "Iran", "Irán"], numidian: ["DZ", "Algeria", "Argelia"], roman: ["IT", "Italy", "Italia"],
  carthaginian: ["TN", "Tunisia", "Túnez"], moorish: ["MA", "Morocco", "Marruecos"],
  frankish: ["FR", "France", "Francia"], visigothic: ["ES", "Spain", "España"],
};

/** Famous cities/regions → country, for "martyr of Córdoba" / "bishop of Milan" patterns. */
const PLACES = {
  "córdoba": "ES", "cordoba": "ES", "sevilla": "ES", "seville": "ES", "toledo": "ES", "zaragoza": "ES",
  "barcelona": "ES", "valencia": "ES", "burgos": "ES", "ávila": "ES", "avila": "ES", "salamanca": "ES",
  "santiago de compostela": "ES", "compostela": "ES", "oviedo": "ES", "león": "ES", "leon": "ES",
  "pamplona": "ES", "bilbao": "ES", "granada": "ES", "mérida": "ES", "merida": "ES", "tarragona": "ES",
  "roma": "IT", "rome": "IT", "milán": "IT", "milan": "IT", "nápoles": "IT", "naples": "IT",
  "florencia": "IT", "florence": "IT", "venecia": "IT", "venice": "IT", "génova": "IT", "genoa": "IT",
  "padua": "IT", "padova": "IT", "asís": "IT", "assisi": "IT", "siena": "IT", "bolonia": "IT", "bologna": "IT",
  "turín": "IT", "turin": "IT", "palermo": "IT", "catania": "IT", "bari": "IT", "verona": "IT",
  "pisa": "IT", "lucca": "IT", "parma": "IT", "perugia": "IT", "orvieto": "IT", "loreto": "IT",
  "san giovanni rotondo": "IT", "pietrelcina": "IT", "cascia": "IT", "norcia": "IT", "subiaco": "IT",
  "montecassino": "IT", "cluny": "FR", "cîteaux": "FR", "citeaux": "FR", "claraval": "FR", "clairvaux": "FR",
  "parís": "FR", "paris": "FR", "lyon": "FR", "tours": "FR", "poitiers": "FR", "reims": "FR",
  "chartres": "FR", "orleans": "FR", "orléans": "FR", "marseille": "FR", "marsella": "FR",
  "normandía": "FR", "normandy": "FR", "bretaña": "FR", "brittany": "FR", "borgoña": "FR", "burgundy": "FR",
  "aquitania": "FR", "aquitaine": "FR", "provenza": "FR", "provence": "FR", "languedoc": "FR",
  "lisboa": "PT", "lisbon": "PT", "braga": "PT", "coimbra": "PT", "oporto": "PT", "porto": "PT",
  "fátima": "PT", "fatima": "PT", "colonia": "DE", "cologne": "DE", "mainz": "DE", "maguncia": "DE",
  "tréveris": "DE", "trier": "DE", "bamberg": "DE", "ratisbona": "DE", "regensburg": "DE",
  "augsburgo": "DE", "augsburg": "DE", "múnich": "DE", "munich": "DE", "bremen": "DE",
  "praga": "CZ", "prague": "CZ", "cracovia": "PL", "krakow": "PL", "kraków": "PL", "varsovia": "PL", "warsaw": "PL",
  "budapest": "HU", "viena": "AT", "vienna": "AT", "salzburgo": "AT", "salzburg": "AT",
  "dublín": "IE", "dublin": "IE", "armagh": "IE", "kildare": "IE", "clonmacnoise": "IE",
  "canterbury": "GB", "cantórbery": "GB", "york": "GB", "durham": "GB", "winchester": "GB",
  "lindisfarne": "GB", "iona": "GB", "whitby": "GB", "glastonbury": "GB", "inglaterra": "GB", "england": "GB",
  "escocia": "GB", "scotland": "GB", "gales": "GB",
  "alejandría": "EG", "alexandria": "EG", "el cairo": "EG", "cairo": "EG", "antínoe": "EG", "antinoe": "EG",
  "tarnut": "EG", "tarnūt": "EG", "nitria": "EG", "scetis": "EG", "tebas": "EG", "thebes": "EG",
  "cartago": "TN", "carthage": "TN", "hipona": "DZ", "hippo": "DZ", "argelia": "DZ", "algeria": "DZ",
  "constantinopla": "TR", "constantinople": "TR", "antioquía": "TR", "antioch": "TR", "nicea": "TR", "nicaea": "TR",
  "capadocia": "TR", "cappadocia": "TR", "tarso": "TR", "tarsus": "TR", "efeso": "TR", "ephesus": "TR",
  "esmirna": "TR", "smyrna": "TR", "jerusalén": "IL", "jerusalem": "IL", "belén": "PS", "bethlehem": "PS",
  "nazaret": "IL", "nazareth": "IL", "jaffa": "IL", "damasco": "SY", "damascus": "SY", "emesa": "SY",
  "homs": "SY", "edesa": "TR", "edessa": "TR", "nisibis": "TR", "mardin": "TR",
  "nagasaki": "JP", "japón": "JP", "kioto": "JP", "kyoto": "JP", "tokio": "JP", "tokyo": "JP",
  "goa": "IN", "india": "IN", "madras": "IN", "chennai": "IN", "mylapore": "IN", "kerala": "IN",
  "manila": "PH", "filipinas": "PH", "saigón": "VN", "saigon": "VN", "ho chi minh": "VN",
  "hanói": "VN", "hanoi": "VN", "tonkín": "VN", "tonkin": "VN", "hue": "VN",
  "seúl": "KR", "seoul": "KR", "corea": "KR", "pekín": "CN", "beijing": "CN", "china": "CN",
  "shanghái": "CN", "shanghai": "CN", "macao": "MO", "macau": "MO",
  "lima": "PE", "perú": "PE", "cuzco": "PE", "cusco": "PE", "arequipa": "PE",
  "ciudad de méxico": "MX", "mexico city": "MX", "méxico": "MX", "puebla": "MX", "oaxaca": "MX",
  "guadalupe": "MX", "bogotá": "CO", "bogota": "CO", "cartagena": "CO", "quito": "EC",
  "buenos aires": "AR", "argentina": "AR", "santiago": "CL", "chile": "CL", "asunción": "PY", "asuncion": "PY",
  "la paz": "BO", "bolivia": "BO", "caracas": "VE", "venezuela": "VE", "la habana": "CU", "havana": "CU",
  "santo domingo": "DO", "san juan": "PR", "puerto rico": "PR", "montreal": "CA", "quebec": "CA",
  "nueva york": "US", "new york": "US", "baltimore": "US", "filadelfia": "US", "philadelphia": "US",
  "nueva orleans": "US", "new orleans": "US", "santa fe": "US", "los ángeles": "US", "los angeles": "US",
  "bélgica": "BE", "belgium": "BE", "brujas": "BE", "bruges": "BE", "gante": "BE", "ghent": "BE",
  "lovaina": "BE", "leuven": "BE", "lieja": "BE", "liege": "BE", "amberes": "BE", "antwerp": "BE",
  "países bajos": "NL", "netherlands": "NL", "utraque": "NL", "utrecht": "NL", "maastricht": "NL",
  "luxemburgo": "LU", "suiza": "CH", "switzerland": "CH", "ginebra": "CH", "geneva": "CH",
  "disentis": "CH", "suecia": "SE", "sweden": "SE", "upsala": "SE", "uppsala": "SE", "vadstena": "SE",
  "noruega": "NO", "norway": "NO", "nidros": "NO", "nidaros": "NO", "dinamarca": "DK", "denmark": "DK",
  "roskilde": "DK", "finlandia": "FI", "finland": "FI", "polonia": "PL", "poland": "PL",
  "hungría": "HU", "hungary": "HU", "esztergom": "HU", "rumanía": "RO", "romania": "RO",
  "grecia": "GR", "greece": "GR", "atenas": "GR", "athens": "GR", "tesalónica": "GR", "thessalonica": "GR",
  "chipre": "CY", "cyprus": "CY", "malta": "MT", "croacia": "HR", "croatia": "HR", "serbia": "RS",
  "bulgaria": "BG", "albania": "AL", "ucrania": "UA", "ukraine": "UA", "kiev": "UA", "kyiv": "UA",
  "rusia": "RU", "russia": "RU", "moscú": "RU", "moscow": "RU", "novgorod": "RU",
  "lituania": "LT", "lithuania": "LT", "vilna": "LT", "vilnius": "LT",
  "etiopía": "ET", "ethiopia": "ET", "aksum": "ET", "axum": "ET",
  "uganda": "UG", "namugongo": "UG", "nigeria": "NG", "kenia": "KE", "kenya": "KE",
  "tanzania": "TZ", "ruanda": "RW", "rwanda": "RW", "congo": "CD", "sudán": "SD", "sudan": "SD",
  "brasil": "BR", "brazil": "BR", "bahía": "BR", "bahia": "BR", "são paulo": "BR", "sao paulo": "BR",
  "australia": "AU", "sídney": "AU", "sydney": "AU",
};
const PLACE_COUNTRY_NAMES = {
  ES: ["Spain", "España"], IT: ["Italy", "Italia"], FR: ["France", "Francia"],
  PT: ["Portugal", "Portugal"], DE: ["Germany", "Alemania"], CZ: ["Czechia", "Chequia"],
  PL: ["Poland", "Polonia"], HU: ["Hungary", "Hungría"], AT: ["Austria", "Austria"],
  IE: ["Ireland", "Irlanda"], GB: ["United Kingdom", "Reino Unido"], EG: ["Egypt", "Egipto"],
  TN: ["Tunisia", "Túnez"], DZ: ["Algeria", "Argelia"], TR: ["Turkey", "Turquía"],
  IL: ["Israel", "Israel"], PS: ["Palestine", "Palestina"], SY: ["Syria", "Siria"],
  JP: ["Japan", "Japón"], IN: ["India", "India"], PH: ["Philippines", "Filipinas"],
  VN: ["Vietnam", "Vietnam"], KR: ["Korea", "Corea"], CN: ["China", "China"],
  MO: ["Macau", "Macao"], PE: ["Peru", "Perú"], MX: ["Mexico", "México"],
  CO: ["Colombia", "Colombia"], EC: ["Ecuador", "Ecuador"], AR: ["Argentina", "Argentina"],
  CL: ["Chile", "Chile"], PY: ["Paraguay", "Paraguay"], BO: ["Bolivia", "Bolivia"],
  VE: ["Venezuela", "Venezuela"], CU: ["Cuba", "Cuba"], DO: ["Dominican Republic", "República Dominicana"],
  PR: ["Puerto Rico", "Puerto Rico"], CA: ["Canada", "Canadá"], US: ["United States", "Estados Unidos"],
  BE: ["Belgium", "Bélgica"], NL: ["Netherlands", "Países Bajos"], LU: ["Luxembourg", "Luxemburgo"],
  CH: ["Switzerland", "Suiza"], SE: ["Sweden", "Suecia"], NO: ["Norway", "Noruega"],
  DK: ["Denmark", "Dinamarca"], FI: ["Finland", "Finlandia"], RO: ["Romania", "Rumanía"],
  GR: ["Greece", "Grecia"], CY: ["Cyprus", "Chipre"], MT: ["Malta", "Malta"],
  HR: ["Croatia", "Croacia"], RS: ["Serbia", "Serbia"], BG: ["Bulgaria", "Bulgaria"],
  AL: ["Albania", "Albania"], UA: ["Ukraine", "Ucrania"], RU: ["Russia", "Rusia"],
  LT: ["Lithuania", "Lituania"], ET: ["Ethiopia", "Etiopía"], UG: ["Uganda", "Uganda"],
  NG: ["Nigeria", "Nigeria"], KE: ["Kenya", "Kenia"], TZ: ["Tanzania", "Tanzania"],
  RW: ["Rwanda", "Ruanda"], CD: ["DR Congo", "R.D. del Congo"], SD: ["Sudan", "Sudán"],
  BR: ["Brazil", "Brasil"], AU: ["Australia", "Australia"],
};

function placeCountry(extract) {
  const t = ` ${norm(extract)} `;
  // longest place names first to prefer "santiago de compostela" over "santiago"
  const places = Object.keys(PLACES).sort((a, b) => b.length - a.length);
  const m = t.match(new RegExp(`\\b(?:martyr|bishop|archbishop|pope|abbot|abbess|priest|nun|monk|friar|missionary|saint|apostle|king|queen|born in|from|of)\\s+([a-zà-ÿ\\- ]+?)(?=[,.;)\\)]|$)`, ""));
  if (!m) return null;
  const cand = m[1].trim();
  for (const p of places) {
    if (cand === p || cand.endsWith(` ${p}`)) {
      const code = PLACES[p];
      const [en, es] = PLACE_COUNTRY_NAMES[code];
      return { code, en, es };
    }
  }
  return null;
}
const HISTORICAL = [
  [/ancient rome|roman empire/i, ["IT", "Italy", "Italia"]],
  [/byzantine/i, ["TR", "Turkey", "Turquía"]],
  [/kingdom of italy|republic of venice|republic of genoa|papal states|kingdom of naples|kingdom of the lombards|ostrogothic|sardinia|savoy/i, ["IT", "Italy", "Italia"]],
  [/kingdom of england|kingdom of wessex|kingdom of northumbria|kingdom of kent|kingdom of mercia|wales|scotland/i, ["GB", "United Kingdom", "Reino Unido"]],
  [/united kingdom of great britain/i, ["GB", "United Kingdom", "Reino Unido"]],
  [/kingdom of france|carolingian|frankish/i, ["FR", "France", "Francia"]],
  [/crown of aragon|crown of castile|kingdom of toledo|kingdom of leon|kingdom of aragon|spanish empire|navarre/i, ["ES", "Spain", "España"]],
  [/holy roman empire|austrian empire|austria-hungary/i, ["AT", "Austria", "Austria"]],
  [/russian empire|kievan rus/i, ["RU", "Russia", "Rusia"]],
  [/ottoman/i, ["TR", "Turkey", "Turquía"]],
  [/sasanian|persia/i, ["IR", "Iran", "Irán"]],
  [/british raj/i, ["IN", "India", "India"]],
  [/qing dynasty|ming dynasty|tang dynasty/i, ["CN", "China", "China"]],
  [/joseon|goryeo/i, ["KR", "Korea", "Corea"]],
  [/polish.lithuanian/i, ["PL", "Poland", "Polonia"]],
  [/buganda/i, ["UG", "Uganda", "Uganda"]],
  [/galatia|cappadocia|asia minor/i, ["TR", "Turkey", "Turquía"]],
  [/kingdom of portugal/i, ["PT", "Portugal", "Portugal"]],
  [/kingdom of burgundy/i, ["FR", "France", "Francia"]],
  [/kingdom of hungary/i, ["HU", "Hungary", "Hungría"]],
  [/bohemia/i, ["CZ", "Czechia", "Chequia"]],
  [/bavaria|saxony|prussia/i, ["DE", "Germany", "Alemania"]],
  [/kingdom of leinster|kingdom of gwynedd|kingdom of munster/i, ["IE", "Ireland", "Irlanda"]],
  [/silesia/i, ["PL", "Poland", "Polonia"]],
  [/gran colombia/i, ["CO", "Colombia", "Colombia"]],
  [/franciaf/i, ["FR", "France", "Francia"]],
  [/\bengland\b/i, ["GB", "England", "Inglaterra"]],
  [/lithuania/i, ["LT", "Lithuania", "Lituania"]],
  [/castile|valencia|catalonia|asturias|majorca|al-andalus|visigothic|suebi|galicia\b/i, ["ES", "Spain", "España"]],
  [/milan|naples\b|siena|bologna|lucca|camerino/i, ["IT", "Italy", "Italia"]],
  [/dyfed|ceredigion|east anglia/i, ["GB", "United Kingdom", "Reino Unido"]],
  [/hibernia|kingdom of ireland/i, ["IE", "Ireland", "Irlanda"]],
  [/moscow|rostov/i, ["RU", "Russia", "Rusia"]],
  [/judea|judaea/i, ["IL", "Israel", "Israel"]],
  [/classical athens/i, ["GR", "Greece", "Grecia"]],
  [/roman egypt/i, ["EG", "Egypt", "Egipto"]],
  [/tokugawa/i, ["JP", "Japan", "Japón"]],
  [/tonkin/i, ["VN", "Vietnam", "Vietnam"]],
  [/umayyad/i, ["SY", "Syria", "Siria"]],
  [/austria.hungary|margraviate of austria|salzburg/i, ["AT", "Austria", "Austria"]],
  [/west francia|east francia|kingdom of germany|german empire|hesse|teschen/i, ["DE", "Germany", "Alemania"]],
  [/luxembourg/i, ["LU", "Luxembourg", "Luxemburgo"]],
  [/tuscany/i, ["IT", "Italy", "Italia"]],
  [/croatia/i, ["HR", "Croatia", "Croacia"]],
  [/kingdom of serbia/i, ["RS", "Serbia", "Serbia"]],
  [/bulgarian/i, ["BG", "Bulgaria", "Bulgaria"]],
  [/occitania/i, ["FR", "France", "Francia"]],
  [/icelandic/i, ["IS", "Iceland", "Islandia"]],
  [/new spain/i, ["ES", "Spain", "España"]],
  [/new france/i, ["FR", "France", "Francia"]],
  [/viceroyalty of peru/i, ["PE", "Peru", "Perú"]],
  [/spanish netherlands|habsburg netherlands|southern netherlands/i, ["BE", "Belgium", "Bélgica"]],
  [/kingdom of poland/i, ["PL", "Poland", "Polonia"]],
];

function historicalCountry(label) {
  if (!label) return null;
  for (const [re, c] of HISTORICAL) {
    if (re.test(label)) return { code: c[0], en: c[1], es: c[2] };
  }
  return null;
}

const ROLE_WORDS = "friar|priest|nun|monk|saint|martyr|bishop|pope|mystic|missionary|deacon|hermit|abbot|abbess|cardinal|theologian|king|queen|prince|princess|virgin|widow|recluse|anchorite|convert|scholar|philosopher|doctor|apostle|evangelist|preacher|pastor|educator|teacher";

function demonymCountry(extract) {
  const clean = norm(extract).replace(/roman catholic/g, " ");
  const m = clean.match(/\bwas an? (.+)/);
  if (m) {
    const rest = m[1].replace(/^[a-z]+-century /, "").slice(0, 70);
    const keys = Object.keys(DEMONYMS).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (rest === k || rest.startsWith(k + " ") || rest.startsWith(k + ",") || rest.startsWith(k + "-")) {
        const after = rest.slice(k.length, k.length + 50);
        if (new RegExp(`\\b(${ROLE_WORDS})\\b`).test(after)) {
          const [code, en, es] = DEMONYMS[k];
          return { code, en, es };
        }
      }
    }
  }
  // "Italian-born", "Spanish-born …"
  const b = clean.match(/\b([a-z\- ]+?)-born\b/);
  if (b && DEMONYMS[b[1].trim()]) {
    const [code, en, es] = DEMONYMS[b[1].trim()];
    return { code, en, es };
  }
  return null;
}

/** Normalize Wikidata P298 values (usually alpha-2, sometimes alpha-3). */
const A3_TO_A2 = {
  ESP: "ES", FRA: "FR", ITA: "IT", DEU: "DE", GBR: "GB", USA: "US", PRT: "PT",
  NLD: "NL", BEL: "BE", AUT: "AT", CHE: "CH", POL: "PL", IRL: "IE", MEX: "MX",
  BRA: "BR", ARG: "AR", COL: "CO", PER: "PE", CHL: "CL", CAN: "CA", IND: "IN",
  PHL: "PH", JPN: "JP", CHN: "CN", VNM: "VN", EGY: "EG", NGA: "NG", KEN: "KE",
  HRV: "HR", SVN: "SI", SVK: "SK", CZE: "CZ", HUN: "HU", ROU: "RO", BGR: "BG",
  SRB: "RS", GRC: "GR", TUR: "TR", ARM: "AM", RUS: "RU", UKR: "UA", SWE: "SE",
  NOR: "NO", DNK: "DK", AUS: "AU", CUB: "CU", KOR: "KR",
  UGA: "UG", ECU: "EC", LBN: "LB", MLT: "MT", IRQ: "IQ", ETH: "ET",
  CYP: "CY", FIN: "FI", SDN: "SD", SLV: "SV", SYR: "SY", ALB: "AL",
};
function normIso(iso) {
  if (!iso) return iso;
  const u = String(iso).toUpperCase();
  return A3_TO_A2[u] || (u.length === 2 ? u : iso);
}

// ------------------------------------------------------- special lists ---
const DOCTORS = ["augustine of hippo","ambrose","jerome","pope gregory i","gregory the great","athanasius of alexandria","john chrysostom","basil of caesarea","basil the great","gregory of nazianzus","thomas aquinas","bonaventure","anselm of canterbury","isidore of seville","peter chrysologus","pope leo i","leo the great","peter damian","bernard of clairvaux","hilary of poitiers","alphonsus liguori","alphonsus maria de liguori","francis de sales","cyril of alexandria","cyril of jerusalem","john of damascus","bede","ephrem the syrian","peter canisius","john of the cross","robert bellarmine","albertus magnus","albert the great","anthony of padua","lawrence of brindisi","teresa of avila","catherine of siena","therese of lisieux","john of avila","hildegard of bingen","gregory of narek","irenaeus","irenaeus of lyon"].map(norm);
const APOSTLES = ["andrew the apostle","bartholomew the apostle","james the great","james, son of alphaeus","john the apostle","jude the apostle","matthew the apostle","matthias the apostle","saint peter","philip the apostle","simon the zealot","thomas the apostle","paul the apostle"].map(norm);
const EVANGELISTS = ["mark the evangelist","luke the evangelist","matthew the apostle","john the apostle"].map(norm);

function yearOf(wdTime) {
  const m = /^\+?(-?\d{1,4})/.exec(wdTime || "");
  return m ? parseInt(m[1], 10) : null;
}
function centuryOf(year) {
  if (year == null) return null;
  if (year <= 0) return 1;
  return Math.floor((year - 1) / 100) + 1;
}

// ----------------------------------------------------------------- build
function build() {
  const pages = load("pages.json");
  const claims = load("claims.json");
  const entities = load("entities.json");
  let esSummaries = {};
  try {
    esSummaries = load("es-summaries.json");
  } catch {
    /* optional: run scripts/fetch-es-summaries.mjs first */
  }
  let esTitles = {};
  try {
    esTitles = load("es-titles.json");
  } catch {
    /* optional: run scripts/fetch-es-summaries.mjs first */
  }

  const saints = [];
  const seenSlugs = new Set();
  const stats = { dropped: 0, noDates: 0, noCountry: 0, noOrder: 0, noSpanish: 0 };

  for (const key of Object.keys(pages)) {
    const p = pages[key];
    if (p.missing || p.disamb) { stats.dropped++; continue; }
    const extract = (p.extract || "").trim();
    if (extract.length < 40 || /may refer to:/i.test(extract)) { stats.dropped++; continue; }

    const c = (p.wikibase && claims[p.wikibase]) || {};
    const birth = c.birth && c.birth.length ? yearOf(c.birth[0]) : null;
    const death = c.death && c.death.length ? yearOf(c.death[0]) : null;
    const century = centuryOf(death ?? birth);
    if (century == null) stats.noDates++;

    // country: wikidata P27 with ISO first, then demonym (often more accurate
    // than historical polities, e.g. Kolbe born in the Russian Empire was Polish),
    // then historical → modern mapping, then famous-place fallback.
    let country = null;
    let histCountry = null;
    const qCountry = (c.country || [])[0];
    if (qCountry && entities[qCountry]) {
      const e = entities[qCountry];
      if (e.iso) {
        const code = normIso(e.iso);
        country = { code, en: e.label || qCountry, es: e.labelEs || e.label || qCountry };
      } else {
        const hist = historicalCountry(e.label);
        if (hist) histCountry = hist;
        else histCountry = { code: qCountry, en: e.label || qCountry, es: e.labelEs || e.label || qCountry };
      }
    }
    if (!country) {
      const d = demonymCountry(extract);
      if (d) country = { code: d.code, en: d.en, es: d.es };
    }
    if (!country) country = histCountry;
    if (!country) {
      const pl = placeCountry(extract);
      if (pl) country = { code: pl.code, en: pl.en, es: pl.es };
    }
    if (!country) stats.noCountry++;

    // order: wikidata P463 labels first, then extract keywords
    let order = null;
    for (const q of c.memberOf || []) {
      const e = entities[q];
      if (e && e.label) {
        const oid = findOrder(e.label);
        if (oid) { order = oid; break; }
      }
    }
    if (!order) order = findOrder(extract);
    if (!order) stats.noOrder++;

    // sex
    let sex = null;
    const qSex = (c.sex || [])[0];
    if (qSex === "Q6581097") sex = "m";
    else if (qSex === "Q6581072") sex = "f";
    else {
      const t = norm(extract);
      if (/\bshe was\b|\bher ministry\b|\bherself\b/.test(t)) sex = "f";
      else if (/\bhe was\b|\bhis ministry\b|\bhimself\b/.test(t)) sex = "m";
    }

    // status: saint vs blessed
    const t = norm(extract);
    const canonized = /\bcanoniz/.test(t);
    const beatified = /\bbeatif/.test(t);
    const status = canonized || !beatified ? "saint" : "blessed";

    // tags
    const n = norm(p.title);
    const tags = [];
    if (/\bmartyr/.test(t)) tags.push("martyr");
    if (DOCTORS.includes(n)) tags.push("doctor");
    if (APOSTLES.includes(n)) tags.push("apostle");
    if (EVANGELISTS.includes(n)) tags.push("evangelist");
    if (/^pope /.test(n) || /\bwas (elected |chosen as )?pope\b/.test(t) || /\bbecame pope\b/.test(t)) tags.push("pope");
    if (/\bfound(er|ed|ress)\b/.test(t)) tags.push("founder");
    if (/\bmystic/.test(t)) tags.push("mystic");
    if (/\bmissionar/.test(t)) tags.push("missionary");
    if (/\bvirgin\b(?!\s+mary)/.test(t)) tags.push("virgin");
    if (/\bhermit\b|\banchorite\b|\brecluse\b/.test(t)) tags.push("hermit");
    if (/\btheologian\b/.test(t)) tags.push("theologian");

    // roles
    const roles = [];
    if (/\barchbishop\b|\bbishop\b/.test(t)) roles.push("bishop");
    if (/\bpriest\b/.test(t)) roles.push("priest");
    if (/\bnun\b/.test(t)) roles.push("nun");
    if (/\bmonk\b/.test(t)) roles.push("monk");
    if (/\bfriar\b/.test(t)) roles.push("friar");
    if (/\bdeacon\b/.test(t)) roles.push("deacon");
    if (/\bcardinal\b/.test(t)) roles.push("cardinal");
    if (/\babbess\b/.test(t)) roles.push("abbess");
    else if (/\babbot\b/.test(t)) roles.push("abbot");
    if (/\bking\b|\bqueen\b|\bprince\b|\bprincess\b|\bemperor\b|\bempress\b|\bduke\b|\bduchess\b/.test(t)) roles.push("royal");

    let id = slug(p.title) || "saint";
    let k = 2;
    while (seenSlugs.has(id)) id = `${slug(p.title)}-${k++}`;
    seenSlugs.add(id);

    // La app es 100% en español: solo santos con resumen en español.
    const summaryEs = esSummaries[id];
    const titleEs = esTitles[id];
    if (!summaryEs || !titleEs) {
      stats.noSpanish++;
      continue;
    }

    saints.push({
      id,
      name: titleEs,
      birth, death, century,
      country: country ? { c: country.code, n: country.es } : null,
      order,
      sex,
      status,
      tags,
      roles,
      summary: summaryEs,
      thumb: p.thumb,
      wiki: titleEs,
    });
  }

  // meta
  const byCountry = {}, byOrder = {}, byCentury = {}, byTag = {}, byStatus = { saint: 0, blessed: 0 };
  for (const s of saints) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    if (s.country) {
      const k = s.country.c;
      byCountry[k] = byCountry[k] || { c: k, name: s.country.n, count: 0 };
      byCountry[k].count++;
    }
    if (s.order) byOrder[s.order] = (byOrder[s.order] || 0) + 1;
    if (s.century) byCentury[s.century] = (byCentury[s.century] || 0) + 1;
    for (const tg of s.tags) byTag[tg] = (byTag[tg] || 0) + 1;
  }

  writeFileSync(join(OUT, "saints.json"), JSON.stringify(saints));
  writeFileSync(join(OUT, "meta.json"), JSON.stringify({
    total: saints.length,
    byCountry: Object.values(byCountry).sort((a, b) => b.count - a.count),
    byOrder, byCentury, byTag, byStatus,
    orders: ORDERS.map((o) => ({ id: o.id, es: o.es })),
    generated: new Date().toISOString().slice(0, 10),
  }));
  console.log(`saints: ${saints.length}`, stats);
  console.log("top countries:", Object.values(byCountry).sort((a, b) => b.count - a.count).slice(0, 8).map((x) => `${x.name}:${x.count}`).join(", "));
  console.log("top orders:", Object.entries(byOrder).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(", "));
  console.log("tags:", JSON.stringify(byTag));
}

build();
