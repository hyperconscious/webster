import { useCallback, useRef, useState } from 'react';
import type { DrawingSettings, Point, Layer, Tool, BrushPattern } from '../types';
import Konva from 'konva';

interface UseCanvasProps {
    canvasWidth: number;
    canvasHeight: number;
    activeLayer: Layer | null;
    createHistorySnapshot: (layers: Layer[]) => void;
    addHistoryItem: (action: string, snapshot: any) => void;
    layers: Layer[];
}

export const useCanvas = ({
    activeLayer,
    createHistorySnapshot,
    addHistoryItem,
    layers
}: UseCanvasProps) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [settings, setSettings] = useState<DrawingSettings>({
        color: '#000000',
        lineWidth: 5,
        tool: 'brush',
        pattern: 'normal',
        point: { x: 0, y: 0 },
        opacity: 100,
    });
    const [currentLine, setCurrentLine] = useState<Konva.Line>();
    const lastPointRef = useRef<Point | null>(null);

    const getLineConfig = useCallback((point: Point) => {
        const configLine: Konva.LineConfig = {
            points: [point.x, point.y],
            stroke: settings.color,
            strokeWidth: settings.lineWidth,
            lineCap: 'round',
            lineJoin: 'round',
            opacity: settings.opacity / 100,
            globalCompositeOperation: 'source-over'
        }

        const { pattern, lineWidth, color } = settings;

        if (settings.tool === 'eraser') {
            configLine.globalCompositeOperation = 'destination-out';
            configLine.stroke = '#FFFFFF';
            configLine.opacity = 1;
        } else if (settings.tool === 'highlighter') {
            configLine.globalCompositeOperation = 'lighter';
            configLine.opacity = (settings.opacity / 100) * 0.5;
        }
        else if (settings.tool === 'brush') {
            switch (pattern) {
                case 'soft':
                    configLine.shadowBlur = lineWidth / 2;
                    configLine.shadowColor = color;
                    configLine.opacity = (settings.opacity / 100) * 0.9;
                    break;
                case 'scatter':
                    configLine.opacity = (settings.opacity / 100) * 0.7;
                    configLine.dash = [lineWidth * 3, lineWidth * 3];
                    break;
                case 'calligraphy':
                    configLine.lineCap = 'round';
                    configLine.lineJoin = 'round';
                    configLine.opacity = (settings.opacity / 100) * 0.98;
                    break;
                case 'square':
                    configLine.lineCap = 'square';
                    configLine.lineJoin = 'miter'; // test
                    break;
                case 'polygon':
                    configLine.fill = color;
                    configLine.closed = true;
                    break;
                /* case 'textured':
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
                    break; */
                default:
                    // No additional modifications needed
                    break;
            }
        } else if (settings.tool === 'pencil') {
            configLine.lineCap = 'butt';
            configLine.lineJoin = 'miter';
            configLine.opacity = (settings.opacity / 100) * 0.8;
        }
        return configLine;
    }, [settings]);

    const startDrawing = useCallback((point: Point) => {
        if (!activeLayer) return;
        setIsDrawing(true);
        const config = getLineConfig(point);
        if (config) {
            const line = new Konva.Line(config);
            activeLayer.canvas.add(line);
            setCurrentLine(line);
        }
        lastPointRef.current = point;
    }, [activeLayer, getLineConfig, settings]);

    const draw = useCallback((point: Point) => {
        if (!isDrawing || !activeLayer || !lastPointRef.current) return;

        if (settings.tool === 'brush' && settings.pattern === 'spray') {
            const dx = point.x - lastPointRef.current.x;
            const dy = point.y - lastPointRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.ceil(distance / settings.lineWidth);
            for (let step = 0; step < steps; step++) {
                const t = step / steps;
                const x = lastPointRef.current.x + dx * t;
                const y = lastPointRef.current.y + dy * t;
                const angle = Math.random() * Math.PI * 2;
                const sprayRadius = Math.random() * settings.lineWidth;
                const xOffset = Math.cos(angle) * sprayRadius;
                const yOffset = Math.sin(angle) * sprayRadius;
                const dotSize = Math.random() * (settings.lineWidth / 3);
                const circle = new Konva.Circle({
                    x: x + xOffset,
                    y: y + yOffset,
                    radius: dotSize,
                    fill: settings.color,
                    opacity: settings.opacity / 100,
                });
                activeLayer.canvas.add(circle);
            }
        } else if (settings.tool === 'brush' && settings.pattern === 'textured') {
            /* const img = new Image();
            img.src = '/textures/rough-paper.jpg';
            const texturedLine = new Konva.Shape({
                sceneFunc: (context, shape) => {
                    context.beginPath();
                    img.onload = () => {
                        const pattern = context.createPattern(img, 'repeat');
                        if (pattern) {
                            context.fillStyle = pattern;
                            context.strokeStyle = pattern;
                        }
                    };
                    if (lastPointRef.current) {
                        context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
                        context.lineTo(point.x, point.y);
                        context.stroke();
                    }
                }
            });
            activeLayer.canvas.add(texturedLine); */
        } else {
            const newPoints = currentLine?.points().concat([point.x, point.y]);
            currentLine?.points(newPoints);
        }
        activeLayer.canvas.batchDraw();

        lastPointRef.current = point;
    }, [isDrawing, activeLayer]);

    const stopDrawing = useCallback(() => {
        if (isDrawing && activeLayer) {
            createHistorySnapshot(layers);
            const updatedLayers = layers.map(layer => {
                if (layer.id === activeLayer.id) {
                    return {
                        ...layer,
                        canvasJSON: layer.canvas.toJSON()
                    };
                }
                return layer;
            });

            const snapshot = {
                layers: updatedLayers,
                timestamp: new Date(),
                settings: { ...settings }
            };

            addHistoryItem(`Draw ${settings.tool}, ${settings.pattern}, ${settings.color}`, snapshot);

            setIsDrawing(false);
            activeLayer.canvas.batchDraw();
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

    const setOpacityBrush = useCallback((opacity: number) => {
        setSettings(prev => ({ ...prev, opacity }));
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
        setBrushPattern,
        setOpacityBrush
    };
};