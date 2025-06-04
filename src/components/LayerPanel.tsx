import React from 'react';
import type { Layer, Theme } from '../types';
import { Layers, Eye, EyeOff, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface LayerPanelProps {
    layers: Layer[];
    activeLayerIndexes: number[];
    onAddLayer: () => void;
    onRemoveLayer: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onSetActiveLayer: (index: number) => void;
    onMoveLayer: (fromIndex: number, toIndex: number) => void;
    onSetLayerOpacity: (id: string, opacity: number) => void;
    theme: Theme;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
    layers,
    activeLayerIndexes,
    onAddLayer,
    onRemoveLayer,
    onToggleVisibility,
    onSetActiveLayer,
    onMoveLayer,
    onSetLayerOpacity,
    theme
}) => {
    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    panel: 'shadow-lg border border-gray-400',
                    layer: 'bg-gray-50 border border-gray-300 hover:bg-gray-100',
                    activeLayer: 'bg-blue-50 border border-black',
                    text: 'text-gray-900',
                    button: 'text-gray-600 hover:text-gray-900'
                };
            case 'blue':
                return {
                    panel: 'bg-blue-900/95 backdrop-blur-sm',
                    layer: 'bg-blue-800/50 border border-blue-600 hover:bg-blue-800',
                    activeLayer: 'bg-blue-700 border',
                    text: 'text-white',
                    button: 'text-blue-300 hover:text-white'
                };
            default:
                return {
                    panel: 'bg-gray-900/95 backdrop-blur-sm',
                    layer: 'bg-gray-800/50  border-gray-700 hover:bg-gray-800',
                    activeLayer: 'bg-gray-800 border',
                    text: 'text-white',
                    button: 'text-gray-400 hover:text-white'
                };
        }
    };

    const themeClasses = getThemeClasses();

    const layerActiveClasses = (index: number) => {
        let returnClasses = 'p-3 rounded-xl transition-all cursor-pointer';
        if (activeLayerIndexes.length > 0 && activeLayerIndexes.includes(index)) {
            returnClasses += themeClasses.activeLayer;
        } else {
            returnClasses += themeClasses.layer;
        }
        return returnClasses;
    };

    return (
        <div className={`${themeClasses.panel} p-4 h-full flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`${themeClasses.text} font-medium flex items-center gap-2`}>
                    <Layers size={18} /> Layers
                </h3>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition-colors"
                    onClick={onAddLayer}
                >
                    Add Layer
                </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1">
                {layers.map((layer, index) => (
                    <div
                        key={layer.id}
                        className={layerActiveClasses(index)}
                        onClick={() => onSetActiveLayer(index)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    className={themeClasses.button}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleVisibility(layer.id);
                                    }}
                                >
                                    {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <span className={`${themeClasses.text} text-sm font-medium`}>{layer.name}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                {layers.length > 1 && (
                                    <button
                                        className={`${themeClasses.button} p-1.5 rounded-lg hover:bg-gray-700/50`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveLayer(layer.id);
                                        }}
                                        title="Delete layer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                {index > 0 && (
                                    <button
                                        className={`${themeClasses.button} p-1.5 rounded-lg hover:bg-gray-700/50`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveLayer(index, index - 1);
                                        }}
                                        title="Move up"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                )}

                                {index < layers.length - 1 && (
                                    <button
                                        className={`${themeClasses.button} p-1.5 rounded-lg hover:bg-gray-700/50`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveLayer(index, index + 1);
                                        }}
                                        title="Move down"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            <span className={`${themeClasses.text} text-xs opacity-75`}>Opacity:</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={layer.opacity * 100}
                                onChange={(e) => {
                                    const newOpacity = Number(e.target.value) / 100;
                                    onSetLayerOpacity(layer.id, newOpacity);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className={`${themeClasses.text} text-xs w-8`}>{Math.round(layer.opacity * 100)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LayerPanel;