import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    Globe2,
    Plus,
    SearchX,
    Trash2,
} from 'lucide-react';

import { formatType } from '@/components/leads/lead-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import searches from '@/routes/searches';
import type { SavedSearch } from '@/types/leads';

interface HistoryPageProps {
    searches: SavedSearch[];
}

/** Formats an ISO timestamp as e.g. "May 21, 2026". Falls back to the raw value. */
function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function NewSearchLink() {
    return (
        <Button
            asChild
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white text-slate-700"
        >
            <Link href="/">
                <Plus className="size-4" />
                New search
            </Link>
        </Button>
    );
}

function SearchCard({ search }: { search: SavedSearch }) {
    const visibleTypes = search.types.slice(0, 4);
    const extraTypes = search.types.length - visibleTypes.length;

    return (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 truncate text-base font-semibold text-slate-900">
                    {search.label}
                </h2>
                <Badge className="shrink-0 gap-1 border-transparent bg-emerald-50 text-emerald-700">
                    <Building2 className="size-3" />
                    {search.count.toLocaleString()}
                </Badge>
            </div>

            {visibleTypes.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {visibleTypes.map((type) => (
                        <Badge
                            key={type}
                            variant="outline"
                            className="border-slate-200 font-normal text-slate-500"
                        >
                            {formatType(type)}
                        </Badge>
                    ))}
                    {extraTypes > 0 ? (
                        <Badge
                            variant="outline"
                            className="border-slate-200 font-normal text-slate-400"
                        >
                            +{extraTypes}
                        </Badge>
                    ) : null}
                </div>
            ) : null}

            <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-400">
                <CalendarDays className="size-4" />
                {formatDate(search.createdAt)}
            </p>

            <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Button
                    asChild
                    variant="gradient"
                    size="sm"
                    className="shadow-sm shadow-emerald-500/20"
                >
                    <Link href={searches.show.url({ search: search.id })}>
                        Open
                        <ArrowRight className="size-4" />
                    </Link>
                </Button>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Trash2 className="size-4" />
                            Delete
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Delete this saved search?</DialogTitle>
                        <DialogDescription>
                            {search.label} and all{' '}
                            {search.count.toLocaleString()} of its captured
                            businesses will be permanently removed. This cannot
                            be undone.
                        </DialogDescription>
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    router.delete(
                                        searches.destroy.url({
                                            search: search.id,
                                        }),
                                    )
                                }
                            >
                                <Trash2 className="size-4" />
                                Delete search
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default function LeadsHistory({ searches: items }: HistoryPageProps) {
    const hasSearches = items.length > 0;

    return (
        <div className="landing-light-surface flex min-h-screen flex-col bg-slate-50 text-slate-900">
            <Head title="Saved searches" />

            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                            <Globe2 className="size-5" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-slate-900">
                            Choros
                            <span className="text-teal-600">Leads</span>
                        </span>
                    </Link>

                    <NewSearchLink />
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Saved searches
                    </h1>
                    <p className="text-sm text-slate-500">
                        Revisit the businesses you&apos;ve captured and pick up
                        outreach where you left off.
                    </p>
                </div>

                {hasSearches ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((search) => (
                            <SearchCard key={search.id} search={search} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-16 flex flex-col items-center text-center">
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <SearchX className="size-7" />
                        </span>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">
                            No saved searches yet
                        </h2>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            Run your first search to start building a list of
                            local businesses to reach out to.
                        </p>
                        <Button
                            asChild
                            variant="gradient"
                            className="mt-5 shadow-sm shadow-emerald-500/20"
                        >
                            <Link href="/">
                                <Plus className="size-4" />
                                Start a search
                            </Link>
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
