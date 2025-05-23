import React, { useEffect, useRef, useState } from 'react';
import { Palette, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import type { Theme, CanvasSize } from '../types';

interface HeaderProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    presetSizes: CanvasSize[];
    onSizeChange: (width: number, height: number) => void;
    currentWidth: number;
    currentHeight: number;
    showLeftSidebar: boolean;
    setShowLeftSidebar: (show: boolean) => void;
    showRightSidebar: boolean;
    setShowRightSidebar: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
    theme,
    setTheme,
    presetSizes,
    onSizeChange,
    currentWidth,
    currentHeight,
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar
}) => {
    const [showSizeMenu, setShowSizeMenu] = useState(false);
    const sizeMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sizeMenuRef.current && !sizeMenuRef.current.contains(event.target as Node)) {
                setShowSizeMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return 'bg-white border-gray-200';
            case 'blue':
                return 'bg-blue-900 border-blue-800';
            default:
                return 'bg-gray-900 border-gray-700';
        }
    };

    const handleThemeChange = () => {
        const themes: Theme[] = ['light', 'dark', 'blue'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    return (
        <header className={`p-4 flex items-center justify-between border-b ${getThemeClasses()}`}>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                    className={`p-2 rounded-lg transition-colors ${theme === 'light'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <Palette className="text-blue-500" size={24} />
                    <h1 className="text-xl font-bold">Photster</h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleThemeChange}
                    className={`p-2 rounded-lg transition-colors ${theme === 'light'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                >
                    {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowSizeMenu(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'light'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <span className="text-sm">{currentWidth} × {currentHeight}</span>
                        <ChevronDown size={16} />
                    </button>

                    {showSizeMenu && (
                        <div
                            ref={sizeMenuRef}
                            className={`absolute top-full right-0 mt-2 w-72 p-2 rounded-xl border shadow-xl z-50 ${theme === 'light'
                                ? 'bg-white border-gray-200'
                                : 'bg-gray-800 border-gray-700'
                                }`}
                        >
                            <div className="space-y-1">
                                {presetSizes.map((size, index) => (
                                    <button
                                        key={index}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${theme === 'light'
                                            ? 'hover:bg-gray-100'
                                            : 'hover:bg-gray-700'
                                            }`}
                                        onClick={() => {
                                            onSizeChange(size.width, size.height);
                                            setShowSizeMenu(false);
                                        }}
                                    >
                                        <div className="font-medium">{size.label}</div>
                                        <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                                            }`}>
                                            {size.width} × {size.height}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setShowRightSidebar(!showRightSidebar)}
                    className={`p-2 rounded-lg transition-colors ${theme === 'light'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                >
                    <Menu size={20} />
                </button>
            </div>
        </header>
    );
}

export default Header