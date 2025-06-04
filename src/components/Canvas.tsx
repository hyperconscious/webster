import React, { useRef, useEffect, useState } from 'react';
import type { Point, ShapeTool, Theme } from '../types';
import { ZoomIn, ZoomOut, MousePointer } from 'lucide-react';
import Konva from 'konva';
import { Stage } from 'react-konva';
import type { Layer } from '../types';
import { object } from 'joi';

interface CanvasProps {
    width: number;
    height: number;
    layers: any[];
    activeLayers: Layer[];
    startDrawing: (point: Point) => void;
    draw: (point: Point) => void;
    stopDrawing: () => void;
    selectClick: (e: Konva.KonvaEventObject<MouseEvent>, point: Point) => void;
    //selectMove: (point: Point) => void;
    //selectEnd: () => void;
    delShape: () => void;
    settings: any;
    theme: Theme;
    startCreateShape: (shapeTool: ShapeTool, point: Point) => void;
    createShape: (point: Point) => void;
    stopCreateShape: () => void;
    selectionRef: React.RefObject<Konva.Rect | null>;
    eyedropper: (point: Point) => void;
    createText: (point: Point) => void;
    textEdit: (point: Point, e: Konva.KonvaEventObject<MouseEvent>) => void;
    transformerSelectLayer: Konva.Layer;
    canvasRef: React.RefObject<Konva.Stage | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    scale: number;
    setScale: (value: React.SetStateAction<number>) => void;
    offset: { x: number; y: number };
    setOffset: (value: React.SetStateAction<{ x: number; y: number }>) => void;
    screenToCanvas: (x: number, y: number) => Point;
}

