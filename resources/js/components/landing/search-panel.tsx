import { ArrowRight } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { BusinessTypesField } from './business-types-field';
import { DataVolumeSlider } from './data-volume-slider';
import { GradientCard } from './gradient-card';
import { QualifiedDataSection } from './qualified-data-section';
import type { QualifiedDataId } from './qualified-data-section';
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
    const [qualified, setQualified] = React.useState<
        Record<QualifiedDataId, boolean>
    >({
        business: true,
        enriched: false,
        reviews: false,
    });
    const [volume, setVolume] = React.useState(10);

    return (
        <div className="space-y-5">
            <Section label="Business types">
                <GradientCard innerClassName="p-4">
                    <BusinessTypesField values={types} onChange={setTypes} />
                </GradientCard>
            </Section>

            <Section label="Search area">
                <GradientCard innerClassName="p-4">
                    <SearchAreaFields
                        value={area}
                        onChange={setArea}
                        onClear={() => setArea(EMPTY_SEARCH_AREA)}
                    />
                </GradientCard>
            </Section>

            <Section label="Qualified data">
                <GradientCard innerClassName="p-3">
                    <QualifiedDataSection
                        selected={qualified}
                        onToggle={(id, checked) =>
                            setQualified((prev) => ({ ...prev, [id]: checked }))
                        }
                    />
                </GradientCard>
            </Section>

            <DataVolumeSlider value={volume} onChange={setVolume} />

            <Button
                type="button"
                variant="gradient"
                className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg shadow-emerald-500/20"
            >
                Access businesses
                <ArrowRight />
            </Button>
        </div>
    );
}
