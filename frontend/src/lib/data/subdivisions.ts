export type SubdivisionType =
  | "state"
  | "province"
  | "county"
  | "region"
  | "emirate"
  | "canton"
  | "governorate";

export interface CountrySubdivision {
  name: string;
  code?: string;
}

export interface SubdivisionConfig {
  type: SubdivisionType;
  label: string;
  placeholder: string;
  subdivisions: CountrySubdivision[];
  required: boolean;
}

// ----------------------------------------------------------------------
// 1. COUNTRIES THAT USE "STATE"
// ----------------------------------------------------------------------

const NIGERIA_STATES: CountrySubdivision[] = [
  { name: "Abia" },
  { name: "Adamawa" },
  { name: "Akwa Ibom" },
  { name: "Anambra" },
  { name: "Bauchi" },
  { name: "Bayelsa" },
  { name: "Benue" },
  { name: "Borno" },
  { name: "Cross River" },
  { name: "Delta" },
  { name: "Ebonyi" },
  { name: "Edo" },
  { name: "Ekiti" },
  { name: "Enugu" },
  { name: "Federal Capital Territory (Abuja)", code: "FCT" },
  { name: "Gombe" },
  { name: "Imo" },
  { name: "Jigawa" },
  { name: "Kaduna" },
  { name: "Kano" },
  { name: "Katsina" },
  { name: "Kebbi" },
  { name: "Kogi" },
  { name: "Kwara" },
  { name: "Lagos" },
  { name: "Nasarawa" },
  { name: "Niger" },
  { name: "Ogun" },
  { name: "Ondo" },
  { name: "Osun" },
  { name: "Oyo" },
  { name: "Plateau" },
  { name: "Rivers" },
  { name: "Sokoto" },
  { name: "Taraba" },
  { name: "Yobe" },
  { name: "Zamfara" },
];

const US_STATES: CountrySubdivision[] = [
  { name: "Alabama", code: "AL" },
  { name: "Alaska", code: "AK" },
  { name: "Arizona", code: "AZ" },
  { name: "Arkansas", code: "AR" },
  { name: "California", code: "CA" },
  { name: "Colorado", code: "CO" },
  { name: "Connecticut", code: "CT" },
  { name: "Delaware", code: "DE" },
  { name: "District of Columbia", code: "DC" },
  { name: "Florida", code: "FL" },
  { name: "Georgia", code: "GA" },
  { name: "Hawaii", code: "HI" },
  { name: "Idaho", code: "ID" },
  { name: "Illinois", code: "IL" },
  { name: "Indiana", code: "IN" },
  { name: "Iowa", code: "IA" },
  { name: "Kansas", code: "KS" },
  { name: "Kentucky", code: "KY" },
  { name: "Louisiana", code: "LA" },
  { name: "Maine", code: "ME" },
  { name: "Maryland", code: "MD" },
  { name: "Massachusetts", code: "MA" },
  { name: "Michigan", code: "MI" },
  { name: "Minnesota", code: "MN" },
  { name: "Mississippi", code: "MS" },
  { name: "Missouri", code: "MO" },
  { name: "Montana", code: "MT" },
  { name: "Nebraska", code: "NE" },
  { name: "Nevada", code: "NV" },
  { name: "New Hampshire", code: "NH" },
  { name: "New Jersey", code: "NJ" },
  { name: "New Mexico", code: "NM" },
  { name: "New York", code: "NY" },
  { name: "North Carolina", code: "NC" },
  { name: "North Dakota", code: "ND" },
  { name: "Ohio", code: "OH" },
  { name: "Oklahoma", code: "OK" },
  { name: "Oregon", code: "OR" },
  { name: "Pennsylvania", code: "PA" },
  { name: "Rhode Island", code: "RI" },
  { name: "South Carolina", code: "SC" },
  { name: "South Dakota", code: "SD" },
  { name: "Tennessee", code: "TN" },
  { name: "Texas", code: "TX" },
  { name: "Utah", code: "UT" },
  { name: "Vermont", code: "VT" },
  { name: "Virginia", code: "VA" },
  { name: "Washington", code: "WA" },
  { name: "West Virginia", code: "WV" },
  { name: "Wisconsin", code: "WI" },
  { name: "Wyoming", code: "WY" },
  { name: "Puerto Rico", code: "PR" },
];

