import * as React from 'react';

import { cn } from '@/lib/utils';
import { Starfield } from './starfield';

const OCEAN: React.CSSProperties = {
    background:
        'radial-gradient(circle at 34% 30%, #2b6cb0 0%, #1a4f86 38%, #0c3460 66%, #06203f 100%)',
};

const CONTINENTS: React.CSSProperties = {
    backgroundRepeat: 'no-repeat',
    backgroundImage: [
        'radial-gradient(46px 34px at 30% 34%, rgba(86,164,98,0.95), transparent 62%)',
        'radial-gradient(36px 52px at 44% 56%, rgba(74,150,86,0.9), transparent 62%)',
        'radial-gradient(60px 30px at 64% 30%, rgba(96,176,108,0.9), transparent 62%)',
        'radial-gradient(34px 30px at 70% 64%, rgba(80,158,92,0.85), transparent 62%)',
        'radial-gradient(26px 22px at 52% 22%, rgba(104,182,116,0.8), transparent 62%)',
        'radial-gradient(30px 26px at 22% 62%, rgba(72,150,86,0.8), transparent 62%)',
    ].join(','),
};

/**
 * Dependency-free animated globe used when no Google Maps API key / Map ID is
 * configured (or when the Maps script fails to authenticate). Reads as a stylized
 * Earth slowly spinning in space — no external assets or network required.
 */
export function GlobeFallback({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'relative flex h-full w-full items-center justify-center overflow-hidden',
                className,
            )}
        >
            <Starfield />

            <div className="relative aspect-square w-[78%] max-w-[560px]">
                {/* atmospheric glow */}
                <div
                    className="absolute -inset-8 rounded-full blur-2xl"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(56,189,248,0.28), transparent 70%)',
                    }}
                />

                {/* sphere */}
                <div
                    className="absolute inset-0 overflow-hidden rounded-full shadow-[0_0_70px_rgba(45,212,191,0.25),inset_0_0_60px_rgba(3,12,28,0.6)]"
                    style={OCEAN}
                >
                    {/* rotating landmasses */}
                    <div className="absolute top-1/2 left-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2">
                        <div
                            className="h-full w-full animate-[spin_70s_linear_infinite] motion-reduce:animate-none"
                            style={CONTINENTS}
                        />
                    </div>

                    {/* specular highlight */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.4), transparent 36%)',
                        }}
                    />

                    {/* terminator shading */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(circle at 72% 78%, rgba(0,0,0,0.55), transparent 58%)',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
