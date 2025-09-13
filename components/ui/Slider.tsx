
import React from 'react';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: number[];
    onValueChange?: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, onValueChange, ...props }, ref) => {
        const internalValue = value ? value[0] : 0;
        const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange?.([Number(event.target.value)]);
        };

        return (
            <div className="relative flex items-center w-full">
                <input
                    type="range"
                    ref={ref}
                    value={internalValue}
                    onChange={handleValueChange}
                    className={`
                        w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:bg-primary
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:transition-all
                        [&::-webkit-slider-thumb]:focus-visible:ring-2
                        [&::-webkit-slider-thumb]:focus-visible:ring-ring
                        [&::-webkit-slider-thumb]:focus-visible:ring-offset-2
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:bg-primary
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:border-none
                        [&::-moz-range-thumb]:transition-all
                        ${className}
                    `}
                    {...props}
                />
            </div>
        );
    }
);
Slider.displayName = 'Slider';

export { Slider };