const AUSTRALIA_STATES: CountrySubdivision[] = [
  { name: "Australian Capital Territory", code: "ACT" },
  { name: "New South Wales", code: "NSW" },
  { name: "Northern Territory", code: "NT" },
  { name: "Queensland", code: "QLD" },
  { name: "South Australia", code: "SA" },
  { name: "Tasmania", code: "TAS" },
  { name: "Victoria", code: "VIC" },
  { name: "Western Australia", code: "WA" },
];

const GERMANY_STATES: CountrySubdivision[] = [
  { name: "Baden-Württemberg", code: "BW" },
  { name: "Bavaria (Bayern)", code: "BY" },
  { name: "Berlin", code: "BE" },
  { name: "Brandenburg", code: "BB" },
  { name: "Bremen", code: "HB" },
  { name: "Hamburg", code: "HH" },
  { name: "Hesse (Hessen)", code: "HE" },
  { name: "Lower Saxony (Niedersachsen)", code: "NI" },
  { name: "Mecklenburg-Western Pomerania", code: "MV" },
  { name: "North Rhine-Westphalia (NRW)", code: "NW" },
  { name: "Rhineland-Palatinate", code: "RP" },
  { name: "Saarland", code: "SL" },
  { name: "Saxony (Sachsen)", code: "SN" },
  { name: "Saxony-Anhalt", code: "ST" },
  { name: "Schleswig-Holstein", code: "SH" },
  { name: "Thuringia (Thüringen)", code: "TH" },
];

// ----------------------------------------------------------------------
// 2. COUNTRIES THAT USE "PROVINCE" (AND NOT STATE)
// ----------------------------------------------------------------------

const CANADA_PROVINCES: CountrySubdivision[] = [
  { name: "Alberta", code: "AB" },
  { name: "British Columbia", code: "BC" },
  { name: "Manitoba", code: "MB" },
  { name: "New Brunswick", code: "NB" },
  { name: "Newfoundland and Labrador", code: "NL" },
  { name: "Northwest Territories", code: "NT" },
  { name: "Nova Scotia", code: "NS" },
  { name: "Nunavut", code: "NU" },
  { name: "Ontario", code: "ON" },
  { name: "Prince Edward Island", code: "PE" },
  { name: "Quebec", code: "QC" },
  { name: "Saskatchewan", code: "SK" },
  { name: "Yukon", code: "YT" },
];

const SOUTH_AFRICA_PROVINCES: CountrySubdivision[] = [
  { name: "Eastern Cape", code: "EC" },
  { name: "Free State", code: "FS" },
  { name: "Gauteng", code: "GP" },
  { name: "KwaZulu-Natal", code: "KZN" },
  { name: "Limpopo", code: "LP" },
  { name: "Mpumalanga", code: "MP" },
  { name: "North West", code: "NW" },
  { name: "Northern Cape", code: "NC" },
  { name: "Western Cape", code: "WC" },
];

const SPAIN_PROVINCES: CountrySubdivision[] = [
  { name: "A Coruña" },
  { name: "Álava" },
  { name: "Albacete" },
  { name: "Alicante" },
  { name: "Almería" },
  { name: "Asturias" },
  { name: "Ávila" },
  { name: "Badajoz" },
  { name: "Balearic Islands (Baleares)" },
  { name: "Barcelona" },
  { name: "Biscay (Bizkaia)" },
  { name: "Burgos" },
  { name: "Cáceres" },
  { name: "Cádiz" },
  { name: "Cantabria" },
  { name: "Castellón" },
  { name: "Ciudad Real" },
  { name: "Córdoba" },
  { name: "Cuenca" },
  { name: "Gipuzkoa" },
  { name: "Girona" },
  { name: "Granada" },
  { name: "Guadalajara" },
  { name: "Huelva" },
  { name: "Huesca" },
  { name: "Jaén" },
  { name: "La Rioja" },
  { name: "Las Palmas" },
  { name: "León" },
  { name: "Lleida" },
  { name: "Lugo" },
  { name: "Madrid" },
  { name: "Málaga" },
  { name: "Murcia" },
  { name: "Navarra" },
  { name: "Ourense" },
  { name: "Palencia" },
  { name: "Pontevedra" },
  { name: "Salamanca" },
  { name: "Santa Cruz de Tenerife" },
  { name: "Segovia" },
  { name: "Seville (Sevilla)" },
  { name: "Soria" },
  { name: "Tarragona" },
  { name: "Teruel" },
  { name: "Toledo" },
  { name: "Valencia" },
  { name: "Valladolid" },
  { name: "Zamora" },
  { name: "Zaragoza" },
];

