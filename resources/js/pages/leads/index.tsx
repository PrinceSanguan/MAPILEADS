import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, Download, Globe2, Plus, SearchX } from 'lucide-react';
import * as React from 'react';

import { LeadDetailPanel } from '@/components/leads/lead-detail-panel';
import { LeadList, formatType } from '@/components/leads/lead-list';
import { LeadsMap } from '@/components/leads/leads-map';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Lead, LeadFilters } from '@/types/leads';

interface LeadsPageProps {
    filters: LeadFilters;
    leads: Lead[];
    error: string | null;
}

/** Escapes a single CSV field, quoting it when it contains a comma, quote or newline. */
function csvCell(value: string | number | null | undefined): string {
    const text = value == null ? '' : String(value);

    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
}

/** Builds a CSV from the leads and triggers a client-side download. */
function exportLeadsCsv(leads: Lead[]) {
    const header = [
        'Name',
        'Category',
        'Address',
        'Phone',
        'Website',
        'Rating',
        'Reviews',
        'Google Maps URL',
    ];

    const rows = leads.map((lead) =>
        [
            lead.name,
            lead.types[0] ? formatType(lead.types[0]) : '',
            lead.address ?? '',
            lead.phone ?? '',
            lead.website ?? '',
            lead.rating ?? '',
            lead.reviewCount ?? '',
            lead.googleMapsUri ?? '',
        ]
            .map(csvCell)
            .join(','),
    );

    const csv = [header.map(csvCell).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'leads.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/** A human-readable summary of where the search was run. */
function buildLocationLabel(filters: LeadFilters): string {
    const parts = [
        filters.city,
        filters.province,
        filters.region,
        filters.country,
    ].filter((part): part is string => Boolean(part && part.trim()));

    if (parts.length > 0) {
        return parts.join(', ');
    }

    return 'your selected area';
}

function NewSearchLink({ className }: { className?: string }) {
    return (
        <Button
            asChild
            variant="outline"
            size="sm"
            className={cn('border-slate-200 bg-white text-slate-700', className)}
        >
            <Link href="/">
                <Plus className="size-4" />
                New search
            </Link>
        </Button>
    );
}

export default function LeadsIndex({ filters, leads, error }: LeadsPageProps) {
    const { googleMaps } = usePage().props;

    const [selectedPlaceId, setSelectedPlaceId] = React.useState<string | null>(
        () => leads[0]?.placeId ?? null,
    );

    const selectedLead = React.useMemo(
        () => leads.find((lead) => lead.placeId === selectedPlaceId) ?? null,
        [leads, selectedPlaceId],
    );

    const typesLabel =
        filters.types.length > 0 ? filters.types.join(', ') : 'businesses';
    const locationLabel = buildLocationLabel(filters);
    const hasResults = leads.length > 0;

    return (
        <div className="landing-light-surface flex min-h-screen flex-col bg-slate-50 text-slate-900">
            <Head title="Lead results" />

            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href="/"
                            className="flex shrink-0 items-center gap-2"
                        >
                            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                                <Globe2 className="size-5" />
                            </span>
                            <span className="text-lg font-semibold tracking-tight text-slate-900">
                                Choros
                                <span className="text-teal-600">Leads</span>
                            </span>
                        </Link>

                        <span className="hidden h-6 w-px bg-slate-200 sm:block" />

                        <p className="hidden truncate text-sm text-slate-500 sm:block">
                            Showing{' '}
                            <span className="font-semibold text-slate-700">
                                {leads.length}
                            </span>{' '}
                            <span className="text-slate-700">{typesLabel}</span>{' '}
                            in{' '}
                            <span className="font-medium text-slate-700">
                                {locationLabel}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => exportLeadsCsv(leads)}
                            disabled={!hasResults}
                            className="border-slate-200 bg-white text-slate-700"
                        >
                            <Download className="size-4" />
                            Export CSV
                        </Button>
                        <NewSearchLink />
                    </div>
                </div>
            </header>

            {/* Error banner */}
            {error ? (
                <div className="px-4 pt-4 sm:px-6">
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-amber-900">
                                We couldn&apos;t complete this search
                            </p>
                            <p className="mt-0.5 text-sm text-amber-800">
                                {error}
                            </p>
                        </div>
                        <NewSearchLink className="shrink-0" />
                    </div>
                </div>
            ) : null}

            {/* Body */}
            {hasResults ? (
                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6">
                    <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                        {/* Lead list */}
                        <div className="order-2 lg:order-1">
                            <div className="lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
                                <LeadList
                                    leads={leads}
                                    selectedPlaceId={selectedPlaceId}
                                    onSelect={setSelectedPlaceId}
                                />
                            </div>
                        </div>

                        {/* Map */}
                        <div className="order-1 lg:order-2">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm lg:sticky lg:top-[5.5rem]">
                                <div className="h-[300px] w-full sm:h-[380px] lg:h-[calc(100vh-9rem)]">
                                    <LeadsMap
                                        config={googleMaps}
                                        leads={leads}
                                        selectedPlaceId={selectedPlaceId}
                                        onSelect={setSelectedPlaceId}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detail panel */}
                    {selectedLead ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <LeadDetailPanel
                                key={selectedLead.placeId}
                                lead={selectedLead}
                            />
                        </section>
                    ) : null}
                </main>
            ) : !error ? (
                <main className="flex flex-1 items-center justify-center p-6">
                    <div className="flex max-w-md flex-col items-center text-center">
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <SearchX className="size-7" />
                        </span>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">
                            No businesses found
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            We couldn&apos;t find any {typesLabel} in{' '}
                            {locationLabel}. Try a broader search area or
                            different business types.
                        </p>
                        <NewSearchLink className="mt-5" />
                    </div>
                </main>
            ) : null}
        </div>
    );
}
