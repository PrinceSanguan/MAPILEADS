export interface LeadReview {
    author: string;
    rating: number;
    text: string;
    time: string;
}

export interface Lead {
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
}

export interface LeadAnalysis {
    strengths: string[];
    painPoints: string[];
    reviewInsights: string[];
    email: { subject: string; body: string };
}

export interface LeadFilters {
    types: string[];
    country?: string;
    region?: string;
    province?: string;
    city?: string;
    business?: boolean;
    enriched?: boolean;
    reviews?: boolean;
    volume?: number;
}