const ITALY_PROVINCES: CountrySubdivision[] = [
  { name: "Rome (Roma)", code: "RM" },
  { name: "Milan (Milano)", code: "MI" },
  { name: "Naples (Napoli)", code: "NA" },
  { name: "Turin (Torino)", code: "TO" },
  { name: "Florence (Firenze)", code: "FI" },
  { name: "Bologna", code: "BO" },
  { name: "Bari", code: "BA" },
  { name: "Catania", code: "CT" },
  { name: "Venice (Venezia)", code: "VE" },
  { name: "Verona", code: "VR" },
  { name: "Genoa (Genova)", code: "GE" },
  { name: "Palermo", code: "PA" },
  { name: "Padua (Padova)", code: "PD" },
  { name: "Brescia", code: "BS" },
  { name: "Bergamo", code: "BG" },
  { name: "Salerno", code: "SA" },
  { name: "Modena", code: "MO" },
  { name: "Parma", code: "PR" },
  { name: "Reggio Emilia", code: "RE" },
  { name: "Perugia", code: "PG" },
  { name: "Livorno", code: "LI" },
  { name: "Cagliari", code: "CA" },
  { name: "Foggia", code: "FG" },
  { name: "Ravenna", code: "RA" },
  { name: "Ferrara", code: "FE" },
  { name: "Rimini", code: "RN" },
  { name: "Sassari", code: "SS" },
  { name: "Monza and Brianza", code: "MB" },
  { name: "Trento", code: "TN" },
  { name: "Bolzano", code: "BZ" },
  { name: "Trieste", code: "TS" },
  { name: "Ancona", code: "AN" },
  { name: "Lecce", code: "LE" },
  { name: "Messina", code: "ME" },
  { name: "Pisa", code: "PI" },
  { name: "Treviso", code: "TV" },
  { name: "Vicenza", code: "VI" },
  { name: "Udine", code: "UD" },
  { name: "Como", code: "CO" },
  { name: "Varese", code: "VA" },
  { name: "Lucca", code: "LU" },
  { name: "Siena", code: "SI" },
  { name: "Arezzo", code: "AR" },
  { name: "Caserta", code: "CE" },
  { name: "Taranto", code: "TA" },
];

const NETHERLANDS_PROVINCES: CountrySubdivision[] = [
  { name: "Drenthe" },
  { name: "Flevoland" },
  { name: "Friesland" },
  { name: "Gelderland" },
  { name: "Groningen" },
  { name: "Limburg" },
  { name: "Noord-Brabant" },
  { name: "Noord-Holland" },
  { name: "Overijssel" },
  { name: "Utrecht" },
  { name: "Zeeland" },
  { name: "Zuid-Holland" },
];

const BELGIUM_PROVINCES: CountrySubdivision[] = [
  { name: "Antwerp" },
  { name: "Brussels-Capital" },
  { name: "East Flanders" },
  { name: "Flemish Brabant" },
  { name: "Hainaut" },
  { name: "Liège" },
  { name: "Limburg" },
  { name: "Luxembourg" },
  { name: "Namur" },
  { name: "Walloon Brabant" },
  { name: "West Flanders" },
];

const SAUDI_ARABIA_PROVINCES: CountrySubdivision[] = [
  { name: "Riyadh" },
  { name: "Makkah" },
  { name: "Eastern Province" },
  { name: "Madinah" },
  { name: "Al-Qassim" },
  { name: "Asir" },
  { name: "Tabuk" },
  { name: "Hail" },
  { name: "Northern Borders" },
  { name: "Jazan" },
  { name: "Najran" },
  { name: "Al-Bahah" },
  { name: "Al-Jawf" },
];

// ----------------------------------------------------------------------
// 3. COUNTRIES WITH OTHER SPECIFIC SUBDIVISIONS
// ----------------------------------------------------------------------

