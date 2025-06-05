import React, { useRef, useEffect, useState } from 'react';
import type { Point, ShapeTool, Theme } from '../types';
import Konva from 'konva';
import { Stage } from 'react-konva';
import type { Layer } from '../types';
import { ZoomIn, ZoomOut, MousePointer, Share2, Clipboard, Loader } from 'lucide-react';
import config from '../config/env.config';
import { notifyError, notifySuccess } from '../utils/notification';

interface IHistoryItem {
    id: string;
    timestamp: Date;
    action: string;
    snapshot: any;
}

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
    transformerRef: React.RefObject<Konva.Transformer | null>;
    scale: number;
    setScale: (value: React.SetStateAction<number>) => void;
    offset: { x: number; y: number };
    setOffset: (value: React.SetStateAction<{ x: number; y: number }>) => void;
    screenToCanvas: (x: number, y: number) => Point;
    addHistoryItem: (action: string, snapshot: any) => void;
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
    transformerRef,
    scale,
    setScale,
    offset,
    setOffset,
    screenToCanvas,
    addHistoryItem
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showZoomControls, setShowZoomControls] = useState(false);
    const stageContainerRef = useRef<HTMLDivElement>(null);
    const [showShareDropdown, setShowShareDropdown] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    function getLineGuideStops(stage: Konva.Stage): { vertical: number[]; horizontal: number[] } {
        var vertical = [0, width / 2, width];
        var horizontal = [0, height / 2, height];
        const gridWidth = width / 10;
        const gridHeight = height / 10;

        for (let i = 1; i < width / gridWidth; i++) {
            vertical.push(i * gridWidth);
        }
        for (let j = 1; j < height / gridHeight; j++) {
            horizontal.push(j * gridHeight);
        }

        return {
            vertical: vertical,
            horizontal: horizontal
        };
    }

    const getObjectSnappingEdges = (node: Konva.Node) => {
        const box = node.getClientRect();
        const absPos = node.absolutePosition();

        return {
            vertical: [
                {
                    guide: Math.round(box.x),
                    offset: Math.round(absPos.x - box.x),
                    snap: 'start',
                },
                {
                    guide: Math.round(box.x + box.width / 2),
                    offset: Math.round(absPos.x - box.x - box.width / 2),
                    snap: 'center',
                },
                {
                    guide: Math.round(box.x + box.width),
                    offset: Math.round(absPos.x - box.x - box.width),
                    snap: 'end',
                },
            ],
            horizontal: [
                {
                    guide: Math.round(box.y),
                    offset: Math.round(absPos.y - box.y),
                    snap: 'start',
                },
                {
                    guide: Math.round(box.y + box.height / 2),
                    offset: Math.round(absPos.y - box.y - box.height / 2),
                    snap: 'center',
                },
                {
                    guide: Math.round(box.y + box.height),
                    offset: Math.round(absPos.y - box.y - box.height),
                    snap: 'end',
                },
            ],
        };
    }

    const getGuides = (
        lineGuideStops: { vertical: number[]; horizontal: number[] },
        itemBounds: {
            vertical: { guide: number; offset: number; snap: string }[];
            horizontal: { guide: number; offset: number; snap: string }[];
        }
    ) => {
        const resultV: {
            lineGuide: number;
            diff: number;
            snap: string;
            offset: number;
        }[] = [];
        const resultH: {
            lineGuide: number;
            diff: number;
            snap: string;
            offset: number;
        }[] = [];

        lineGuideStops.vertical.forEach((lineGuide) => {
            itemBounds.vertical.forEach((itemBound) => {
                const diff = Math.abs(lineGuide - itemBound.guide);
                if (diff < 5) {
                    resultV.push({
                        lineGuide: lineGuide,
                        diff: diff,
                        snap: itemBound.snap,
                        offset: itemBound.offset,
                    });
                }
            });
        });

        lineGuideStops.horizontal.forEach((lineGuide) => {
            itemBounds.horizontal.forEach((itemBound) => {
                var diff = Math.abs(lineGuide - itemBound.guide);
                if (diff < 5) {
                    resultH.push({
                        lineGuide: lineGuide,
                        diff: diff,
                        snap: itemBound.snap,
                        offset: itemBound.offset,
                    });
                }
            });
        });

        var guides: {
            lineGuide: number;
            offset: number;
            orientation: "V" | "H";
            snap: string;
        }[] = [];

        var minV = resultV.sort((a, b) => a.diff - b.diff)[0];
        var minH = resultH.sort((a, b) => a.diff - b.diff)[0];
        if (minV) {
            guides.push({
                lineGuide: minV.lineGuide,
                offset: minV.offset,
                orientation: 'V' as "V",
                snap: minV.snap,
            });
        }
        if (minH) {
            guides.push({
                lineGuide: minH.lineGuide,
                offset: minH.offset,
                orientation: 'H' as "H",
                snap: minH.snap,
            });
        }
        return guides;
    }

    function drawGuides(
        layer: Konva.Layer,
        guides: Array<{
            lineGuide: number;
            offset: number;
            orientation: 'H' | 'V';
            snap: string;
        }>
    ) {
        guides.forEach((lg) => {
            if (lg.orientation === 'H') {
                var line = new Konva.Line({
                    points: [-6000, 0, 6000, 0],
                    stroke: 'rgb(0, 161, 255)',
                    strokeWidth: 1,
                    name: 'guid-line',
                    dash: [4, 6],
                });
                layer.add(line);
                line.absolutePosition({
                    x: 0,
                    y: lg.lineGuide,
                });
            } else if (lg.orientation === 'V') {
                var line = new Konva.Line({
                    points: [0, -6000, 0, 6000],
                    stroke: 'rgb(0, 161, 255)',
                    strokeWidth: 1,
                    name: 'guid-line',
                    dash: [4, 6],
                });
                layer.add(line);
                line.absolutePosition({
                    x: lg.lineGuide,
                    y: 0,
                });
            }
        });
    }

    const dragmoveHandler = (stage: Konva.Stage, e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!transformerRef || !transformerRef.current || transformerRef.current.nodes().length === 0) return;
        const layer = e.target.getLayer();
        if (layer) {
            layer.find('.guid-line').forEach((line) => {
                (line as Konva.Line).destroy();
            });
        }

        const lineGuideStops = getLineGuideStops(stage);
        const itemBounds = getObjectSnappingEdges(e.target);

        const guides = getGuides(lineGuideStops, itemBounds);

        if (!guides.length) {
            return;
        }

        const targetLayer = e.target.getLayer();
        if (targetLayer) {
            drawGuides(targetLayer, guides);
        }

        const absPos = e.target.absolutePosition();
        guides.forEach((lg) => {
            switch (lg.orientation) {
                case 'V': {
                    absPos.x = lg.lineGuide + lg.offset;
                    break;
                }
                case 'H': {
                    absPos.y = lg.lineGuide + lg.offset;
                    break;
                }
            }
        });
        transformerRef.current.absolutePosition(absPos);
    }

    const renderLayers = () => {
        if (!canvasRef.current || !containerRef.current) return;
        const stage = canvasRef.current;
        if (!stage || !activeLayers) return;
        const merged = stage.getChildren((node) => { return node.name() === 'merged-layer' });
        merged.forEach(layer => layer.destroy());
        stage.removeChildren();

        stage.on('dragmove', (e: Konva.KonvaEventObject<MouseEvent>) => { dragmoveHandler(stage, e); });
        stage.on('dragend', (e: Konva.KonvaEventObject<MouseEvent>) => {
            const layer = e.target.getLayer();
            if (layer) {
                layer.find('.guid-line').forEach((line) => {
                    (line as Konva.Line).destroy();
                });
            }
        });

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
    const uploadImageToImgBB = async (): Promise<string | null> => {
        if (!canvasRef.current) return null;

        setIsUploading(true);
        try {
            const dataUrl = canvasRef.current.toDataURL({
                pixelRatio: 2
            });

            const formData = new FormData();
            formData.append('image', dataUrl.replace(/^data:image\/png;base64,/, ''));

            const res = await fetch(`https://api.imgbb.com/1/upload?key=${config.IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });

            const json = await res.json();

            if (json.success) {
                const url = json.data.url;
                return url;
            } else {
                notifyError('Error uploading image: ' + json.error.message);
                return null;
            }
        } catch (error) {
            console.error('Upload error:', error);
            notifyError('Error uploading image. Please try again.');
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleShare = async () => {
        let urlToShare = await uploadImageToImgBB();

        if (!urlToShare) return;

        setShowShareDropdown(!showShareDropdown);
    };

    const copyToClipboard = async () => {
        const urlToShare = await uploadImageToImgBB();
        if (!urlToShare) return;

        await navigator.clipboard.writeText(urlToShare);
        notifySuccess('Image link copied to clipboard!');
    };

    const handleSocialShare = async (platform: string) => {
        let urlToShare = await uploadImageToImgBB();
        if (!urlToShare) return;

        if (urlToShare !== '#') {
            window.open(getShareUrl(platform, urlToShare), '_blank');
        }
        setShowShareDropdown(false);
    };

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
            const snapshot = {
                layers: layers.map(layer => ({
                    ...layer,
                    canvasJSON: layer.canvas.toJSON()
                })),
                timestamp: new Date()
            };
            addHistoryItem(`${settings.shapeTool} created`, snapshot);
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
            return;
        }
        renderLayers();
        setShowZoomControls(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
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

    const getShareUrl = (platform: string, shareUrl: string) => {

        const encodedUrl = encodeURIComponent(shareUrl);
        const text = encodeURIComponent('Check out my artwork!');

        switch (platform) {
            case 'telegram':
                return `https://telegram.me/share/url?url=${encodedUrl}&text=${text}`;
            case 'facebook':
                return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            case 'twitter':
                return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`;

            default:
                return '#';
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

    const getDropdownThemeClasses = () => {
        switch (theme) {
            case 'light':
                return 'bg-white text-gray-900 border border-gray-400 shadow-lg';
            case 'blue':
                return 'bg-blue-900 text-white border border-blue-800 shadow-blue-900/50';
            default:
                return 'bg-gray-900 text-white border border-gray-800 shadow-black/50';
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${getThemeClasses()} h-full w-full cursor-crosshair`}
            onWheel={handleWheel}
            onMouseEnter={() => setShowZoomControls(true)}
            onMouseLeave={handleMouseLeave}
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
                    <div className="h-4 w-px bg-gray-700" />
                    <button
                        onClick={copyToClipboard}
                        className="hover:text-blue-500 transition-colors flex items-center gap-1"
                        title="Copy image link to clipboard"
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader size={16} className="animate-spin" /> : <Clipboard size={16} />}
                        <span>Copy link</span>
                    </button>
                </div>
                <div className="h-4 w-px bg-gray-700" />
                <span className="capitalize">{settings.tool}</span>
                <span>•</span>
                <span>{settings.lineWidth}px</span>
                <div className="h-4 w-px bg-gray-700" />
                <div className="relative">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader size={16} className="animate-spin" /> : <Share2 size={16} />}
                        <span>Share</span>
                    </button>
                    {showShareDropdown && (
                        <div className={`absolute bottom-full mb-2 left-0 ${getDropdownThemeClasses()} rounded-lg p-2 min-w-[120px] z-50`}>
                            <button
                                onClick={() => handleSocialShare('telegram')}
                                className="block w-full text-left px-3 py-2 rounded hover:bg-blue-500 hover:text-white transition-colors"
                            >
                                Telegram
                            </button>
                            {/* <button
                                onClick={() => handleSocialShare('instagram')}
                                className="block w-full text-left px-3 py-2 rounded hover:bg-blue-500 hover:text-white transition-colors"
                            >
                                Instagram
                            </button> */}
                            <button
                                onClick={() => handleSocialShare('facebook')}
                                className="block w-full text-left px-3 py-2 rounded hover:bg-blue-500 hover:text-white transition-colors"
                            >
                                Facebook
                            </button>
                            <button
                                onClick={() => handleSocialShare('twitter')}
                                className="block w-full text-left px-3 py-2 rounded hover:bg-blue-500 hover:text-white transition-colors"
                            >
                                Twitter
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay to close dropdown when clicking outside */}
            {showShareDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShareDropdown(false)}
                />
            )}
        </div>
    );
};

export default Canvas;