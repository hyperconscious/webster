import type Konva from "konva";


export interface Point {
    x: number;
    y: number;
}

export interface Settings {
    tool: Tool;
    color: string;
    lineWidth: number;
    pattern?: BrushPattern;
    opacity: number;
    shapeTool?: ShapeTool;
    size?: [number, number];
    point: Point;
    colorStoke: string;
    widthStroke: number;
    blur: number;
    contrast: number;
    brightness: number;
    fontSize: number;
    fontStyle: FontStyle;
    fontColor: string;
    fontFamily: string;
    fontAlign: 'left' | 'center' | 'right';
    fontHighlightColor: string;
    fontHighlightOpacity: number;
}

export type nodeType =
    | 'text'
    | 'object'

export type FontStyle =
    | 'normal'
    | 'italic'
    | 'bold'

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
    | 'select'
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
    | 'wedge';

export type LayerType = 'object' | 'draw';

export interface Layer {
    type: LayerType;
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
    isTemplate: boolean;
    thumbnail: string;
    description?: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
}
