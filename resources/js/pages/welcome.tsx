import { Head, usePage } from '@inertiajs/react';

import { BrandHeader } from '@/components/landing/brand-header';
import { GlobePanel } from '@/components/landing/globe-panel';
import { SearchPanel } from '@/components/landing/search-panel';

export default function Welcome() {
    const { googleMaps } = usePage().props;

    return (
        <>
            <Head title="Find local businesses">
                <meta
                    name="description"
                    content="Search local businesses like you do on Google Maps and export qualified leads — explore the world from a navigable 3D globe."
                />
            </Head>

            <div className="flex min-h-screen w-full flex-col bg-white lg:h-screen lg:flex-row lg:overflow-hidden">
                {/* Left — control panel. `landing-light-surface` pins light theme tokens
                    so the panel stays light even when the global appearance is dark. */}
                <div className="landing-light-surface flex w-full flex-col bg-white text-slate-900 lg:h-screen lg:w-[42%] lg:max-w-[560px] lg:border-r lg:border-slate-200">
                    <div className="px-6 pt-6 lg:px-8">
                        <BrandHeader />
                    </div>
                    <div className="flex-1 px-6 py-6 lg:overflow-y-auto lg:px-8">
                        <SearchPanel />
                    </div>
                </div>

                {/* Right — navigable globe */}
                <div className="relative h-[58vh] w-full lg:h-screen lg:flex-1">
                    <GlobePanel config={googleMaps} />
                </div>
            </div>
        </>
    );
}
