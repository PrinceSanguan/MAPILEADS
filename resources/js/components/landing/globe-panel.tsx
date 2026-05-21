import { cn } from '@/lib/utils';
import type { GoogleMapsConfig } from '@/types/google-maps';
import { GlobeFallback } from './globe-fallback';
import { GoogleGlobe } from './google-globe';

type GlobePanelProps = {
    config: GoogleMapsConfig;
    className?: string;
};

/**
 * The dark, space-themed right column. Renders the live Google Maps globe when an
 * API key is available, otherwise the dependency-free fallback globe.
 */
export function GlobePanel({ config, className }: GlobePanelProps) {
    return (
        <section
            className={cn(
                'relative h-full w-full overflow-hidden bg-[#05060a]',
                className,
            )}
        >
            {config.apiKey ? (
                <GoogleGlobe
                    apiKey={config.apiKey}
                    mapId={config.mapId}
                    className="h-full w-full"
                />
            ) : (
                <GlobeFallback className="h-full w-full" />
            )}
        </section>
    );
}
