import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Tiled faint stars guarantee full coverage at any size; the box-shadow layers
 * below add brighter, irregularly-placed accent stars on top.
 */
const BASE_STAR_LAYER: React.CSSProperties = {
    backgroundImage: [
        'radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.7), transparent)',
        'radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.5), transparent)',
        'radial-gradient(1px 1px at 80px 160px, rgba(255,255,255,0.6), transparent)',
        'radial-gradient(1.5px 1.5px at 200px 210px, rgba(255,255,255,0.45), transparent)',
        'radial-gradient(1px 1px at 160px 50px, rgba(255,255,255,0.35), transparent)',
    ].join(','),
    backgroundSize: '240px 240px',
};

/** Deterministic pseudo-random in [0, 1) — pure, so it is stable across renders and SSR. */
function pseudoRandom(seed: number) {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;

    return value - Math.floor(value);
}

function useStarShadow(
    count: number,
    width: number,
    height: number,
    maxAlpha: number,
) {
    return React.useMemo(() => {
        const parts: string[] = [];

        for (let i = 0; i < count; i++) {
            const x = Math.floor(pseudoRandom(i * 3.1) * width);
            const y = Math.floor(pseudoRandom(i * 3.1 + 1) * height);
            const alpha = (
                pseudoRandom(i * 3.1 + 2) * maxAlpha * 0.7 +
                maxAlpha * 0.3
            ).toFixed(2);

            parts.push(`${x}px ${y}px rgba(255,255,255,${alpha})`);
        }

        return parts.join(',');
    }, [count, width, height, maxAlpha]);
}

export function Starfield({ className }: { className?: string }) {
    const fine = useStarShadow(140, 1600, 1100, 0.9);
    const bright = useStarShadow(28, 1600, 1100, 1);

    return (
        <div
            aria-hidden
            className={cn(
                'pointer-events-none absolute inset-0 overflow-hidden',
                className,
            )}
        >
            <div
                className="absolute inset-0 opacity-70"
                style={BASE_STAR_LAYER}
            />
            <div
                className="absolute top-0 left-0 h-px w-px rounded-full bg-white/80"
                style={{ boxShadow: fine }}
            />
            <div
                className="absolute top-0 left-0 h-[2px] w-[2px] rounded-full bg-white"
                style={{ boxShadow: bright }}
            />
        </div>
    );
}
