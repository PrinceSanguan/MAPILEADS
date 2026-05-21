import { Link, usePage } from '@inertiajs/react';
import { Bookmark, Globe2, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

export function BrandHeader() {
    const { auth } = usePage().props;
    const accountHref = auth.user ? dashboard() : login();

    return (
        <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                    <Globe2 className="size-5" />
                </span>
                <span className="text-lg font-semibold tracking-tight text-slate-900">
                    Mapi<span className="text-teal-600">leads</span>
                </span>
            </Link>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Saved searches"
                    className="size-9 rounded-full border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                    <Bookmark />
                </Button>
                <Button
                    asChild
                    variant="outline"
                    size="icon"
                    aria-label="Account"
                    className="size-9 rounded-full border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                    <Link href={accountHref}>
                        <UserRound />
                    </Link>
                </Button>
            </div>
        </header>
    );
}
