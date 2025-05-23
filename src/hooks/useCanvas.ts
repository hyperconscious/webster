import { useCallback, useRef, useState } from 'react';
import type { DrawingSettings, Point, Layer, Tool, BrushPattern } from '../types';

interface UseCanvasProps {
    canvasWidth: number;
    canvasHeight: number;
    activeLayer: Layer | null;
    createHistorySnapshot: (layers: Layer[]) => void;
    layers: Layer[];
}

export const useCanvas = ({
    canvasWidth,
    canvasHeight,
    activeLayer,
    createHistorySnapshot,
    layers
}: UseCanvasProps) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [settings, setSettings] = useState<DrawingSettings>({
        color: '#000000',
        lineWidth: 5,
        tool: 'brush',
        pattern: 'normal',
        point: { x: 0, y: 0 },
    });

    const lastPointRef = useRef<Point | null>(null);
    const startDrawingTimeRef = useRef<number | null>(null);

    const getContext = useCallback((canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 0;
            ctx.shadowColor = '';
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);

            const { pattern, lineWidth, color, point } = settings;

            switch (pattern) {
                case 'soft':
                    ctx.shadowBlur = lineWidth / 2;
                    ctx.shadowColor = color;
                    ctx.globalAlpha = 0.9;
                    break;
                case 'scatter':
                    ctx.globalAlpha = 0.7;
                    ctx.setLineDash([lineWidth, lineWidth * 2]);
                    ctx.lineDashOffset = lineWidth / 1.5;
                    break;
                case 'calligraphy':
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.globalAlpha = 0.98;
                    break;
                case 'spray':
                    ctx.globalAlpha = 0.8;
                    const density = 50;
                    const radius = settings.lineWidth * 2;

                    if (lastPointRef.current) {
                        for (let i = 0; i < density; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const sprayRadius = Math.random() * radius;
                            const xOffset = Math.cos(angle) * sprayRadius;
                            const yOffset = Math.sin(angle) * sprayRadius;
                            const dotSize = Math.random() * (settings.lineWidth / 3);

                            ctx.beginPath();
                            ctx.arc(
                                point.x + xOffset,
                                point.y + yOffset,
                                dotSize,
                                0,
                                Math.PI * 2
                            );
                            ctx.fill();
                        }
                    }
                    return null;
                case 'square':
                    ctx.lineCap = 'square';
                    ctx.lineJoin = 'miter'; // test
                    break;
                case 'textured':
                    const img = new Image();
                    img.src = '/textures/rough-paper.jpg';
                    img.onload = () => {
                        const pattern = ctx.createPattern(img, 'repeat');
                        if (pattern) {
                            ctx.fillStyle = pattern;
                            ctx.strokeStyle = pattern;
                        }
                    };
                    img.onerror = (error) => {
                        console.error('Ошибка загрузки изображения:', error);
                    };

                    break;
                default:
                    // No additional modifications needed
                    break;
            }
        }
        return ctx;
    }, [settings]);

    const startDrawing = useCallback((point: Point) => {
        if (!activeLayer) return;

        const ctx = getContext(activeLayer.canvas);
        if (!ctx) return;

        setIsDrawing(true);
        startDrawingTimeRef.current = Date.now();
        lastPointRef.current = point;
        setSettings(prev => ({ ...prev, point }));

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.strokeStyle = settings.tool === 'eraser' ? 'rgba(0,0,0,0)' : settings.color;
        ctx.lineWidth = settings.lineWidth;

        if (settings.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.arc(point.x, point.y, settings.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
    }, [activeLayer, getContext, settings]);

    const draw = useCallback((point: Point) => {
        if (!isDrawing || !activeLayer || !lastPointRef.current) return;

        const ctx = getContext(activeLayer.canvas);
        if (!ctx) return;
        setSettings(prev => ({ ...prev, point }));
        if (settings.pattern !== 'spray') {
            ctx.beginPath();
            ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        } else {
            getContext(activeLayer.canvas);
        }

        lastPointRef.current = point;
    }, [isDrawing, activeLayer, getContext]);

    const stopDrawing = useCallback(() => {
        if (isDrawing && activeLayer) {
            createHistorySnapshot(layers);
            setIsDrawing(false);
            lastPointRef.current = null;
            startDrawingTimeRef.current = null;
        }
    }, [isDrawing, activeLayer, createHistorySnapshot, layers]);

    const setColor = useCallback((color: string) => {
        setSettings(prev => ({ ...prev, color }));
    }, []);

    const setLineWidth = useCallback((lineWidth: number) => {
        setSettings(prev => ({ ...prev, lineWidth }));
    }, []);

    const setTool = useCallback((tool: Tool) => {
        setSettings(prev => ({ ...prev, tool }));
    }, []);

    const setBrushPattern = useCallback((pattern: BrushPattern) => {
        setSettings(prev => ({ ...prev, pattern }));
    }, []);

    return {
        isDrawing,
        settings,
        startDrawing,
        draw,
        stopDrawing,
        setColor,
        setLineWidth,
        setTool,
        setBrushPattern
    };
};