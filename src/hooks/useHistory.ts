import { useState, useCallback } from 'react';
import type { HistoryItem, Layer } from '../types';

export const useHistory = (initialLayers: Layer[]) => {
    const [history, setHistory] = useState<HistoryItem[]>([{ layers: initialLayers }]);
    const [currentStep, setCurrentStep] = useState<number>(0);

    const createHistorySnapshot = useCallback((layers: Layer[]) => {
        const clonedLayers = layers.map(layer => {
            const newCanvas = document.createElement('canvas');
            newCanvas.width = layer.canvas.width;
            newCanvas.height = layer.canvas.height;
            const context = newCanvas.getContext('2d');
            if (context) {
                context.drawImage(layer.canvas, 0, 0);
            }
            return {
                ...layer,
                canvas: newCanvas
            };
        });

        const newHistory = history.slice(0, currentStep + 1);
        newHistory.push({ layers: clonedLayers });

        setHistory(newHistory);
        setCurrentStep(newHistory.length - 1);
    }, [history, currentStep]);

    const undo = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            return history[currentStep - 1].layers;
        }
        return null;
    }, [history, currentStep]);

    const redo = useCallback(() => {
        if (currentStep < history.length - 1) {
            setCurrentStep(prev => prev + 1);
            return history[currentStep + 1].layers;
        }
        return null;
    }, [history, currentStep]);

    const canUndo = currentStep > 0;
    const canRedo = currentStep < history.length - 1;

    return { createHistorySnapshot, undo, redo, canUndo, canRedo };
};