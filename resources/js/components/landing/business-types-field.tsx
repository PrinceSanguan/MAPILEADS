import { Plus, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type BusinessTypesFieldProps = {
    values: string[];
    onChange: (next: string[]) => void;
};

export function BusinessTypesField({
    values,
    onChange,
}: BusinessTypesFieldProps) {
    const [draft, setDraft] = React.useState('');

    const add = () => {
        const value = draft.trim();

        if (!value || values.includes(value)) {
            setDraft('');

            return;
        }

        onChange([...values, value]);
        setDraft('');
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            add();
                        }
                    }}
                    placeholder="Search like you do on Google Maps"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400"
                />
                <Button
                    type="button"
                    variant="gradient"
                    onClick={add}
                    className="h-10 shrink-0 rounded-xl px-4"
                >
                    <Plus />
                    Add type
                </Button>
            </div>

            {values.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {values.map((type) => (
                        <Badge
                            key={type}
                            className="gap-1 rounded-full border-transparent bg-teal-50 py-1 pr-1 pl-3 text-xs font-medium text-teal-700"
                        >
                            {type}
                            <button
                                type="button"
                                aria-label={`Remove ${type}`}
                                onClick={() =>
                                    onChange(
                                        values.filter(
                                            (value) => value !== type,
                                        ),
                                    )
                                }
                                className="flex size-4 items-center justify-center rounded-full text-teal-600 transition-colors hover:bg-teal-100 hover:text-teal-800"
                            >
                                <X className="size-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
