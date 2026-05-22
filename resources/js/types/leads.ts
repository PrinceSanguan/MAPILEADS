export interface LeadReview {
    author: string;
    rating: number;
    text: string;
    time: string;
}

export interface LeadSocial {
    label: string;
    url: string;
}

export interface LeadEmail {
    subject: string;
    body: string;
}

export interface LeadAnalysis {
    strengths: string[];
    painPoints: string[];
    reviewInsights: string[];
    /**
     * Present on a fresh `analyze` response. The persisted `aiAnalysis` prop
     * does not carry the email (it lives behind a re-analyze), so it is optional.
     */
    email?: LeadEmail;
}

export interface Lead {
    id: number;
    placeId: string;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    rating: number | null;
    reviewCount: number | null;
    priceLevel: number | null;
    phone: string | null;
    website: string | null;
    googleMapsUri: string | null;
    types: string[];
    businessStatus: string | null;
    openNow: boolean | null;
    reviews?: LeadReview[];
    socials?: LeadSocial[];
    emails?: string[];
    extraPhones?: string[];
    openingHours?: string[] | null;
    editorialSummary?: string | null;
    aiAnalysis?: LeadAnalysis | null;
    aiTone?: string | null;
}

export interface SavedSearch {
    id: number;
    label: string;
    types: string[];
    count: number;
    createdAt: string;
}

export interface LeadFilters {
    types: string[];
    country?: string;
    region?: string;
    province?: string;
    city?: string;
    volume?: number;
}
