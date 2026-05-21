export interface GoogleMapsConfig {
    /** Google Maps JavaScript API browser key (HTTP-referrer restricted in GCP). */
    apiKey: string | null;
    /** Vector Map ID used to render the 3D globe. Null falls back to renderingType VECTOR. */
    mapId: string | null;
}