const UK_COUNTIES: CountrySubdivision[] = [
  { name: "Greater London" },
  { name: "Greater Manchester" },
  { name: "West Midlands" },
  { name: "West Yorkshire" },
  { name: "Kent" },
  { name: "Essex" },
  { name: "Hampshire" },
  { name: "Lancashire" },
  { name: "Surrey" },
  { name: "Hertfordshire" },
  { name: "South Yorkshire" },
  { name: "Merseyside" },
  { name: "Tyne and Wear" },
  { name: "Berkshire" },
  { name: "Gloucestershire" },
  { name: "Staffordshire" },
  { name: "Derbyshire" },
  { name: "Nottinghamshire" },
  { name: "Cheshire" },
  { name: "Devon" },
  { name: "Cambridgeshire" },
  { name: "Oxfordshire" },
  { name: "Edinburgh & Lothians" },
  { name: "Glasgow & Clyde" },
  { name: "Aberdeen & Grampian" },
  { name: "Cardiff & South Wales" },
  { name: "Belfast & Northern Ireland" },
];

const IRELAND_COUNTIES: CountrySubdivision[] = [
  { name: "Carlow" },
  { name: "Cavan" },
  { name: "Clare" },
  { name: "Cork" },
  { name: "Donegal" },
  { name: "Dublin" },
  { name: "Galway" },
  { name: "Kerry" },
  { name: "Kildare" },
  { name: "Kilkenny" },
  { name: "Laois" },
  { name: "Leitrim" },
  { name: "Limerick" },
  { name: "Longford" },
  { name: "Louth" },
  { name: "Mayo" },
  { name: "Meath" },
  { name: "Monaghan" },
  { name: "Offaly" },
  { name: "Roscommon" },
  { name: "Sligo" },
  { name: "Tipperary" },
  { name: "Waterford" },
  { name: "Westmeath" },
  { name: "Wexford" },
  { name: "Wicklow" },
];

const UAE_EMIRATES: CountrySubdivision[] = [
  { name: "Abu Dhabi" },
  { name: "Dubai" },
  { name: "Sharjah" },
  { name: "Ajman" },
  { name: "Umm Al Quwain" },
  { name: "Ras Al Khaimah" },
  { name: "Fujairah" },
];

const SWITZERLAND_CANTONS: CountrySubdivision[] = [
  { name: "Aargau", code: "AG" },
  { name: "Appenzell Ausserrhoden", code: "AR" },
  { name: "Appenzell Innerrhoden", code: "AI" },
  { name: "Basel-Landschaft", code: "BL" },
  { name: "Basel-Stadt", code: "BS" },
  { name: "Bern", code: "BE" },
  { name: "Fribourg", code: "FR" },
  { name: "Geneva (Genève)", code: "GE" },
  { name: "Glarus", code: "GL" },
  { name: "Graubünden", code: "GR" },
  { name: "Jura", code: "JU" },
  { name: "Lucerne (Luzern)", code: "LU" },
  { name: "Neuchâtel", code: "NE" },
  { name: "Nidwalden", code: "NW" },
  { name: "Obwalden", code: "OW" },
  { name: "Schaffhausen", code: "SH" },
  { name: "Schwyz", code: "SZ" },
  { name: "Solothurn", code: "SO" },
  { name: "St. Gallen", code: "SG" },
  { name: "Thurgau", code: "TG" },
  { name: "Ticino", code: "TI" },
  { name: "Uri", code: "UR" },
  { name: "Valais", code: "VS" },
  { name: "Vaud", code: "VD" },
  { name: "Zug", code: "ZG" },
  { name: "Zurich (Zürich)", code: "ZH" },
];

const GHANA_REGIONS: CountrySubdivision[] = [
  { name: "Ahafo" },
  { name: "Ashanti" },
  { name: "Bono" },
  { name: "Bono East" },
  { name: "Central" },
  { name: "Eastern" },
  { name: "Greater Accra" },
  { name: "North East" },
  { name: "Northern" },
  { name: "Oti" },
  { name: "Savannah" },
  { name: "Upper East" },
  { name: "Upper West" },
  { name: "Volta" },
  { name: "Western" },
  { name: "Western North" },
];

