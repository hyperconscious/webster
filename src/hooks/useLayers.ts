import { useState, useCallback } from 'react';
import type { Layer } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './useHistory';
import Konva from 'konva';

export const useLayers = (width: number, height: number) => {
    const createEmptyCanvas = useCallback(() => {
        const canvas = new Konva.Layer();
        return canvas;
    }, [width, height]);

    const createNewLayer = useCallback((name: string = 'Layer'): Layer => {
        return {
            id: uuidv4(),
            name,
            visible: true,
            canvas: createEmptyCanvas(),
            opacity: 1,
            canvasJSON: createEmptyCanvas().toJSON()
        };
    }, [createEmptyCanvas]);

    const [layers, setLayers] = useState<Layer[]>([
        createNewLayer('Background')
    ]);

    const [activeLayerIndex, setActiveLayerIndex] = useState(0);

    const { createHistorySnapshot, undo, redo, canUndo, canRedo } = useHistory(layers);

    const addLayer = useCallback(() => {
        const newLayer = createNewLayer(`Layer ${layers.length + 1}`);
        setLayers(prev => {
            const newLayers = [...prev, newLayer];
            createHistorySnapshot(newLayers);
            return newLayers;
        });
        setActiveLayerIndex(layers.length);
    }, [layers, createNewLayer, createHistorySnapshot]);

    const removeLayer = useCallback((id: string) => {
        if (layers.length <= 1) return;

        setLayers(prev => {
            const index = prev.findIndex(layer => layer.id === id);
            if (index === -1) return prev;
            if (prev[index].canvas) {
                prev[index].canvas.destroy();
            }

            const newLayers = [...prev.slice(0, index), ...prev.slice(index + 1)];
            createHistorySnapshot(newLayers);

            if (activeLayerIndex >= newLayers.length) {
                setActiveLayerIndex(newLayers.length - 1);
            } else if (activeLayerIndex === index) {
                setActiveLayerIndex(Math.max(0, index - 1));
            }

            return newLayers;
        });
    }, [layers, activeLayerIndex, createHistorySnapshot]);

    const toggleLayerVisibility = useCallback((id: string) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id
                    ? { ...layer, visible: !layer.visible }
                    : layer
            );
            createHistorySnapshot(newLayers);
            return newLayers;
        });
    }, [createHistorySnapshot]);

    const setLayerOpacity = useCallback((id: string, opacity: number) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id
                    ? { ...layer, opacity: Math.max(0, Math.min(1, opacity)) }
                    : layer
            );
            return newLayers;
        });
    }, []);

    const moveLayer = useCallback((fromIndex: number, toIndex: number) => {
        if (
            fromIndex < 0 ||
            fromIndex >= layers.length ||
            toIndex < 0 ||
            toIndex >= layers.length
        ) {
            return;
        }

        setLayers(prev => {
            const newLayers = [...prev];
            const [movedLayer] = newLayers.splice(fromIndex, 1);
            newLayers.splice(toIndex, 0, movedLayer);
            createHistorySnapshot(newLayers);
            return newLayers;
        });

        if (activeLayerIndex === fromIndex) {
            setActiveLayerIndex(toIndex);
        }
    }, [layers, activeLayerIndex, createHistorySnapshot]);

    const handleUndo = useCallback(() => {
        const previousLayers = undo();
        if (previousLayers) {
            previousLayers.forEach(layer => {
                if (layer.canvasJSON) {
                    layer.canvas = Konva.Node.create(layer.canvasJSON);
                }
            });
            setLayers(previousLayers);
            setActiveLayerIndex(Math.min(activeLayerIndex, previousLayers.length - 1));
        }
    }, [undo, activeLayerIndex]);

    const handleRedo = useCallback(() => {
        const nextLayers = redo();
        if (nextLayers) {
            nextLayers.forEach(layer => {
                if (layer.canvasJSON) {
                    layer.canvas = Konva.Node.create(layer.canvasJSON);
                }
            });
            setLayers(nextLayers);
            setActiveLayerIndex(Math.min(activeLayerIndex, nextLayers.length - 1));
        }
    }, [redo, activeLayerIndex]);

    return {
        layers,
        activeLayerIndex,
        setActiveLayerIndex,
        addLayer,
        removeLayer,
        toggleLayerVisibility,
        setLayerOpacity,
        moveLayer,
        activeLayer: layers[activeLayerIndex],
        handleUndo,
        handleRedo,
        canUndo,
        canRedo,
        createHistorySnapshot
    };
};