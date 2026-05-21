// Curated, representative location data for the cascading search-area selectors.
//
// This is a deliberately curated (NOT exhaustive) dataset of real place names,
// shaped as Country -> Region -> Province/State/County -> City[]. It is meant to
// power demo cascading dropdowns and is easily extensible: add new entries by
// following the same nested shape. Each country has a handful of regions, each
// region a handful of provinces/states/counties, and each of those a handful of
// real cities.

// Country -> Region -> Province/State/County -> City[]
export type LocationTree = Record<string, Record<string, Record<string, string[]>>>;

export const LOCATIONS: LocationTree = {
    'United States': {
        Northeast: {
            'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany'],
            Massachusetts: ['Boston', 'Worcester', 'Cambridge', 'Springfield'],
            Pennsylvania: ['Philadelphia', 'Pittsburgh', 'Allentown'],
        },
        Midwest: {
            Illinois: ['Chicago', 'Aurora', 'Naperville', 'Springfield'],
            Ohio: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
            Michigan: ['Detroit', 'Grand Rapids', 'Ann Arbor'],
        },
        South: {
            Texas: ['Houston', 'San Antonio', 'Dallas', 'Austin'],
            Florida: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
            Georgia: ['Atlanta', 'Savannah', 'Augusta'],
        },
        West: {
            California: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'],
            Washington: ['Seattle', 'Spokane', 'Tacoma'],
            Arizona: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'],
        },
    },

    Canada: {
        'Central Canada': {
            Ontario: ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton'],
            Quebec: ['Montreal', 'Quebec City', 'Laval', 'Gatineau'],
        },
        'Western Canada': {
            'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Kelowna'],
            Alberta: ['Calgary', 'Edmonton', 'Red Deer'],
            Manitoba: ['Winnipeg', 'Brandon'],
        },
        'Atlantic Canada': {
            'Nova Scotia': ['Halifax', 'Sydney', 'Dartmouth'],
            'New Brunswick': ['Fredericton', 'Moncton', 'Saint John'],
        },
    },

    'United Kingdom': {
        England: {
            'Greater London': ['London', 'Croydon', 'Bromley'],
            'West Midlands': ['Birmingham', 'Coventry', 'Wolverhampton'],
            'Greater Manchester': ['Manchester', 'Salford', 'Bolton'],
            Merseyside: ['Liverpool', 'Birkenhead', 'St Helens'],
        },
        Scotland: {
            'City of Glasgow': ['Glasgow'],
            'City of Edinburgh': ['Edinburgh'],
            Aberdeenshire: ['Aberdeen', 'Peterhead', 'Fraserburgh'],
        },
        Wales: {
            Cardiff: ['Cardiff'],
            Swansea: ['Swansea'],
        },
        'Northern Ireland': {
            Belfast: ['Belfast'],
            'County Antrim': ['Lisburn', 'Antrim', 'Ballymena'],
        },
    },

    Australia: {
        'New South Wales': {
            'Greater Sydney': ['Sydney', 'Parramatta', 'Penrith'],
            Hunter: ['Newcastle', 'Maitland', 'Cessnock'],
        },
        Victoria: {
            'Greater Melbourne': ['Melbourne', 'Geelong', 'Frankston'],
            'Grampians': ['Ballarat', 'Ararat', 'Horsham'],
        },
        Queensland: {
            'South East Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast'],
            'Far North Queensland': ['Cairns', 'Townsville'],
        },
        'Western Australia': {
            'Greater Perth': ['Perth', 'Fremantle', 'Mandurah'],
            'South West': ['Bunbury', 'Busselton', 'Albany'],
        },
    },

    Philippines: {
        Luzon: {
            'Metro Manila': ['Manila', 'Quezon City', 'Makati', 'Taguig'],
            Cavite: ['Bacoor', 'Dasmariñas', 'Imus'],
            Pampanga: ['Angeles', 'San Fernando', 'Mabalacat'],
        },
        Visayas: {
            Cebu: ['Cebu City', 'Mandaue', 'Lapu-Lapu'],
            Iloilo: ['Iloilo City', 'Passi'],
            'Negros Occidental': ['Bacolod', 'Silay', 'Talisay'],
        },
        Mindanao: {
            'Davao del Sur': ['Davao City', 'Digos'],
            'Misamis Oriental': ['Cagayan de Oro', 'Gingoog'],
            'Zamboanga del Sur': ['Zamboanga City', 'Pagadian'],
        },
    },

    Germany: {
        Bavaria: {
            'Upper Bavaria': ['Munich', 'Ingolstadt', 'Rosenheim'],
            Franconia: ['Nuremberg', 'Würzburg', 'Fürth'],
        },
        Berlin: {
            Berlin: ['Berlin', 'Charlottenburg', 'Spandau'],
        },
        'North Rhine-Westphalia': {
            'Rhineland': ['Cologne', 'Düsseldorf', 'Bonn'],
            'Ruhr Area': ['Dortmund', 'Essen', 'Duisburg'],
        },
        'Baden-Württemberg': {
            Stuttgart: ['Stuttgart', 'Heilbronn', 'Esslingen'],
            'Freiburg Region': ['Freiburg', 'Offenburg', 'Lörrach'],
        },
    },

    France: {
        'Île-de-France': {
            Paris: ['Paris', 'Boulogne-Billancourt', 'Saint-Denis'],
            Yvelines: ['Versailles', 'Mantes-la-Jolie', 'Poissy'],
        },
        "Provence-Alpes-Côte d'Azur": {
            'Bouches-du-Rhône': ['Marseille', 'Aix-en-Provence', 'Arles'],
            'Alpes-Maritimes': ['Nice', 'Cannes', 'Antibes'],
        },
        'Auvergne-Rhône-Alpes': {
            Rhône: ['Lyon', 'Villeurbanne', 'Vénissieux'],
            Isère: ['Grenoble', 'Vienne', 'Échirolles'],
        },
        Occitanie: {
            'Haute-Garonne': ['Toulouse', 'Colomiers', 'Blagnac'],
            Hérault: ['Montpellier', 'Béziers', 'Sète'],
        },
    },
};

export const COUNTRIES = Object.keys(LOCATIONS);