const KENYA_COUNTIES: CountrySubdivision[] = [
  { name: "Baringo" },
  { name: "Bomet" },
  { name: "Bungoma" },
  { name: "Busia" },
  { name: "Elgeyo-Marakwet" },
  { name: "Embu" },
  { name: "Garissa" },
  { name: "Homa Bay" },
  { name: "Isiolo" },
  { name: "Kajiado" },
  { name: "Kakamega" },
  { name: "Kericho" },
  { name: "Kiambu" },
  { name: "Kilifi" },
  { name: "Kirinyaga" },
  { name: "Kisii" },
  { name: "Kisumu" },
  { name: "Kitui" },
  { name: "Kwale" },
  { name: "Laikipia" },
  { name: "Lamu" },
  { name: "Machakos" },
  { name: "Makueni" },
  { name: "Mandera" },
  { name: "Marsabit" },
  { name: "Meru" },
  { name: "Migori" },
  { name: "Mombasa" },
  { name: "Murang'a" },
  { name: "Nairobi" },
  { name: "Nakuru" },
  { name: "Nandi" },
  { name: "Narok" },
  { name: "Nyamira" },
  { name: "Nyandarua" },
  { name: "Nyeri" },
  { name: "Samburu" },
  { name: "Siaya" },
  { name: "Taita-Taveta" },
  { name: "Tana River" },
  { name: "Tharaka-Nithi" },
  { name: "Trans Nzoia" },
  { name: "Turkana" },
  { name: "Uasin Gishu" },
  { name: "Vihiga" },
  { name: "Wajir" },
  { name: "West Pokot" },
];

const EGYPT_GOVERNORATES: CountrySubdivision[] = [
  { name: "Cairo" },
  { name: "Alexandria" },
  { name: "Giza" },
  { name: "Dakahlia" },
  { name: "Red Sea" },
  { name: "Beheira" },
  { name: "Fayoum" },
  { name: "Gharbia" },
  { name: "Ismailia" },
  { name: "Menofia" },
  { name: "Minya" },
  { name: "Qaliubiya" },
  { name: "New Valley" },
  { name: "Suez" },
  { name: "Aswan" },
  { name: "Assiut" },
  { name: "Beni Suef" },
  { name: "Port Said" },
  { name: "Damietta" },
  { name: "Sharkia" },
  { name: "South Sinai" },
  { name: "Kafr El Sheikh" },
  { name: "Matrouh" },
  { name: "Luxor" },
  { name: "Qena" },
  { name: "North Sinai" },
  { name: "Sohag" },
];

const FRANCE_REGIONS: CountrySubdivision[] = [
  { name: "Auvergne-Rhône-Alpes" },
  { name: "Bourgogne-Franche-Comté" },
  { name: "Brittany (Bretagne)" },
  { name: "Centre-Val de Loire" },
  { name: "Corsica (Corse)" },
  { name: "Grand Est" },
  { name: "Hauts-de-France" },
  { name: "Île-de-France" },
  { name: "Normandy (Normandie)" },
  { name: "Nouvelle-Aquitaine" },
  { name: "Occitanie" },
  { name: "Pays de la Loire" },
  { name: "Provence-Alpes-Côte d'Azur" },
];

const MOROCCO_REGIONS: CountrySubdivision[] = [
  { name: "Béni Mellal-Khénifra" },
  { name: "Casablanca-Settat" },
  { name: "Dakhla-Oued Ed-Dahab" },
  { name: "Drâa-Tafilalet" },
  { name: "Fès-Meknès" },
  { name: "Guelmim-Oued Noun" },
  { name: "Laâyoune-Sakia El Hamra" },
  { name: "Marrakech-Safi" },
  { name: "Oriental" },
  { name: "Rabat-Salé-Kénitra" },
  { name: "Souss-Massa" },
  { name: "Tanger-Tétouan-Al Hoceïma" },
];

// ----------------------------------------------------------------------
// CONFIGURATION BY COUNTRY ISO CODE
// ----------------------------------------------------------------------

