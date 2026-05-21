import {
    AdvancedMarker,
    APIProvider,
    Map,
    Pin,
    useMap,
} from '@vis.gl/react-google-maps';
import { MapPinned } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import type { GoogleMapsConfig } from '@/types/google-maps';
import type { Lead } from '@/types/leads';

type LeadsMapProps = {
    config: GoogleMapsConfig;
    leads: Lead[];
    selectedPlaceId: string | null;
    onSelect: (placeId: string) => void;
    className?: string;
};

/** Average lat/lng of the leads, used as the initial camera center. */
function averageCenter(leads: Lead[]): google.maps.LatLngLiteral {
    if (leads.length === 0) {
        // Roughly the geographic center of the contiguous world view.
        return { lat: 20, lng: 0 };
    }

    const sum = leads.reduce(
        (acc, lead) => ({ lat: acc.lat + lead.lat, lng: acc.lng + lead.lng }),
        { lat: 0, lng: 0 },
    );

    return { lat: sum.lat / leads.length, lng: sum.lng / leads.length };
}

/** Pans the map smoothly to the selected lead whenever the selection changes. */
function MapController({
    leads,
    selectedPlaceId,
}: {
    leads: Lead[];
    selectedPlaceId: string | null;
}) {
    const map = useMap();

    React.useEffect(() => {
        if (!map || !selectedPlaceId) {
            return;
        }

        const lead = leads.find((item) => item.placeId === selectedPlaceId);

        if (lead) {
            map.panTo({ lat: lead.lat, lng: lead.lng });
        }
    }, [map, leads, selectedPlaceId]);

    return null;
}

function MapPlaceholder({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-100 p-8 text-center',
                className,
            )}
        >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                <MapPinned className="size-6" />
            </span>
            <p className="text-sm font-medium text-slate-700">
                Map preview unavailable
            </p>
            <p className="max-w-xs text-sm text-slate-500">
                A Google Maps API key isn&apos;t configured, so the interactive
                map can&apos;t be shown. The lead list and AI analysis remain
                fully available.
            </p>
        </div>
    );
}

/**
 * Flat roadmap of the lead results. Each lead is an {@link AdvancedMarker};
 * the selected one is emphasized with a larger emerald pin. Clicking a marker
 * lifts the selection up to the page. Falls back to a placeholder when no API
 * key is configured.
 */
export function LeadsMap({
    config,
    leads,
    selectedPlaceId,
    onSelect,
    className,
}: LeadsMapProps) {
    const [failed, setFailed] = React.useState(false);

    const center = React.useMemo(() => averageCenter(leads), [leads]);

    if (!config.apiKey || failed) {
        return <MapPlaceholder className={className} />;
    }

    return (
        <div className={cn('h-full w-full', className)}>
            <APIProvider apiKey={config.apiKey} onError={() => setFailed(true)}>
                <Map
                    mapId={config.mapId ?? undefined}
                    className="h-full w-full"
                    defaultZoom={12}
                    defaultCenter={center}
                    gestureHandling="greedy"
                    clickableIcons={false}
                    reuseMaps
                >
                    {leads.map((lead) => {
                        const selected = lead.placeId === selectedPlaceId;

                        return (
                            <AdvancedMarker
                                key={lead.placeId}
                                position={{ lat: lead.lat, lng: lead.lng }}
                                title={lead.name}
                                zIndex={selected ? 10 : 1}
                                onClick={() => onSelect(lead.placeId)}
                            >
                                <Pin
                                    background={
                                        selected ? '#0d9488' : '#10b981'
                                    }
                                    borderColor={
                                        selected ? '#0f766e' : '#059669'
                                    }
                                    glyphColor="#ffffff"
                                    scale={selected ? 1.4 : 1}
                                />
                            </AdvancedMarker>
                        );
                    })}

                    <MapController
                        leads={leads}
                        selectedPlaceId={selectedPlaceId}
                    />
                </Map>
            </APIProvider>
        </div>
    );
}
