import { QualifiedDataRow } from './qualified-data-row';

export type QualifiedDataId = 'business' | 'enriched' | 'reviews';

const ITEMS: {
    id: QualifiedDataId;
    title: string;
    description: string;
}[] = [
    {
        id: 'business',
        title: 'Business data',
        description: 'Name, address, landline, website, hours...',
    },
    {
        id: 'enriched',
        title: 'Enriched data',
        description: 'Personal phone, social media, whatsapp...',
    },
    {
        id: 'reviews',
        title: 'Smart reviews',
        description: 'Customer reviews, owner responses and AI summary',
    },
];

type QualifiedDataSectionProps = {
    selected: Record<QualifiedDataId, boolean>;
    onToggle: (id: QualifiedDataId, checked: boolean) => void;
};

export function QualifiedDataSection({
    selected,
    onToggle,
}: QualifiedDataSectionProps) {
    return (
        <div className="space-y-2">
            {ITEMS.map((item) => (
                <QualifiedDataRow
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    checked={selected[item.id]}
                    onCheckedChange={(checked) => onToggle(item.id, checked)}
                />
            ))}
        </div>
    );
}
