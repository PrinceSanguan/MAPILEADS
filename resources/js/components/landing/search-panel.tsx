import { router } from '@inertiajs/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import leads from '@/routes/leads';
import { BusinessTypesField } from './business-types-field';
import { DataVolumeSlider } from './data-volume-slider';
import { GradientCard } from './gradient-card';
import { EMPTY_SEARCH_AREA, SearchAreaFields } from './search-area-fields';
import type { SearchArea } from './search-area-fields';
import { SectionLabel } from './section-label';

function Section({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-2">
            <SectionLabel>{label}</SectionLabel>
            {children}
        </section>
    );
}

export function SearchPanel() {
    const [types, setTypes] = React.useState<string[]>([
        'Restaurants',
        'Cafes',
    ]);
    const [area, setArea] = React.useState<SearchArea>(EMPTY_SEARCH_AREA);
    const [volume, setVolume] = React.useState(10);
    const [loading, setLoading] = React.useState(false);

    const handleSearch = () => {
        router.get(
            leads.index.url(),
            {
                types: types.map((type) => type.trim()).filter(Boolean),
                country: area.country,
                region: area.region,
                province: area.province,
                city: area.city,
                volume,
            },
            {
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <div className="space-y-5">
            <Section label="Business types">
                <GradientCard innerClassName="p-4">
                    <BusinessTypesField values={types} onChange={setTypes} />
                </GradientCard>
            </Section>

            <Section label="Search area">
                <GradientCard innerClassName="p-4">
                    <SearchAreaFields value={area} onChange={setArea} />
                </GradientCard>
            </Section>

            <DataVolumeSlider value={volume} onChange={setVolume} />

            <Button
                type="button"
                variant="gradient"
                className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg shadow-emerald-500/20"
                onClick={handleSearch}
                disabled={loading}
            >
                {loading ? (
                    <>
                        Finding businesses…
                        <Loader2 className="animate-spin" />
                    </>
                ) : (
                    <>
                        Access businesses
                        <ArrowRight />
                    </>
                )}
            </Button>
        </div>
    );
}
