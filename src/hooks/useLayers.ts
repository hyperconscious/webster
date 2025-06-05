import { useState, useCallback } from 'react';
import type { Layer, LayerType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from './useHistory';
import Konva from 'konva';

export const useLayers = (width: number, height: number) => {
    const createEmptyCanvas = useCallback(() => {
        const canvas = new Konva.Layer();
        return canvas;
    }, [width, height]);

    const createTransformerLayer = useCallback(() => {
        const layer = new Konva.Layer();
        const transformer = new Konva.Transformer({
            keepRatio: false,
            id: 'transformer'
        });
        const selectionRectangle = new Konva.Rect({
            fill: 'rgba(0,0,255,0.5)',
            visible: false,
            id: 'selection'
        });
        layer.add(selectionRectangle);
        layer.add(transformer);
        return layer;
    }, []);

    const createNewLayer = useCallback((name: string = 'Layer', type: LayerType = 'draw'): Layer => {
        return {
            type: type,
            id: uuidv4(),
            name,
            visible: true,
            canvas: createEmptyCanvas(),
            opacity: 1,
            canvasJSON: createEmptyCanvas().toJSON()
        };
    }, [createEmptyCanvas]);

    const [layers, setLayers] = useState<Layer[]>([createNewLayer('Background')]);
    const [transformerSelectLayer] = useState(() => createTransformerLayer());

    const [activeLayerIndexes, setActiveLayerIndexes] = useState<number[]>([0]);

    const { createHistorySnapshot, undo, redo, canUndo, canRedo, history, setHistory, setCurrentStep } = useHistory(layers);

    const addLayerForObject = useCallback((name: string = 'Layer', callback?: (newLayer: Layer) => void) => {
        const newLayer = createNewLayer(name, 'object');
        setLayers(prev => {
            const newLayers = [...prev, newLayer];
            callback?.(newLayer);
            return newLayers;
        });

    }, [layers, createNewLayer, createHistorySnapshot]);

    const addLayer = useCallback(() => {
        const newLayer = createNewLayer(`Layer ${layers.length + 1}`);
        setLayers(prev => {
            const newLayers = [...prev, newLayer];
            createHistorySnapshot(newLayers);
            return newLayers;
        });
        setActiveLayerIndexes([layers.length]);
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
            setActiveLayerIndexes([0]);
            createHistorySnapshot(newLayers);
            return newLayers;
        });
    }, [layers, setActiveLayerIndexes, createHistorySnapshot]);

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

        if (activeLayerIndexes.includes(fromIndex)) {
            setActiveLayerIndexes([toIndex]);
        }
    }, [layers, activeLayerIndexes, createHistorySnapshot]);

    const setLayerIndex = useCallback((index: number) => {
        if (index < 0 || index >= layers.length) {
            return;
        }
        setActiveLayerIndexes([index]);
    }, [layers]);

    const setLayerIndexes = useCallback((indexes: number[]) => {
        const validIndexes = indexes.filter(i => i >= 0 && i < layers.length);
        setActiveLayerIndexes(validIndexes);
    }, [layers]);

    const handleUndo = useCallback(() => {
        if (canUndo) {
            const prevLayers = undo();
            if (prevLayers) {
                const restored = prevLayers.map(layer => ({
                    ...layer,
                    canvas: Konva.Node.create(layer.canvasJSON) as Konva.Layer,
                    canvasJSON: layer.canvasJSON
                }));
                setLayers(restored);
                setActiveLayerIndexes([Math.min(activeLayerIndexes[0], restored.length - 1)]);
            }
        }
    }, [undo, activeLayerIndexes, canUndo]);

    const handleRedo = useCallback(() => {
        if (canRedo) {
            const nextLayers = redo();
            if (nextLayers) {
                const restored = nextLayers.map(layer => ({
                    ...layer,
                    canvas: Konva.Node.create(layer.canvasJSON) as Konva.Layer,
                    canvasJSON: layer.canvasJSON
                }));
                setLayers(restored);
                setActiveLayerIndexes([Math.min(activeLayerIndexes[0], restored.length - 1)]);
            }
        }
    }, [redo, activeLayerIndexes, canRedo]);

    return {
        layers,
        activeLayerIndexes,
        setActiveLayerIndexes,
        addLayer,
        addLayerForObject,
        removeLayer,
        setLayers,
        toggleLayerVisibility,
        setLayerOpacity,
        moveLayer,
        setLayerIndex,
        setLayerIndexes,
        activeLayers: activeLayerIndexes.map(i => layers[i]),
        handleUndo,
        handleRedo,
        canUndo,
        canRedo,
        createHistorySnapshot,
        transformerSelectLayer,
        history,
        setHistory,
        setCurrentStep
    };
};