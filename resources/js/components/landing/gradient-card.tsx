import * as React from 'react';

import { cn } from '@/lib/utils';

type GradientCardProps = React.ComponentProps<'div'> & {
    /** Classes applied to the inner white surface (use for padding / layout). */
    innerClassName?: string;
};

/**
 * A white card wrapped in a soft lavender gradient hairline border + glow, matching
 * the reference design. The 1px outer padding creates the gradient "border".
 */
export function GradientCard({
    className,
    innerClassName,
    children,
    ...props
}: GradientCardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl bg-gradient-to-br from-violet-200/90 via-indigo-100/70 to-fuchsia-200/80 p-px shadow-[0_14px_36px_-18px_rgba(124,58,237,0.45)]',
                className,
            )}
            {...props}
        >
            <div className={cn('rounded-[15px] bg-white', innerClassName)}>
                {children}
            </div>
        </div>
    );
}
