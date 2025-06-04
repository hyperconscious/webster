import { useState, useCallback } from 'react';
import type { HistoryItem, Layer } from '../types';

export const useHistory = (initialLayers: Layer[]) => {
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        const initialHistoryItem = {
            layers: initialLayers.map(layer => ({
                ...layer,
                canvasJSON: JSON.parse(JSON.stringify(layer.canvas.toObject()))
            }))
        };
        return [initialHistoryItem];
    });

    const [currentStep, setCurrentStep] = useState(0);

    const createHistorySnapshot = useCallback((layers: Layer[]) => {
        const newHistoryItem = {
            layers: layers.map(layer => ({
                ...layer,
                canvasJSON: JSON.parse(JSON.stringify(layer.canvas.toObject()))
            }))
        };

        setHistory(prev => [...prev.slice(0, currentStep + 1), newHistoryItem]);
        setCurrentStep(prev => prev + 1);
    }, [currentStep]);

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

    return {
        history,
        createHistorySnapshot,
        undo,
        redo,
        canUndo,
        canRedo,
        setHistory,
        setCurrentStep
    };
};