import { Slider } from '@/components/ui/slider';

type DataVolumeSliderProps = {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
};

export function DataVolumeSlider({
    value,
    onChange,
    min = 10,
    max = 60,
    step = 5,
}: DataVolumeSliderProps) {
    return (
        <div className="flex items-center gap-4">
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={(next) => onChange(next[0] ?? min)}
                aria-label="Number of businesses"
                className="flex-1 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-teal-500 [&_[data-slot=slider-range]]:to-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
            />
            <span className="min-w-10 text-right text-sm font-semibold text-slate-900 tabular-nums">
                {value}
            </span>
        </div>
    );
}
