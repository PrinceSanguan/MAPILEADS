import { Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type QualifiedDataRowProps = {
    title: string;
    description: string;
    badge: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
};

export function QualifiedDataRow({
    title,
    description,
    badge,
    checked,
    onCheckedChange,
}: QualifiedDataRowProps) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onCheckedChange(!checked)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onCheckedChange(!checked);
                }
            }}
            className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                checked
                    ? 'border-teal-300 bg-teal-50/60'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
        >
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                        {title}
                    </span>
                    <Badge className="gap-1 border-transparent bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                        <Check className="size-3" />
                        {badge}
                    </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            </div>

            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                onClick={(event) => event.stopPropagation()}
                aria-label={title}
                className="mt-0.5 data-[state=checked]:bg-teal-500"
            />
        </div>
    );
}
