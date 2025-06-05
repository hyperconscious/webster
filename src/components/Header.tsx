import React, { useEffect, useRef, useState } from 'react';
import { Palette, Sun, Moon, ChevronDown, Cloud, Save, FolderOpen, File, History, BookDashed, UserRound, CornerDownLeft } from 'lucide-react';
import type { Theme, CanvasSize } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import ProjectService from '../services/ProjectService';
import { useUser } from '../hooks/useUser';
import AuthStore from '../store/AuthStore';

interface MenuItem {
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    divider?: boolean;
    onClick?: () => void;
}

interface HeaderProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    presetSizes: CanvasSize[];
    onSizeChange: (width: number, height: number) => void;
    currentWidth: number;
    currentHeight: number;
    projectSlug?: string;
    initialProjectName: string;
    onSaveProject?: () => void;
    setNewProjectName?: (name: string) => void;
    onAddTemplate?: () => void;
    setShowHistoryModal?: (show: boolean) => void;
    onExportPNG?: () => void;
    onExportJPEG?: () => void;
    onExportSVG?: () => void;
    onExportPDF?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    theme,
    setTheme,
    presetSizes,
    onSizeChange,
    currentWidth,
    currentHeight,
    projectSlug,
    initialProjectName,
    onSaveProject,
    setNewProjectName,
    onAddTemplate,
    setShowHistoryModal,
    onExportPNG,
    onExportJPEG,
    onExportSVG,
    onExportPDF
}) => {
    const [showSizeMenu, setShowSizeMenu] = useState(false);
    const navigate = useNavigate();
    const sizeMenuRef = useRef<HTMLDivElement>(null);
    const [projectName, setProjectName] = useState(initialProjectName || 'Untitled');
    const [editingName, setEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const isOpenRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();

    const menuItems: MenuItem[] = [
        { label: "Add this template", icon: <BookDashed size={16} />, onClick: () => onAddTemplate?.() },
        { label: "Save as...", icon: <Save size={16} />, shortcut: "Ctrl+Shift+S", onClick: () => onExportPNG?.() },
        { label: "History", icon: <History size={16} />, onClick: () => setShowHistoryModal?.(true) },
        { label: "Export as PNG", icon: <File size={16} />, divider: true, onClick: () => onExportPNG?.() },
        { label: "Export as JPEG", icon: <File size={16} />, onClick: () => onExportJPEG?.() },
        { label: "Export as SVG", icon: <File size={16} />, onClick: () => onExportSVG?.() },
        { label: "Export as PDF", icon: <File size={16} />, onClick: () => onExportPDF?.() },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sizeMenuRef.current && !sizeMenuRef.current.contains(event.target as Node)) {
                setShowSizeMenu(false);
            }
            if (isOpenRef.current && !isOpenRef.current.contains(event.target as Node)) {
                setIsOpen(false);
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
                return {
                    bg: 'bg-white border-gray-400',
                    divider: 'bg-gray-300'
                };
            case 'blue':
                return {
                    bg: 'bg-blue-900 border-blue-800',
                    divider: 'bg-blue-700'
                };
            default:
                return {
                    bg: 'bg-gray-900 border-gray-700',
                    divider: 'bg-gray-800'
                };
        }
    };

    const themeClasses = getThemeClasses();

    const handleThemeChange = () => {
        const themes: Theme[] = ['light', 'dark', 'blue'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const handleNameSave = async () => {
        if (projectName.trim() === '') {
            setProjectName('Untitled');
        }
        setEditingName(false);
        setNewProjectName?.(projectName);
        if (!projectSlug) {
            return;
        }
        onSaveProject?.();
        await ProjectService.updateProject(projectSlug, { name: projectName });
    };
    return (
        <header className={`p-2 flex items-center justify-between ${themeClasses.bg}`}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Palette className="text-blue-500" size={24} />
                    <h1 className="text-xl font-bold">Photster</h1>
                </div>

                <div className={`w-px h-8 ${themeClasses.divider}`}></div>

                <div className="flex items-center gap-4">
                    {editingName ? (
                        <input
                            ref={nameInputRef}
                            value={projectName}
                            maxLength={32}
                            placeholder="Project Name"
                            onChange={(e) => setProjectName(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    nameInputRef.current?.blur();
                                }
                            }}
                            className={`px-2 py-1 rounded-md text-base border outline-none transition-all w-48 ${theme === 'light'
                                ? 'bg-white border-gray-300 text-gray-700'
                                : 'bg-gray-700 border-gray-600 text-white'
                                }`}
                            autoFocus
                        />
                    ) : (
                        <span
                            onClick={() => setEditingName(true)}
                            className="text-base font-semibold cursor-pointer hover:underline"
                        >
                            {projectName}
                        </span>
                    )}

                    <button
                        onClick={onSaveProject}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'light'
                            ? ' text-gray-700 hover:bg-gray-200'
                            : ' text-gray-300 hover:bg-gray-700'
                            }`}
                        title="Save Project"
                    >
                        <Save size={18} />
                    </button>

                    <div className={`w-px h-8 ${themeClasses.divider}`}></div>

                    <div ref={isOpenRef} className="relative">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
                        >
                            <File size={16} />
                            <span>File</span>
                            <ChevronDown size={16} />
                        </button>

                        {isOpen && (
                            <div className="absolute left-0 top-full mt-1 w-56 bg-white shadow-lg rounded-md py-1 z-10 border border-gray-200">
                                {menuItems.map((item, index) => (
                                    <React.Fragment key={index}>
                                        {item.divider && index > 0 && <div className="border-t border-gray-200 my-1" />}
                                        <button
                                            onClick={() => {
                                                item.onClick?.();
                                                setIsOpen(false);
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </div>
                                            {item.shortcut && <span className="text-xs text-gray-500">{item.shortcut}</span>}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`w-px h-8 ${themeClasses.divider}`}></div>

                    <Link
                        to="/projects"
                        onClick={(e) => {
                            if (!window.confirm("Are you sure you want to leave this page? Any unsaved changes will be lost.")) {
                                e.preventDefault();
                            }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-200'
                            : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        title="Open Projects"
                    >
                        <FolderOpen size={18} />
                        Projects
                        <CornerDownLeft size={16} />
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleThemeChange}
                    className={`p-2 rounded-lg transition-colors ${theme === 'light'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    title='Change Theme'
                >
                    {theme === 'light' ? <Sun size={20} /> : theme === "blue" ? <Cloud size={20} /> : <Moon size={20} />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowSizeMenu(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'light'
                            ? ' bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        title='Change Canvas Size'
                    >
                        <span className="text-sm">{currentWidth} × {currentHeight}</span>
                        <ChevronDown size={16} />
                    </button>

                    {showSizeMenu && (
                        <div
                            ref={sizeMenuRef}
                            className={`absolute top-full right-0 mt-2 w-72 p-2 rounded-xl border shadow-xl z-50 ${theme === 'light'
                                ? 'bg-white border-gray-300'
                                : 'bg-gray-800 border-gray-700'
                                }`}
                        >
                            <div className="space-y-1">
                                {presetSizes.map((size, index) => (
                                    <button
                                        key={index}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${theme === 'light'
                                            ? 'hover:bg-gray-300'
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
                    onClick={() => navigate('/profile')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'light'
                        ? ' bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    title='Profile'
                >
                    <UserRound size={18} />
                </button>
            </div>
        </header >
    );
}

export default Header