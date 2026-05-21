import * as React from 'react';

import { cn } from '@/lib/utils';

export function SectionLabel({
    className,
    children,
    ...props
}: React.ComponentProps<'p'>) {
    return (
        <p
            className={cn(
                'text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase',
                className,
            )}
            {...props}
        >
            {children}
        </p>
    );
}
