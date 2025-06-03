import type Konva from "konva";


export interface Point {
    x: number;
    y: number;
}

export interface DrawingSettings {
    color: string;
    lineWidth: number;
    tool: Tool;
    pattern?: BrushPattern;
    tilt?: number;
    pressure?: number;
    angle?: number;
    point: Point;
    opacity: number;
}

export type BrushPattern =
    | 'normal'
    | 'soft'
    | 'scatter'
    | 'calligraphy'
    | 'spray'
    | 'polygon'
    | 'square'
    | 'textured';

export type Tool =
    | 'brush'
    | 'pencil'
    | 'highlighter'
    | 'eraser'
    | 'shapes'
    | 'text'
    | 'image'
    | 'crop'
    | 'eyedropper';

export type ShapeTool =
    | 'line'
    | 'rectangle'
    | 'circle'
    | 'triangle'
    | 'polygon'
    | 'star';

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    canvas: Konva.Layer;
    opacity: number;
    canvasJSON: string;
}

export interface HistoryItem {
    layers: Layer[];
}

export type Theme = 'dark' | 'blue' | 'light';

export interface CanvasSize {
    width: number;
    height: number;
    label: string;
}

export const PRESET_SIZES: CanvasSize[] = [
    { width: 1200, height: 630, label: 'Facebook/LinkedIn Post (1200×630)' },
    { width: 1080, height: 1080, label: 'Instagram Post (1080×1080)' },
    { width: 1280, height: 720, label: 'YouTube Thumbnail (1280×720)' },
    { width: 1500, height: 500, label: 'Twitter Header (1500×500)' },
    { width: 851, height: 315, label: 'Facebook Cover (851×315)' },
    { width: 1584, height: 396, label: 'LinkedIn Banner (1584×396)' },
    { width: 2560, height: 1440, label: 'Desktop Wallpaper 2K (2560×1440)' }
];

export interface Project {
    id: number;
    slug: string;
    name: string;
    data: string;
    description?: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
}
