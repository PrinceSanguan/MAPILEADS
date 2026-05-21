import {
    APILoadingStatus,
    APIProvider,
    ColorScheme,
    Map,
    RenderingType,
    useApiLoadingStatus,
    useMap,
} from '@vis.gl/react-google-maps';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { GlobeFallback } from './globe-fallback';
import { Starfield } from './starfield';

type GoogleGlobeProps = {
    apiKey: string;
    mapId?: string | null;
    autoRotate?: boolean;
    className?: string;
};

const SPACE_BACKGROUND = '#05060a';

// Reveal stars only in the space around the centered globe, not over the sphere.
const STAR_MASK =
    'radial-gradient(circle closest-side at 50% 50%, transparent 0 68%, #000 86%)';

/** Slowly pans the camera eastward so the globe appears to spin; pauses while the user drags. */
function GlobeSpin({ degreesPerSecond = 4 }: { degreesPerSecond?: number }) {
    const map = useMap();

    React.useEffect(() => {
        if (!map) {
            return;
        }

        let frame = 0;
        let paused = false;
        let last = performance.now();
        const container = map.getDiv();

        const pause = () => {
            paused = true;
        };
        const resume = () => {
            paused = false;
            last = performance.now();
        };

        container.addEventListener('pointerdown', pause);
        window.addEventListener('pointerup', resume);

        const step = (now: number) => {
            const delta = now - last;
            last = now;

            if (!paused) {
                const center = map.getCenter();

                if (center) {
                    let lng = center.lng() + (degreesPerSecond * delta) / 1000;

                    if (lng > 180) {
                        lng -= 360;
                    }

                    map.moveCamera({ center: { lat: center.lat(), lng } });
                }
            }

            frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(frame);
            container.removeEventListener('pointerdown', pause);
            window.removeEventListener('pointerup', resume);
        };
    }, [map, degreesPerSecond]);

    return null;
}

function GlobeView({
    mapId,
    autoRotate,
    className,
}: Omit<GoogleGlobeProps, 'apiKey'>) {
    const status = useApiLoadingStatus();

    if (
        status === APILoadingStatus.AUTH_FAILURE ||
        status === APILoadingStatus.FAILED
    ) {
        return <GlobeFallback className={className} />;
    }

    // A vector Map ID enables the cloud-styled 3D globe; without one we still force
    // vector rendering so the globe (rather than a flat raster map) is shown.
    const vectorProps = mapId
        ? { mapId }
        : { renderingType: RenderingType.VECTOR };

    return (
        <div className={cn('relative h-full w-full', className)}>
            <Map
                {...vectorProps}
                className="h-full w-full"
                defaultZoom={2.7}
                minZoom={2}
                defaultCenter={{ lat: 20, lng: 78 }}
                backgroundColor={SPACE_BACKGROUND}
                colorScheme={ColorScheme.LIGHT}
                gestureHandling="greedy"
                disableDefaultUI
                clickableIcons={false}
                keyboardShortcuts={false}
            >
                {autoRotate ? <GlobeSpin /> : null}
            </Map>

            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{ WebkitMaskImage: STAR_MASK, maskImage: STAR_MASK }}
            >
                <Starfield />
            </div>
        </div>
    );
}

/**
 * Navigable 3D Earth globe rendered with the Google Maps JavaScript API (vector map).
 * Falls back to {@link GlobeFallback} on authentication / load failure.
 */
export function GoogleGlobe({
    apiKey,
    mapId,
    autoRotate = true,
    className,
}: GoogleGlobeProps) {
    const [failed, setFailed] = React.useState(false);

    if (failed) {
        return <GlobeFallback className={className} />;
    }

    return (
        <APIProvider apiKey={apiKey} onError={() => setFailed(true)}>
            <GlobeView
                mapId={mapId}
                autoRotate={autoRotate}
                className={className}
            />
        </APIProvider>
    );
}
