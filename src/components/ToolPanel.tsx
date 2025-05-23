import React, { type JSX } from 'react';
import type { Tool, Theme } from '../types';
import {
    Brush,
    Eraser,
    UndoIcon,
    RedoIcon,
    Pencil,
    Highlighter,
    Square,
    Type,
    Image,
    Scissors,
    Pipette,
} from 'lucide-react';

interface ToolPanelProps {
    currentTool: Tool;
    setTool: (tool: Tool) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    theme: Theme;
    showShapesPanel: boolean;
    setShowShapesPanel: (show: boolean) => void;
}

interface ToolButton {
    id: Tool;
    icon: JSX.Element;
    label: string;
}

const ToolPanel: React.FC<ToolPanelProps> = ({
    currentTool,
    setTool,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    theme,
    showShapesPanel,
    setShowShapesPanel
}) => {
    const tools: ToolButton[] = [
        { id: 'brush', icon: <Brush size={20} />, label: 'Brush' },
        { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
        { id: 'highlighter', icon: <Highlighter size={20} />, label: 'Highlighter' },
        { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
        { id: 'shapes', icon: <Square size={20} />, label: 'Shapes' },
        { id: 'text', icon: <Type size={20} />, label: 'Text' },
        { id: 'image', icon: <Image size={20} />, label: 'Image' },
        { id: 'crop', icon: <Scissors size={20} />, label: 'Crop' },
        { id: 'eyedropper', icon: <Pipette size={20} />, label: 'Color Picker' }
    ];

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    toolbar: 'bg-white border-gray-200',
                    tool: 'hover:bg-gray-100',
                    activeTool: 'bg-blue-50 text-blue-600',
                    divider: 'bg-gray-200'
                };
            case 'blue':
                return {
                    toolbar: 'bg-blue-900 border-blue-800',
                    tool: 'hover:bg-blue-800',
                    activeTool: 'bg-blue-700 text-white',
                    divider: 'bg-blue-800'
                };
            default:
                return {
                    toolbar: 'bg-gray-900 border-gray-800',
                    tool: 'hover:bg-gray-800',
                    activeTool: 'bg-gray-800 text-white',
                    divider: 'bg-gray-800'
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <div className={`${themeClasses.toolbar} border-b p-2 flex items-center gap-4`}>
            <div className="flex items-center gap-2">
                <button
                    className={`p-2 rounded-lg transition-colors ${canUndo ? themeClasses.tool : 'opacity-50 cursor-not-allowed'
                        }`}
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo"
                >
                    <UndoIcon size={20} />
                </button>
                <button
                    className={`p-2 rounded-lg transition-colors ${canRedo ? themeClasses.tool : 'opacity-50 cursor-not-allowed'
                        }`}
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo"
                >
                    <RedoIcon size={20} />
                </button>
            </div>

            <div className={`w-px h-6 ${themeClasses.divider}`} />

            <div className="flex items-center gap-1">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        className={`p-2 rounded-lg transition-colors ${currentTool === tool.id
                            ? themeClasses.activeTool
                            : themeClasses.tool
                            }`}
                        onClick={() => {
                            setTool(tool.id);
                            if (tool.id === 'shapes') {
                                setShowShapesPanel(true);
                            } else {
                                setShowShapesPanel(false);
                            }
                        }}
                        title={tool.label}
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ToolPanel;