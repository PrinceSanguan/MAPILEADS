import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { COUNTRIES, LOCATIONS } from './location-data';

export type SearchArea = {
    country: string;
    region: string;
    province: string;
    city: string;
};

export const EMPTY_SEARCH_AREA: SearchArea = {
    country: 'United States',
    region: '',
    province: '',
    city: '',
};

type SelectFieldProps = {
    label: string;
    placeholder: string;
    value: string;
    options: string[];
    onValueChange: (value: string) => void;
    disabled?: boolean;
};

function SelectField({
    label,
    placeholder,
    value,
    options,
    onValueChange,
    disabled,
}: SelectFieldProps) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500">
                {label}
            </Label>
            <Select
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectTrigger
                    disabled={disabled}
                    className="h-10 w-full rounded-xl border-slate-200 bg-white text-slate-700"
                >
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
};

export function SearchAreaFields({ value, onChange }: SearchAreaFieldsProps) {
    const regions = Object.keys(LOCATIONS[value.country] ?? {});
    const provinces = Object.keys(LOCATIONS[value.country]?.[value.region] ?? {});
    const cities =
        LOCATIONS[value.country]?.[value.region]?.[value.province] ?? [];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <SelectField
                    label="Country"
                    placeholder="Select country"
                    value={value.country}
                    options={COUNTRIES}
                    onValueChange={(country) =>
                        onChange({
                            ...value,
                            country,
                            region: '',
                            province: '',
                            city: '',
                        })
                    }
                />
                <SelectField
                    label="Region"
                    placeholder="Select region"
                    value={value.region}
                    options={regions}
                    disabled={regions.length === 0}
                    onValueChange={(region) =>
                        onChange({
                            ...value,
                            region,
                            province: '',
                            city: '',
                        })
                    }
                />
                <SelectField
                    label="Province"
                    placeholder="Select province"
                    value={value.province}
                    options={provinces}
                    disabled={provinces.length === 0}
                    onValueChange={(province) =>
                        onChange({ ...value, province, city: '' })
                    }
                />
                <SelectField
                    label="City"
                    placeholder="Select city"
                    value={value.city}
                    options={cities}
                    disabled={cities.length === 0}
                    onValueChange={(city) => onChange({ ...value, city })}
                />
            </div>
        </div>
    );
}
