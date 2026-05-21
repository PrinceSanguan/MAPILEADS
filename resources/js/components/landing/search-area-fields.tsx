import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type SearchArea = {
    country: string;
    region: string;
    province: string;
    city: string;
    custom: string;
};

export const EMPTY_SEARCH_AREA: SearchArea = {
    country: 'United States',
    region: '',
    province: '',
    city: '',
    custom: '',
};

const COUNTRIES = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Philippines',
    'Germany',
    'France',
];
const REGIONS = ['Northeast', 'Midwest', 'South', 'West'];
const PROVINCES = [
    'Entire region',
    'California',
    'Texas',
    'New York',
    'Florida',
];
const CITIES = ['All', 'Los Angeles', 'Houston', 'New York City', 'Miami'];

type SelectFieldProps = {
    label: string;
    placeholder: string;
    value: string;
    options: string[];
    onValueChange: (value: string) => void;
};

function SelectField({
    label,
    placeholder,
    value,
    options,
    onValueChange,
}: SelectFieldProps) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">
                {label}
            </Label>
            <Select value={value || undefined} onValueChange={onValueChange}>
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-slate-700">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

type SearchAreaFieldsProps = {
    value: SearchArea;
    onChange: (next: SearchArea) => void;
    onClear: () => void;
};

export function SearchAreaFields({
    value,
    onChange,
    onClear,
}: SearchAreaFieldsProps) {
    const patch = (partial: Partial<SearchArea>) =>
        onChange({ ...value, ...partial });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <SelectField
                    label="Country"
                    placeholder="Select country"
                    value={value.country}
                    options={COUNTRIES}
                    onValueChange={(country) => patch({ country })}
                />
                <SelectField
                    label="Region"
                    placeholder="Select region"
                    value={value.region}
                    options={REGIONS}
                    onValueChange={(region) => patch({ region })}
                />
                <SelectField
                    label="Province"
                    placeholder="Entire region"
                    value={value.province}
                    options={PROVINCES}
                    onValueChange={(province) => patch({ province })}
                />
                <SelectField
                    label="City"
                    placeholder="All"
                    value={value.city}
                    options={CITIES}
                    onValueChange={(city) => patch({ city })}
                />
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-500">
                        Custom area
                    </Label>
                    <Button
                        type="button"
                        variant="link"
                        onClick={onClear}
                        className="h-auto p-0 text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                        Clear all
                    </Button>
                </div>
                <Input
                    value={value.custom}
                    onChange={(event) => patch({ custom: event.target.value })}
                    placeholder="Draw or paste a custom area"
                    className="h-10 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                />
            </div>
        </div>
    );
}
