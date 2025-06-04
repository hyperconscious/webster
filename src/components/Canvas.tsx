import React, { useRef, useEffect, useState } from 'react';
import type { Point, Theme } from '../types';
import { ZoomIn, ZoomOut, MousePointer, Share2, Clipboard, Loader } from 'lucide-react';
import Konva from 'konva';
import { Stage } from 'react-konva';
import config from '../config/env.config';
import { notifyError, notifySuccess } from '../utils/notification';

interface CanvasProps {
    width: number;
    height: number;
    layers: any[];
    activeLayer: any;
    startDrawing: (point: Point) => void;
    draw: (point: Point) => void;
    stopDrawing: () => void;
    settings: any;
    theme: Theme;
}

const Canvas: React.FC<CanvasProps> = ({
    width,
    height,
    layers,
    activeLayer,
    startDrawing,
    draw,
    stopDrawing,
    settings,
    theme
}) => {
    const canvasRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showZoomControls, setShowZoomControls] = useState(false);
    const [showShareDropdown, setShowShareDropdown] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const renderLayers = () => {
        const stage = canvasRef.current;
        if (!stage) return;

        const merged = stage.getChildren((node) => { return node.id() === 'merged-layer' || node.id() === 'merged-layer2'; });
        merged.forEach(layer => layer.destroy());
        stage.removeChildren();

        const mergedLayer = new Konva.Layer({ id: 'merged-layer' });
        const mergedLayer2 = new Konva.Layer({ id: 'merged-layer2' });

        const activeLayerIndex = layers.indexOf(activeLayer);
        layers.slice(activeLayerIndex + 1, layers.length).reverse().forEach(layer => {
            if (layer.visible && layer.canvas !== activeLayer.canvas) {
                const groupLayer = new Konva.Group({
                    opacity: layer.opacity
                });
                layer.canvas.getChildren().forEach((child: any) => {
                    groupLayer.add(child.clone());
                });
                mergedLayer.add(groupLayer);
            }
        });
        stage.add(mergedLayer);
        if (activeLayer.visible) {
            activeLayer.canvas.opacity(activeLayer.opacity);
            stage.add(activeLayer.canvas);
        }
        layers.slice(0, activeLayerIndex).reverse().forEach(layer => {
            if (layer.visible && layer.canvas !== activeLayer.canvas) {
                const groupLayer = new Konva.Group({
                    opacity: layer.opacity
                });
                layer.canvas.getChildren().forEach((child: any) => {
                    groupLayer.add(child.clone());
                });
                mergedLayer2.add(groupLayer);
            }
        });
        stage.add(mergedLayer2);
    };

    useEffect(() => {
        renderLayers();
    }, [layers, width, height, activeLayer]);

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

    const screenToCanvas = (clientX: number, clientY: number): Point => {
        if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };

        const rect = containerRef.current.getBoundingClientRect();
        const x = (clientX - rect.left - offset.x) / scale;
        const y = (clientY - rect.top - offset.y) / scale;

        return { x, y };
    };

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const evt = e.evt;
        if (evt.button === 1 || (evt.button === 0 && evt.altKey)) {
            setIsDragging(true);
            setDragStart({ x: evt.clientX, y: evt.clientY });
        } else if (evt.button === 0) {
            const point = screenToCanvas(evt.clientX, evt.clientY);
            startDrawing(point);
            renderLayers();
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
        } else {
            const point = screenToCanvas(evt.clientX, evt.clientY);
            draw(point);
            renderLayers();
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        } else {
            stopDrawing();
            renderLayers();
        }
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
        }
        stopDrawing();
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
                />
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