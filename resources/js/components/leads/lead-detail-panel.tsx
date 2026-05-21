import {
    AlertCircle,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Globe,
    Lightbulb,
    Mail,
    MapPin,
    Phone,
    Sparkles,
    Star,
    TriangleAlert,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { postJson } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import leadRoutes from '@/routes/leads';
import type { Lead, LeadAnalysis } from '@/types/leads';
import { formatType } from './lead-list';

const TONES = ['Professional', 'Friendly', 'Casual', 'Direct'] as const;
type Tone = (typeof TONES)[number];

type AnalysisStatus = 'idle' | 'loading' | 'error';

type AnalysisState = {
    status: AnalysisStatus;
    data: LeadAnalysis | null;
    error: string | null;
};

const INITIAL_STATE: AnalysisState = {
    status: 'idle',
    data: null,
    error: null,
};

function ContactRow({
    icon: Icon,
    children,
}: {
    icon: typeof Phone;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2.5 text-sm text-slate-600">
            <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function InsightSection({
    title,
    icon: Icon,
    items,
    accent,
}: {
    title: string;
    icon: typeof CheckCircle2;
    items: string[];
    accent: string;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Icon className={cn('size-4', accent)} />
                {title}
            </h4>
            <ul className="mt-2 space-y-1.5">
                {items.map((item, index) => (
                    <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-600"
                    >
                        <span
                            className={cn(
                                'mt-1.5 size-1.5 shrink-0 rounded-full',
                                accent.replace('text-', 'bg-'),
                            )}
                        />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function CopyButton({
    value,
    label,
    variant = 'outline',
}: {
    value: string;
    label: string;
    variant?: 'outline' | 'gradient';
}) {
    const [copied, setCopied] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        },
        [],
    );

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);

            if (timer.current) {
                clearTimeout(timer.current);
            }

            timer.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard may be unavailable (insecure context); silently ignore.
        }
    };

    return (
        <Button
            type="button"
            size="sm"
            variant={variant}
            onClick={onCopy}
            className={cn(variant === 'outline' && 'border-slate-200')}
        >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied!' : label}
        </Button>
    );
}

function EmailCard({ email }: { email: LeadAnalysis['email'] }) {
    const full = `Subject: ${email.subject}\n\n${email.body}`;

    return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Mail className="size-4" />
                Cold email
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Subject
                </p>
                <p className="mt-1 font-medium text-slate-900">
                    {email.subject}
                </p>

                <Separator className="my-3" />

                <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Body
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">
                    {email.body}
                </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton
                    value={full}
                    label="Copy email"
                    variant="gradient"
                />
                <CopyButton value={email.body} label="Copy body only" />
            </div>
        </div>
    );
}

type LeadDetailPanelProps = {
    lead: Lead;
    className?: string;
};

/**
 * Full details for a selected lead plus an on-demand AI analysis (strengths,
 * pain points, review insights and a cold email). Analysis state is keyed per
 * lead so switching selection resets the view; in-flight requests are guarded
 * to survive React StrictMode's double-invoked handlers.
 */
export function LeadDetailPanel({ lead, className }: LeadDetailPanelProps) {
    // The parent remounts this panel via `key={lead.placeId}` on selection
    // change, so all state below resets naturally — no reset effect needed.
    const [tone, setTone] = React.useState<Tone>('Professional');
    const [state, setState] = React.useState<AnalysisState>(INITIAL_STATE);
    const inFlight = React.useRef(false);

    const category = lead.types[0] ? formatType(lead.types[0]) : null;

    const analyze = async () => {
        if (inFlight.current) {
            return;
        }

        inFlight.current = true;
        setState({ status: 'loading', data: null, error: null });

        try {
            const data = await postJson<LeadAnalysis>(
                leadRoutes.analyze.url({ placeId: lead.placeId }),
                {
                    name: lead.name,
                    address: lead.address,
                    website: lead.website,
                    phone: lead.phone,
                    rating: lead.rating,
                    reviewCount: lead.reviewCount,
                    types: lead.types,
                    reviews: lead.reviews ?? [],
                    tone,
                },
            );

            setState({ status: 'idle', data, error: null });
        } catch (error) {
            setState({
                status: 'error',
                data: null,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Something went wrong. Please try again.',
            });
        } finally {
            inFlight.current = false;
        }
    };

    const loading = state.status === 'loading';

    return (
        <div className={cn('flex flex-col gap-6 lg:flex-row', className)}>
            {/* Left — identity & contact */}
            <div className="lg:w-[38%] lg:shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                    {lead.rating != null ? (
                        <Badge className="gap-1 border-transparent bg-amber-50 text-amber-700">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">
                                {lead.rating.toFixed(1)}
                            </span>
                            {lead.reviewCount != null ? (
                                <span className="font-normal text-amber-600/80">
                                    ({lead.reviewCount.toLocaleString()})
                                </span>
                            ) : null}
                        </Badge>
                    ) : null}
                    {category ? (
                        <Badge
                            variant="outline"
                            className="border-slate-200 font-normal text-slate-500"
                        >
                            {category}
                        </Badge>
                    ) : null}
                    {lead.openNow != null ? (
                        <Badge
                            variant="outline"
                            className={cn(
                                'gap-1 font-normal',
                                lead.openNow
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-500',
                            )}
                        >
                            <Clock className="size-3" />
                            {lead.openNow ? 'Open now' : 'Closed'}
                        </Badge>
                    ) : null}
                </div>

                <h2 className="mt-3 text-xl font-bold text-slate-900">
                    {lead.name}
                </h2>

                <div className="mt-4 space-y-3">
                    {lead.address ? (
                        <ContactRow icon={MapPin}>{lead.address}</ContactRow>
                    ) : null}
                    {lead.phone ? (
                        <ContactRow icon={Phone}>
                            <a
                                href={`tel:${lead.phone}`}
                                className="hover:text-emerald-600"
                            >
                                {lead.phone}
                            </a>
                        </ContactRow>
                    ) : null}
                    {lead.website ? (
                        <ContactRow icon={Globe}>
                            <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all hover:text-emerald-600"
                            >
                                {lead.website}
                            </a>
                        </ContactRow>
                    ) : null}
                    {lead.googleMapsUri ? (
                        <ContactRow icon={ExternalLink}>
                            <a
                                href={lead.googleMapsUri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-emerald-600"
                            >
                                View on Google Maps
                            </a>
                        </ContactRow>
                    ) : null}
                </div>

                {lead.reviews && lead.reviews.length > 0 ? (
                    <div className="mt-6">
                        <h4 className="text-sm font-semibold text-slate-900">
                            Recent reviews
                        </h4>
                        <div className="mt-3 space-y-3">
                            {lead.reviews.map((review, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-slate-200 bg-white p-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-sm font-medium text-slate-700">
                                            {review.author}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600">
                                            <Star className="size-3 fill-amber-400 text-amber-400" />
                                            {review.rating}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-sm text-slate-600">
                                        {review.text}
                                    </p>
                                    {review.time ? (
                                        <p className="mt-1.5 text-xs text-slate-400">
                                            {review.time}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Right — AI analysis */}
            <div className="min-w-0 flex-1">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                                <Sparkles className="size-4" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    AI sales analysis
                                </p>
                                <p className="text-xs text-slate-500">
                                    Insights and a ready-to-send cold email
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={tone}
                                onValueChange={(value) =>
                                    setTone(value as Tone)
                                }
                                disabled={loading}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="w-[140px] border-slate-200 bg-white"
                                    aria-label="Email tone"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TONES.map((option) => (
                                        <SelectItem
                                            key={option}
                                            value={option}
                                        >
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                type="button"
                                variant="gradient"
                                size="sm"
                                onClick={analyze}
                                disabled={loading}
                                className="shadow-sm shadow-emerald-500/20"
                            >
                                {loading ? (
                                    <Spinner className="size-4" />
                                ) : (
                                    <Sparkles className="size-4" />
                                )}
                                {loading
                                    ? 'Analyzing…'
                                    : state.data
                                      ? 'Re-analyze'
                                      : 'Analyze with AI'}
                            </Button>
                        </div>
                    </div>

                    {state.status === 'error' ? (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            <span>{state.error}</span>
                        </div>
                    ) : null}

                    {loading ? (
                        <p className="mt-4 text-sm text-slate-500">
                            Reviewing this business&apos;s profile and reviews to
                            craft tailored outreach…
                        </p>
                    ) : null}

                    {!loading && !state.data && state.status !== 'error' ? (
                        <p className="mt-4 text-sm text-slate-500">
                            Generate strengths, likely pain points, review
                            insights and a personalized cold email for this
                            business.
                        </p>
                    ) : null}

                    {state.data ? (
                        <div className="mt-5 space-y-5">
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                <InsightSection
                                    title="Strengths"
                                    icon={CheckCircle2}
                                    items={state.data.strengths}
                                    accent="text-emerald-500"
                                />
                                <InsightSection
                                    title="Pain points"
                                    icon={TriangleAlert}
                                    items={state.data.painPoints}
                                    accent="text-amber-500"
                                />
                                <InsightSection
                                    title="Review insights"
                                    icon={Lightbulb}
                                    items={state.data.reviewInsights}
                                    accent="text-sky-500"
                                />
                            </div>

                            <EmailCard email={state.data.email} />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
