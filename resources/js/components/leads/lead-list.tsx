import { ExternalLink, Globe, MapPin, Phone, Star } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types/leads';

/** Title-cases a raw Google Places type like `coffee_shop` into `Coffee Shop`. */
export function formatType(type: string): string {
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/** Stops a click on an inner link/button from also selecting the card. */
function stop(event: React.MouseEvent) {
    event.stopPropagation();
}

type IconLinkProps = {
    href: string;
    label: string;
    external?: boolean;
    children: React.ReactNode;
};

function IconLink({ href, label, external, children }: IconLinkProps) {
    return (
        <a
            href={href}
            aria-label={label}
            title={label}
            onClick={stop}
            {...(external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
        >
            {children}
        </a>
    );
}

function RatingBadge({
    rating,
    reviewCount,
}: {
    rating: number | null;
    reviewCount: number | null;
}) {
    if (rating == null) {
        return (
            <Badge
                variant="outline"
                className="border-slate-200 text-slate-400"
            >
                No rating
            </Badge>
        );
    }

    return (
        <Badge className="gap-1 border-transparent bg-amber-50 text-amber-700">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            {reviewCount != null ? (
                <span className="font-normal text-amber-600/80">
                    ({reviewCount.toLocaleString()})
                </span>
            ) : null}
        </Badge>
    );
}

type LeadCardProps = {
    lead: Lead;
    selected: boolean;
    onSelect: (placeId: string) => void;
};

export function LeadCard({ lead, selected, onSelect }: LeadCardProps) {
    const category = lead.types[0] ? formatType(lead.types[0]) : null;
    const closed = lead.businessStatus === 'CLOSED_PERMANENTLY';

    return (
        <button
            type="button"
            onClick={() => onSelect(lead.placeId)}
            aria-pressed={selected}
            className={cn(
                'group w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md',
                selected
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                    : 'border-slate-200 hover:border-emerald-200',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">
                        {lead.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <RatingBadge
                            rating={lead.rating}
                            reviewCount={lead.reviewCount}
                        />
                        {category ? (
                            <Badge
                                variant="outline"
                                className="border-slate-200 font-normal text-slate-500"
                            >
                                {category}
                            </Badge>
                        ) : null}
                        {closed ? (
                            <Badge
                                variant="outline"
                                className="border-rose-200 bg-rose-50 font-normal text-rose-600"
                            >
                                Permanently closed
                            </Badge>
                        ) : null}
                    </div>
                </div>
            </div>

            {lead.address ? (
                <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-500">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{lead.address}</span>
                </p>
            ) : null}

            {lead.phone || lead.website || lead.googleMapsUri ? (
                <div className="mt-3 flex items-center gap-2">
                    {lead.phone ? (
                        <IconLink
                            href={`tel:${lead.phone}`}
                            label={`Call ${lead.name}`}
                        >
                            <Phone className="size-4" />
                        </IconLink>
                    ) : null}
                    {lead.website ? (
                        <IconLink
                            href={lead.website}
                            label={`Visit ${lead.name} website`}
                            external
                        >
                            <Globe className="size-4" />
                        </IconLink>
                    ) : null}
                    {lead.googleMapsUri ? (
                        <IconLink
                            href={lead.googleMapsUri}
                            label={`Open ${lead.name} on Google Maps`}
                            external
                        >
                            <ExternalLink className="size-4" />
                        </IconLink>
                    ) : null}
                </div>
            ) : null}
        </button>
    );
}

type LeadListProps = {
    leads: Lead[];
    selectedPlaceId: string | null;
    onSelect: (placeId: string) => void;
    className?: string;
};

export function LeadList({
    leads,
    selectedPlaceId,
    onSelect,
    className,
}: LeadListProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {leads.map((lead) => (
                <LeadCard
                    key={lead.placeId}
                    lead={lead}
                    selected={lead.placeId === selectedPlaceId}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}