const Canvas: React.FC<CanvasProps> = ({
    width,
    height,
    layers,
    activeLayers,
    startDrawing,
    draw,
    stopDrawing,
    selectClick,
    //selectMove,
    //selectEnd,
    eyedropper,
    createText,
    settings,
    theme,
    startCreateShape,
    createShape,
    stopCreateShape,
    delShape,
    textEdit,
    selectionRef,
    transformerSelectLayer,
    canvasRef,
    containerRef,
    scale,
    setScale,
    offset,
    setOffset,
    screenToCanvas
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showZoomControls, setShowZoomControls] = useState(false);
    const stageContainerRef = useRef<HTMLDivElement>(null);

    const renderLayers = () => {
        if (!canvasRef.current || !containerRef.current) return;
        const stage = canvasRef.current;
        if (!stage || !activeLayers) return;
        const merged = stage.getChildren((node) => { return node.name() === 'merged-layer' });
        merged.forEach(layer => layer.destroy());
        stage.removeChildren();

        let mergedLayer: Konva.Layer | null = null;
        layers.slice().reverse().forEach(layer => {
            if ((layer.type === "object" || activeLayers.includes(layer)) && layer.visible) {
                if (mergedLayer && mergedLayer.getChildren().length > 0) {
                    stage.add(mergedLayer);
                    mergedLayer = null;
                }
                layer.canvas.opacity(layer.opacity);
                stage.add(layer.canvas);
            } else {
                if (!mergedLayer) {
                    mergedLayer = new Konva.Layer({ name: 'merged-layer' });
                }
                if (layer.visible) {
                    const mergedGroup = new Konva.Group({ opacity: layer.opacity });
                    layer.canvas.getChildren().forEach((child: any) => {
                        if (mergedGroup) {
                            mergedGroup.add(child.clone());
                        }
                    });
                    mergedLayer.add(mergedGroup);
                }
            }
        });
        if (mergedLayer) {
            stage.add(mergedLayer);
        }
        stage.add(transformerSelectLayer);
    };

    useEffect(() => {
        renderLayers();
    }, [width, height, layers, activeLayers]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Delete') {
            delShape();
        }
    }

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const evt = e.evt;
        if (evt.button === 1 || (evt.button === 0 && evt.altKey)) {
            setIsDragging(true);
            setDragStart({ x: evt.clientX, y: evt.clientY });
        } else if (evt.button === 0) {
            if (settings.tool === 'select') {
                const point = screenToCanvas(evt.clientX, evt.clientY);
                selectClick(e, point);
            } else if (settings.tool === 'brush' || settings.tool === 'pencil'
                || settings.tool === 'highlighter' || settings.tool === 'eraser') {
                const point = screenToCanvas(evt.clientX, evt.clientY);
                startDrawing(point);
                setIsDrawing(true);
            } else if (settings.tool === 'shapes') {
                const point = screenToCanvas(evt.clientX, evt.clientY);
                startCreateShape(settings.shapeTool, point);
            } else if (settings.tool === 'eyedropper') {
                const point = screenToCanvas(evt.clientX, evt.clientY);
                eyedropper(point);
            } else if (settings.tool === 'text') {
                const point = screenToCanvas(evt.clientX, evt.clientY);
                createText(point);
            }
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const evt = e.evt;
        if (isDragging) {
            setOffset(prev => ({
                x: prev.x + (evt.clientX - dragStart.x),
                y: prev.y + (evt.clientY - dragStart.y)
            }));
            setDragStart({ x: evt.clientX, y: evt.clientY });
        } else if (isDrawing) {
            const point = screenToCanvas(evt.clientX, evt.clientY);
            draw(point);
        } else if (settings.tool === 'shapes' && settings.shapeTool) {
            const point = screenToCanvas(evt.clientX, evt.clientY);
            createShape(point);
        } else if (settings.tool === 'select' && selectionRef.current && selectionRef.current.visible()) {
            const point = screenToCanvas(evt.clientX, evt.clientY);
            //selectMove(point);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        } else if (isDrawing) {
            stopDrawing();
            setIsDrawing(false);
        } else if (settings.tool === 'shapes' && settings.shapeTool) {
            stopCreateShape();
        } else if (settings.tool === 'select' && selectionRef.current && selectionRef.current.visible()) {
            //selectEnd();
        }
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
        }
        stopDrawing();
    };

    const handleMouseDbClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (settings.tool === 'select') {
            const point = screenToCanvas(e.evt.clientX, e.evt.clientY);
            textEdit(point, e);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        //e.preventDefault();

        const zoomIntensity = 0.1;
        const delta = e.deltaY < 0 ? zoomIntensity : -zoomIntensity;
        const newScale = Math.max(0.1, Math.min(5, scale + delta));

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const newOffset = {
                x: mouseX - (mouseX - offset.x) * (newScale / scale),
                y: mouseY - (mouseY - offset.y) * (newScale / scale)
            };

            setScale(newScale);
            setOffset(newOffset);
        }
    };

    const handleZoom = (delta: number) => {
        const newScale = Math.max(0.1, Math.min(5, scale + delta));
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const newOffset = {
                x: centerX - (centerX - offset.x) * (newScale / scale),
                y: centerY - (centerY - offset.y) * (newScale / scale)
            };

            setScale(newScale);
            setOffset(newOffset);
        }
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return 'bg-gray-300';
            case 'blue':
                return 'bg-blue-950';
            default:
                return 'bg-black';
        }
    };

    const getControlsThemeClasses = () => {
        switch (theme) {
            case 'light':
                return 'bg-white text-gray-900 shadow-lg border border-gray-400';
            case 'blue':
                return 'bg-blue-900 text-white shadow-blue-900/50 border border-blue-800';
            default:
                return 'bg-gray-900 text-white shadow-black/50 border border-gray-800';
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${getThemeClasses()} h-full w-full cursor-crosshair`}
            onWheel={handleWheel}
            onMouseEnter={() => setShowZoomControls(true)}
            onMouseLeave={() => setShowZoomControls(false)}
        >
            <div
                className="absolute transform origin-top-left"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    width: width,
                    height: height
                }}
                ref={stageContainerRef}
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => {
                    handleKeyDown(e);
                }}
            >
                <Stage
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className={`absolute top-0 left-0 bg-white rounded-lg`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onDblClick={handleMouseDbClick}
                >
                </Stage>
            </div>

            <div className={`absolute bottom-4 left-4 ${getControlsThemeClasses()} rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-4`}>
                <div className="flex items-center gap-2">
                    <MousePointer size={14} />
                    <span>Alt + Click to pan</span>
                </div>
                <div className="h-4 w-px bg-gray-700" />
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleZoom(-0.1)}
                        className="hover:text-blue-500 transition-colors"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span>{Math.round(scale * 100)}%</span>
                    <button
                        onClick={() => handleZoom(0.1)}
                        className="hover:text-blue-500 transition-colors"
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>
                <div className="h-4 w-px bg-gray-700" />
                <span className="capitalize">{settings.tool}</span>
                <span>•</span>
                <span>{settings.lineWidth}px</span>
            </div>
        </div>
    );
};

export default Canvas;