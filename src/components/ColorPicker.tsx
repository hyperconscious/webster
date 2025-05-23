import React, { useState } from 'react';
import type { Theme } from '../types';

interface ColorPickerProps {
    currentColor: string;
    onColorChange: (color: string) => void;
    theme: Theme;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange, theme }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [recentColors, setRecentColors] = useState<string[]>([
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
    ]);

    const handleColorChange = (color: string) => {
        onColorChange(color);

        if (!recentColors.includes(color)) {
            setRecentColors(prev => {
                const newColors = [color, ...prev];
                if (newColors.length > 8)
                    newColors.slice(0, 8);
                return newColors;
            });
        }
    };

    const toggleColorPicker = () => {
        setShowPicker(prev => !prev);
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return 'bg-white border-gray-200 shadow-lg';
            case 'blue':
                return 'bg-blue-900 border-blue-800 shadow-blue-900/50';
            default:
                return 'bg-gray-800 border-gray-700 shadow-black/50';
        }
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-xl border-2 border-gray-600 cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: currentColor }}
                    onClick={toggleColorPicker}
                />
                <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-0 h-0 opacity-0 absolute"
                    id="color-picker"
                />
                <label
                    htmlFor="color-picker"
                    className="text-sm cursor-pointer hover:text-blue-500 transition-colors font-medium"
                >
                    {currentColor.toUpperCase()}
                </label>
            </div>

            {showPicker && (
                <div className={`absolute top-0 left-0 mt-2 p-4 rounded-xl border ${getThemeClasses()} z-10`}>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {recentColors.map((color, index) => (
                            <div
                                key={`${color}-${index}`}
                                className="w-8 h-8 rounded-lg cursor-pointer hover:scale-110 transition-transform border border-gray-600 shadow-lg"
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorChange(color)}
                            />
                        ))}
                    </div>
                    <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer"
                    />
                </div>
            )}
        </div>
    );
};

export default ColorPicker;