export const SUBDIVISIONS_BY_CODE: Record<string, SubdivisionConfig> = {
  // COUNTRIES WITH "STATE"
  NG: {
    type: "state",
    label: "State",
    placeholder: "Select state",
    subdivisions: NIGERIA_STATES,
    required: true,
  },
  US: {
    type: "state",
    label: "State",
    placeholder: "Select state",
    subdivisions: US_STATES,
    required: true,
  },
  AU: {
    type: "state",
    label: "State",
    placeholder: "Select state",
    subdivisions: AUSTRALIA_STATES,
    required: true,
  },
  DE: {
    type: "state",
    label: "State",
    placeholder: "Select state",
    subdivisions: GERMANY_STATES,
    required: true,
  },

  // COUNTRIES THAT USE "PROVINCE" (AND NOT STATE)
  CA: {
    type: "province",
    label: "Province",
    placeholder: "Select province",
    subdivisions: CANADA_PROVINCES,
    required: true,
  },
  ZA: {
    type: "province",
    label: "Province",
    placeholder: "Select province",
    subdivisions: SOUTH_AFRICA_PROVINCES,
    required: true,
  },
  ES: {
    type: "province",
    label: "Province",
    placeholder: "Select province",
    subdivisions: SPAIN_PROVINCES,
    required: true,
  },
  IT: {
    type: "province",
    label: "Province",
    placeholder: "Select province",
    subdivisions: ITALY_PROVINCES,
    required: true,
  },
  NL: {
    type: "province",
    label: "Province",
    placeholder: "Select province",
    subdivisions: NETHERLANDS_PROVINCES,
    required: true,
  },
  BE: {
    type: "province",
    label: "Province",
    placeholder: "Select province",
    subdivisions: BELGIUM_PROVINCES,
    required: true,
  },
  SA: {
    type: "province",
    label: "Province",
    placeholder: "Select province",
    subdivisions: SAUDI_ARABIA_PROVINCES,
    required: true,
  },

  // OTHER LOCAL SUBDIVISIONS
  GB: {
    type: "county",
    label: "County",
    placeholder: "County (optional)",
    subdivisions: UK_COUNTIES,
    required: false,
  },
  IE: {
    type: "county",
    label: "County",
    placeholder: "Select county",
    subdivisions: IRELAND_COUNTIES,
    required: true,
  },
  AE: {
    type: "emirate",
    label: "Emirate",
    placeholder: "Select emirate",
    subdivisions: UAE_EMIRATES,
    required: true,
  },
  CH: {
    type: "canton",
    label: "Canton",
    placeholder: "Select canton",
    subdivisions: SWITZERLAND_CANTONS,
    required: true,
  },
  GH: {
    type: "region",
    label: "Region",
    placeholder: "Select region",
    subdivisions: GHANA_REGIONS,
    required: true,
  },
  KE: {
    type: "county",
    label: "County",
    placeholder: "Select county",
    subdivisions: KENYA_COUNTIES,
    required: true,
  },
  EG: {
    type: "governorate",
    label: "Governorate",
    placeholder: "Select governorate",
    subdivisions: EGYPT_GOVERNORATES,
    required: true,
  },
  FR: {
    type: "region",
    label: "Region",
    placeholder: "Region (optional)",
    subdivisions: FRANCE_REGIONS,
    required: false,
  },
  MA: {
    type: "region",
    label: "Region",
    placeholder: "Select region",
    subdivisions: MOROCCO_REGIONS,
    required: true,
  },
};

// Map lowercase country names to 2-letter ISO codes
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  nigeria: "NG",
  "united states": "US",
  usa: "US",
  australia: "AU",
  germany: "DE",
  canada: "CA",
  "south africa": "ZA",
  spain: "ES",
  italy: "IT",
  netherlands: "NL",
  belgium: "BE",
  "saudi arabia": "SA",
  "united kingdom": "GB",
  uk: "GB",
  ireland: "IE",
  "united arab emirates": "AE",
  uae: "AE",
  switzerland: "CH",
  ghana: "GH",
  kenya: "KE",
  egypt: "EG",
  france: "FR",
  morocco: "MA",
};

export function resolveCountryCode(countryCodeOrName: string): string {
  if (!countryCodeOrName) return "GB";
  const clean = countryCodeOrName.trim().toUpperCase();
  if (clean.length === 2 && SUBDIVISIONS_BY_CODE[clean]) {
    return clean;
  }
  const byName = COUNTRY_NAME_TO_CODE[countryCodeOrName.trim().toLowerCase()];
  return byName || clean;
}

/**
 * Retrieves the subdivision configuration for a given country.
 * Detects whether the country uses "state", "province", or another subdivision,
 * returning the proper label, placeholder, and subdivision list.
 */
export function getSubdivisionConfig(countryCodeOrName: string): SubdivisionConfig {
  const code = resolveCountryCode(countryCodeOrName);
  const config = SUBDIVISIONS_BY_CODE[code];
  if (config) {
    return config;
  }

  // Fallback for any other country
  return {
    type: "state",
    label: "State / Province",
    placeholder: "State / Province (optional)",
    subdivisions: [],
    required: false,
  };
}

export function isStateCountry(countryCodeOrName: string): boolean {
  const cfg = getSubdivisionConfig(countryCodeOrName);
  return cfg.type === "state";
}

export function isProvinceCountry(countryCodeOrName: string): boolean {
  const cfg = getSubdivisionConfig(countryCodeOrName);
  return cfg.type === "province";
}
