import { useCallback, useRef, useState, useEffect } from 'react';
import type { Settings, Point, Layer, Tool, BrushPattern, ShapeTool, FontStyle, nodeType } from '../types';
import Konva from 'konva';

interface UseCanvasProps {
    canvasWidth: number;
    canvasHeight: number;
    activeLayers: Layer[];
    setLayerIndex: (index: number) => void;
    setLayerIndexes: (indexes: number[]) => void;
    activeLayerIndexes: number[];
    addLayerForObject: (name: string, callback?: (newLayer: Layer) => void) => void;
    createHistorySnapshot: (layers: Layer[]) => void;
    addHistoryItem: (action: string, snapshot: any) => void;
    layers: Layer[];
    setLayers: (value: React.SetStateAction<Layer[]>) => void;
    transformerSelectLayer: Konva.Layer;
}

export const useCanvas = ({
    canvasWidth,
    canvasHeight,
    activeLayers,
    addLayerForObject,
    setLayerIndex,
    setLayerIndexes,
    activeLayerIndexes,
    createHistorySnapshot,
    layers,
    setLayers,
    transformerSelectLayer,
    addHistoryItem
}: UseCanvasProps) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        color: '#000000',
        lineWidth: 5,
        tool: 'select',
        pattern: 'normal',
        point: { x: 0, y: 0 },
        opacity: 100,
        colorStoke: '#000000',
        widthStroke: 0,
        blur: 0,
        contrast: 0,
        brightness: 0,
        fontSize: 16,
        fontStyle: 'normal',
        fontColor: '#000000',
    });
    const [currentLine, setCurrentLine] = useState<Konva.Line>();
    const lastPointRef = useRef<Point | null>(null);
    const shapeRef = useRef<Konva.Shape | null>(null);
    const selectionRef = useRef<Konva.Rect | null>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const textRef = useRef<Konva.Text | null>(null);
    const [selectActive, setSelectActive] = useState<nodeType | null>(null);

    const canvasRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        transformerRef.current = transformerSelectLayer.findOne('#transformer') as Konva.Transformer;
        selectionRef.current = transformerSelectLayer.findOne('#selection') as Konva.Rect;
    }, [transformerSelectLayer]);

    const screenToCanvas = (clientX: number, clientY: number): Point => {
        if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };

        const rect = containerRef.current.getBoundingClientRect();
        const x = (clientX - rect.left - offset.x) / scale;
        const y = (clientY - rect.top - offset.y) / scale;

        return { x, y };
    };

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
            configLine.stroke = '#000000';
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
                    configLine.lineJoin = 'miter';
                    break;
                case 'polygon':
                    configLine.fill = color;
                    configLine.closed = true;
                    break;
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
        if (activeLayers.length !== 1 || activeLayers[0].type !== "draw") return;
        setIsDrawing(true);
        const config = getLineConfig(point);
        if (config) {
            const line = new Konva.Line(config);
            activeLayers[0].canvas.add(line);
            setCurrentLine(line);
        }
        lastPointRef.current = point;
    }, [activeLayers, getLineConfig]);

    const draw = useCallback((point: Point) => {
        if (!isDrawing || activeLayers.length !== 1 || activeLayers[0].type !== "draw" || !lastPointRef.current) return;
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
                activeLayers[0].canvas.add(circle);
            }
        } else {
            const newPoints = currentLine?.points().concat([point.x, point.y]);
            currentLine?.points(newPoints);
        }
        activeLayers[0].canvas.batchDraw();
        lastPointRef.current = point;
    }, [isDrawing, activeLayers]);

    const stopDrawing = useCallback(() => {
        if (isDrawing && activeLayers) {
            createHistorySnapshot(layers);
            const updatedLayers = layers.map(layer => {
                if (layer.id === activeLayers[0].id) {
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
            setCurrentLine(undefined);
            activeLayers[0].canvas.batchDraw();
        }
    }, [isDrawing, activeLayers, createHistorySnapshot, layers]);

    const startCreateShape = useCallback((shapeType: ShapeTool, point: Point) => {
        if (shapeRef.current !== null || !activeLayers || shapeType === undefined) return;

        let shape: Konva.Shape | null = null;

        addLayerForObject(`Shape ${shapeType} ${layers.length}`, (newLayer) => {
            if (shapeRef.current) return;

            switch (shapeType) {
                case 'line':
                    shape = new Konva.Line({
                        points: [point.x, point.y, point.x, point.y],
                        stroke: settings.color,
                        strokeWidth: settings.lineWidth,
                        name: 'shape'
                    });
                    break;
                case 'circle':
                    shape = new Konva.Circle({
                        x: point.x,
                        y: point.y,
                        opacity: settings.opacity / 100,
                        radius: 1,
                        fill: settings.color,
                        stroke: settings.colorStoke,
                        strokeWidth: settings.widthStroke,
                        name: 'shape'
                    });
                    break;
                case 'rectangle':
                    shape = new Konva.Rect({
                        x: point.x,
                        y: point.y,
                        width: 1,
                        height: 1,
                        opacity: settings.opacity / 100,
                        fill: settings.color,
                        stroke: settings.colorStoke,
                        strokeWidth: settings.widthStroke,
                        name: 'shape'
                    });
                    break;
                case 'triangle':
                    shape = new Konva.RegularPolygon({
                        x: point.x,
                        y: point.y,
                        opacity: settings.opacity / 100,
                        sides: 3,
                        radius: 1,
                        fill: settings.color,
                        stroke: settings.colorStoke,
                        strokeWidth: settings.widthStroke,
                        name: 'shape'
                    });
                    break;
                case 'polygon':
                    shape = new Konva.RegularPolygon({
                        x: point.x,
                        y: point.y,
                        opacity: settings.opacity / 100,
                        sides: 5,
                        radius: 1,
                        fill: settings.color,
                        stroke: settings.colorStoke,
                        strokeWidth: settings.widthStroke,
                        name: 'shape'
                    });
                    break;
                case 'wedge':
                    shape = new Konva.Wedge({
                        x: point.x,
                        y: point.y,
                        opacity: settings.opacity / 100,
                        radius: 1,
                        angle: 5,
                        rotation: 0,
                        fill: settings.color,
                        stroke: settings.colorStoke,
                        strokeWidth: settings.widthStroke,
                        name: 'shape'
                    });
                    break;
            }

            if (!shape) return;

            newLayer.canvas.add(shape);
            shapeRef.current = shape;
            lastPointRef.current = point;

            // Select the new shape immediately
            const layerIndex = layers.findIndex(l => l.id === newLayer.id);
            if (layerIndex !== -1) {
                setLayerIndexes([layerIndex]);
                transformerRef.current?.nodes([shape]);
                shape.draggable(true);
                selectActiveFunc(shape);
            }
        });
    }, [activeLayers, addLayerForObject, layers, settings]);

    const createShape = useCallback((point: Point) => {
        if (!shapeRef.current || !lastPointRef.current) return;

        if (shapeRef.current instanceof Konva.Line) {
            shapeRef.current.points([lastPointRef.current.x, lastPointRef.current.y, point.x, point.y]);
            return;
        } else if (shapeRef.current instanceof Konva.Circle) {
            shapeRef.current.radius(Math.sqrt(Math.pow(point.x - lastPointRef.current.x, 2) + Math.pow(point.y - lastPointRef.current.y, 2)));
            return;
        } else if (shapeRef.current instanceof Konva.Rect) {
            shapeRef.current.width(Math.abs(point.x - lastPointRef.current.x));
            shapeRef.current.height(Math.abs(point.y - lastPointRef.current.y));
            shapeRef.current.x(Math.min(point.x, lastPointRef.current.x));
            shapeRef.current.y(Math.min(point.y, lastPointRef.current.y));
            return;
        } else if (shapeRef.current instanceof Konva.RegularPolygon) {
            shapeRef.current.radius(Math.sqrt(Math.pow(point.x - lastPointRef.current.x, 2) + Math.pow(point.y - lastPointRef.current.y, 2)));
            shapeRef.current.rotation(Math.atan2(point.y - lastPointRef.current.y, point.x - lastPointRef.current.x) * (180 / Math.PI) + 90);
            return;
        } else if (shapeRef.current instanceof Konva.Wedge) {
            shapeRef.current.radius(Math.sqrt(Math.pow(point.x - lastPointRef.current.x, 2) + Math.pow(point.y - lastPointRef.current.y, 2)));
            shapeRef.current.angle(Math.atan2(point.y - lastPointRef.current.y, point.x - lastPointRef.current.x) * (180 / Math.PI) + 90);
            return;
        }
    }, [shapeRef]);

    const stopCreateShape = useCallback(() => {
        if (shapeRef.current) {
            createHistorySnapshot(layers);
            shapeRef.current = null;
            lastPointRef.current = null;
        }
    }, [shapeRef, createHistorySnapshot, layers]);

    const selectActiveFunc = ((node: Konva.Shape | Konva.Image | Konva.Text) => {
        if (node instanceof Konva.Text) {
            const fill = node.fill();
            if (typeof fill === 'string') {
                setFontColorVal(fill);
            }
            setFontSizeVal(node.fontSize());
            setFontStyleVal(node.fontStyle() as FontStyle);
            setSelectActive('text');
        } else {
            setBlurVal(node.blurRadius());
            setContrastVal(node.contrast());
            setBrightnessVal(node.brightness());
            const stroke = node.stroke();
            if (typeof stroke === 'string') {
                setColorStrokeVal(stroke);
            }
            setWidthStrokeVal(node.strokeWidth());
            const fill = node.fill();
            if (typeof fill === 'string') {
                setColor(fill);
            }
            setSelectActive('object');
        }
    });

    const setAttrsTransformer = useCallback((node: Konva.Shape | Konva.Image | Konva.Text) => {
        if (!transformerRef.current) return;

        if (node instanceof Konva.Text) {
            transformerRef.current.setAttrs({
                enabledAnchors: ['middle-left', 'middle-right'],
                boundBoxFunc: (_oldBox: { x: number; y: number; width: number; height: number; }, newBox: { x: number; y: number; width: number; height: number; }) => {
                    // limit text width scaling
                    newBox.width = Math.max(30, newBox.width);
                    return newBox;
                }
            });
        } else {
            transformerRef.current.setAttrs({
                enabledAnchors: [
                    'top-left', 'top-right',
                    'bottom-left', 'bottom-right',
                    'middle-left', 'middle-right',
                    'top-center', 'bottom-center'
                ],
                rotateEnabled: true
            });
        }
    }, [transformerRef]);

    const selectClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, point: Point) => {
        if (e.target.getParent()?.id() === 'transformer') {
            return;
        }
        const hitArea = { x: point.x, y: point.y, width: 1, height: 1 };
        const validLayer = layers.find((layer => layer.type === 'object'
            && layer.canvas.findOne((node: Konva.Node) =>
                (node.hasName('shape') || node.hasName('img') || node.hasName('text')) &&
                Konva.Util.haveIntersection(hitArea, node.getClientRect())
            )
        ));

        if (validLayer === undefined) {
            transformerRef.current?.nodes([]);
            setLayerIndexes([]);
            setSelectActive(null);
            createHistorySnapshot(layers);
            return;
        }

        const node = validLayer.canvas.findOne((node: Konva.Node) => (node.hasName('shape') || node.hasName('img') || node.hasName('text')));
        if (!node) return;
        const indexLayer = layers.findIndex(layer => layer.id === validLayer.id);

        const shiftPressed = e.evt.shiftKey || e.evt.metaKey;
        const ctrlPressed = e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = activeLayerIndexes.includes(indexLayer);

        setAttrsTransformer(node as Konva.Shape | Konva.Image | Konva.Text);
        if (transformerRef.current?.nodes()[0] instanceof Konva.Text || node instanceof Konva.Text) {
            setLayerIndexes([indexLayer]);
            transformerRef.current?.nodes([node]);
            node.draggable(true);
            selectActiveFunc(node as Konva.Shape | Konva.Image | Konva.Text);
        } else {
            if (!shiftPressed && !isSelected) {
                setLayerIndexes([indexLayer]);
                transformerRef.current?.nodes([node]);
                node.draggable(true);
                selectActiveFunc(node as Konva.Shape | Konva.Image | Konva.Text);
            } else if (ctrlPressed && isSelected) {
                setLayerIndexes([indexLayer]);
                transformerRef.current?.nodes([node]);
                node.draggable(true);
                selectActiveFunc(node as Konva.Shape | Konva.Image | Konva.Text);
            } else if (shiftPressed && isSelected) {
                const activeIndexes = activeLayerIndexes.filter(index => indexLayer !== index);
                setLayerIndexes(activeIndexes);
                transformerRef.current?.nodes(transformerRef.current?.nodes().filter((n: Konva.Node) => n !== node));
                node.draggable(false);
            } else if (shiftPressed && !isSelected) {
                setLayerIndexes([...activeLayerIndexes, indexLayer]);
                transformerRef.current?.nodes([...transformerRef.current?.nodes(), node]);
                node.draggable(true);
            }
        }
    }, [
        selectionRef,
        createHistorySnapshot,
        layers,
        activeLayerIndexes,
        setLayerIndexes,
        setLayerIndex,
        selectActiveFunc
    ]);

    const delShape = useCallback(() => {
        setLayers((prevLayers) => {
            const idsToDelete = activeLayers
                .filter(layer => layer.type === 'object')
                .map(layer => layer.id);

            prevLayers.forEach(layer => {
                if (idsToDelete.includes(layer.id)) {
                    layer.canvas.destroy();
                }
            });

            return prevLayers.filter(layer => !idsToDelete.includes(layer.id));
        });
        setSelectActive(null);
        setLayerIndexes([]);
        transformerRef.current?.nodes([]);
        createHistorySnapshot(layers);
    }, [createHistorySnapshot, layers, activeLayers]);

    const onDropImage = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        const urlImage = URL.createObjectURL(acceptedFiles[0]);
        const image = new window.Image();
        image.onload = () => {
            const konvaImage = new Konva.Image({
                image,
                x: 0,
                y: 0
            });
            addLayerForObject(`Image ${acceptedFiles[0].name}`, (newLayer) => {
                if (!konvaImage) return;
                konvaImage.name('img');
                newLayer.canvas.add(konvaImage);

                // Select the new image immediately
                const layerIndex = layers.findIndex(l => l.id === newLayer.id);
                if (layerIndex !== -1) {
                    setLayerIndexes([layerIndex]);
                    transformerRef.current?.nodes([konvaImage]);
                    konvaImage.draggable(true);
                    selectActiveFunc(konvaImage);
                }
            });
            URL.revokeObjectURL(urlImage);
            createHistorySnapshot(layers);
        };
        image.src = urlImage;
    }, [activeLayers]);

    const createText = useCallback((point: Point) => {
        addLayerForObject(`Text ${layers.length}`, (newLayer) => {
            const text = new Konva.Text({
                x: point.x,
                y: point.y,
                text: 'Double click to edit',
                fontSize: settings.fontSize,
                fontFamily: 'Arial',
                fill: settings.fontColor,
                fontStyle: settings.fontStyle,
                width: 200,
                name: 'text'
            });

            textRef.current = text;
            newLayer.canvas.add(text);

            // Select the new text immediately
            const layerIndex = layers.findIndex(l => l.id === newLayer.id);
            if (layerIndex !== -1) {
                setLayerIndexes([layerIndex]);
                transformerRef.current?.nodes([text]);
                text.draggable(true);
                selectActiveFunc(text);
            }

            // Start editing immediately
            const stage = text.getStage();
            if (!stage) return;

            text.visible(false);
            transformerRef.current?.visible(false);

            const textarea = document.createElement('textarea');
            textarea.value = '';
            textarea.style.position = 'absolute';

            const rect = text.getClientRect({ relativeTo: stage });
            const containerRect = stage.container().getBoundingClientRect();

            textarea.style.left = `${containerRect.left + (rect.x * scale)}px`;
            textarea.style.top = `${containerRect.top + (rect.y * scale)}px`;
            textarea.style.width = `${Math.max(200, rect.width) * scale}px`;
            textarea.style.height = `${rect.height * scale}px`;
            textarea.style.border = 'none';
            textarea.style.padding = '0px';
            textarea.style.margin = '0px';
            textarea.style.overflow = 'hidden';
            textarea.style.background = 'none';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.fontFamily = text.fontFamily();
            textarea.style.transformOrigin = 'left top';
            textarea.style.textAlign = text.align();
            textarea.style.color = text.fill().toString();
            textarea.style.fontSize = `${text.fontSize() * scale}px`;
            textarea.style.fontStyle = text.fontStyle();
            textarea.style.lineHeight = text.lineHeight().toString();

            document.body.appendChild(textarea);
            textarea.focus();

            textarea.addEventListener('blur', () => {
                text.text(textarea.value);
                document.body.removeChild(textarea);
                text.visible(true);
                transformerRef.current?.visible(true);
                createHistorySnapshot(layers);
            });
        });
    }, [addLayerForObject, settings, createHistorySnapshot]);

    const textEdit = useCallback((point: Point, e: Konva.KonvaEventObject<MouseEvent>) => {
        const hitArea = { x: point.x, y: point.y, width: 1, height: 1 };
        const firstValid = layers
            .filter(layer => layer.type === 'object')
            .map((layer, index) => {
                const node = layer.canvas.findOne((node: Konva.Node) =>
                    node.hasName('text') && Konva.Util.haveIntersection(hitArea, node.getClientRect()));
                return node ? { layer, index, node } : null;
            }).find(obj => obj !== null);
        if (!firstValid) return;
        const text = firstValid.node as Konva.Text;
        const stage = text.getStage();
        if (!stage) return { x: 0, y: 0, width: 0, height: 0 };
        const rect = text.getClientRect({ relativeTo: stage });
        const containerRect = stage.container().getBoundingClientRect();
        const screenX = containerRect.left + (rect.x * scale);
        const screenY = containerRect.top + (rect.y * scale);
        const screenWidth = rect.width * scale;
        const screenHeight = rect.height * scale;
        text.visible(false);
        transformerRef.current?.visible(false);
        const textarea = document.createElement('textarea');
        textarea.value = text.text();
        textarea.style.position = 'absolute';
        textarea.style.left = `${screenX}px`;
        textarea.style.top = `${screenY}px`;
        textarea.style.width = `${screenWidth}px`;
        textarea.style.height = `${screenHeight}px`;
        textarea.style.border = 'none';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.fontFamily = text.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = text.align();
        textarea.style.color = text.fill().toString();
        textarea.style.fontSize = text.fontSize() * scale + 'px';
        textarea.style.fontStyle = text.fontStyle();
        textarea.style.lineHeight = text.lineHeight().toString();
        textarea.style.whiteSpace = 'pre-wrap';
        const rotation = text.rotation();
        let transform = '';
        if (rotation) {
            transform += 'rotateZ(' + rotation + 'deg)';
        }
        transform += 'translateY(-' + 2 + 'px)';
        textarea.style.transform = transform;
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.addEventListener('blur', () => {
            text.text(textarea.value);
            document.body.removeChild(textarea);
            text.visible(true);
            transformerRef.current?.visible(true);
            createHistorySnapshot(layers);
        });
    }, [layers, screenToCanvas, createHistorySnapshot]);

    const setColorFill = useCallback((color: string) => {
        const shapes = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.shape') || layer.canvas.findOne('.img')).flat();
        setColor(color);
        shapes.forEach((shape) => {
            (shape as Konva.Shape | Konva.Image).fill(color);
            (shape as Konva.Shape | Konva.Image).cache();
        });
    }, [activeLayers]);

    const setColorStroke = useCallback((color: string) => {
        const shapes = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.shape') || layer.canvas.findOne('.img')).flat();
        setColorStrokeVal(color);
        shapes.forEach((shape) => {
            (shape as Konva.Shape | Konva.Image).stroke(color);
            (shape as Konva.Shape | Konva.Image).cache();
        });
    }, [activeLayers]);

    const setWidthStroke = useCallback((width: number) => {
        const shapes = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.shape') || layer.canvas.findOne('.img')).flat();
        setWidthStrokeVal(width);
        shapes.forEach((shape) => {
            (shape as Konva.Shape | Konva.Image).strokeWidth(width);
            (shape as Konva.Shape | Konva.Image).cache();
        });
    }, [activeLayers]);

    const setBlur = useCallback((blur: number) => {
        const shapes = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.shape') || layer.canvas.findOne('.img')).flat();
        setBlurVal(blur);
        shapes.forEach((shape) => {
            (shape as Konva.Shape | Konva.Image).filters([Konva.Filters.Blur, Konva.Filters.Contrast, Konva.Filters.Brighten]);
            (shape as Konva.Shape | Konva.Image).blurRadius(blur);
            (shape as Konva.Shape | Konva.Image).cache();
        });
    }, [activeLayers]);

    const setContrast = useCallback((contrast: number) => {
        const shapes = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.shape') || layer.canvas.findOne('.img')).flat();
        setContrastVal(contrast);
        shapes.forEach((shape) => {
            (shape as Konva.Shape | Konva.Image).filters([Konva.Filters.Blur, Konva.Filters.Contrast, Konva.Filters.Brighten]);
            (shape as Konva.Shape | Konva.Image).contrast(contrast);
            (shape as Konva.Shape | Konva.Image).cache();
        });
    }, [activeLayers]);

    const setBrightness = useCallback((brightness: number) => {
        const shapes = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.shape') || layer.canvas.findOne('.img')).flat();
        setBrightnessVal(brightness);
        shapes.forEach((shape) => {
            (shape as Konva.Shape | Konva.Image).filters([Konva.Filters.Blur, Konva.Filters.Contrast, Konva.Filters.Brighten]);
            (shape as Konva.Shape | Konva.Image).brightness(brightness);
            (shape as Konva.Shape | Konva.Image).cache();
        });
    }, [activeLayers]);

    const setFontSize = useCallback((fontSize: number) => {
        const texts = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.text')).flat();
        setFontSizeVal(fontSize);
        texts.forEach((text) => {
            (text as Konva.Text).fontSize(fontSize);
        });
    }, [activeLayers]);

    const setFontStyle = useCallback((fontStyle: FontStyle) => {
        const texts = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.text')).flat();
        setFontStyleVal(fontStyle);
        texts.forEach((text) => {
            (text as Konva.Text).fontStyle(fontStyle);
        });
    }, [activeLayers]);

    const setFontColor = useCallback((fontColor: string) => {
        const texts = activeLayers.filter(layer => layer.type === "object").map(layer => layer.canvas.findOne('.text')).flat();
        setFontColorVal(fontColor);
        texts.forEach((text) => {
            (text as Konva.Text).fill(fontColor);
        });
    }, [activeLayers]);

    const setColorStrokeVal = useCallback((color: string) => {
        setSettings(prev => ({ ...prev, colorStoke: color }));
    }, []);

    const setWidthStrokeVal = useCallback((width: number) => {
        setSettings(prev => ({ ...prev, widthStroke: width }));
    }, []);

    const setBlurVal = useCallback((blur: number) => {
        setSettings(prev => ({ ...prev, blur }));
    }, []);

    const setContrastVal = useCallback((contrast: number) => {
        setSettings(prev => ({ ...prev, contrast }));
    }, []);

    const setBrightnessVal = useCallback((brightness: number) => {
        setSettings(prev => ({ ...prev, brightness }));
    }, []);

    const setColor = useCallback((color: string) => {
        setSettings(prev => ({ ...prev, color }));
    }, []);

    const setLineWidth = useCallback((lineWidth: number) => {
        setSettings(prev => ({ ...prev, lineWidth }));
    }, []);

    const setTool = useCallback((tool: Tool) => {
        setSettings(prev => {
            if (prev.tool === 'select') {
                transformerRef.current?.nodes([]);
                setSelectActive(null);
                const allLayersObj = layers
                    .map((layer, index) => {
                        if (layer.type !== 'object') return null;
                        const node = layer.canvas.findOne((node: Konva.Node) => (node.hasName('shape') || node.hasName('img') || node.hasName('text')));
                        return node ? { layer, index, node } : null;
                    }).filter(Boolean) as { layer: Layer, index: number, node: Konva.Node }[];
                allLayersObj.forEach((obj) => { obj.node.draggable(false) });
                setLayerIndexes([]);
            }
            return { ...prev, tool };
        });
    }, []);

    const setBrushPattern = useCallback((pattern: BrushPattern) => {
        setSettings(prev => ({ ...prev, pattern }));
    }, []);

    const setOpacityBrush = useCallback((opacity: number) => {
        setSettings(prev => ({ ...prev, opacity }));
    }, []);

    const setToolShape = useCallback((shapeTool: ShapeTool) => {
        setSettings(prev => ({ ...prev, shapeTool }));
    }, []);

    const setFontSizeVal = useCallback((fontSize: number) => {
        setSettings(prev => ({ ...prev, fontSize }));
    }, []);

    const setFontStyleVal = useCallback((fontStyle: FontStyle) => {
        setSettings(prev => ({ ...prev, fontStyle }));
    }, []);

    const setFontColorVal = useCallback((fontColor: string) => {
        setSettings(prev => ({ ...prev, fontColor }));
    }, []);

    const componentToHex = (c: number) => {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    const eyedropper = useCallback((point: Point) => {
        const stage = (layers.find(l => l.visible)?.canvas.getStage()) ?? null;
        if (!stage) return;

        const dataURL = stage.toDataURL();
        const img = new window.Image();
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = stage.width();
            tempCanvas.height = stage.height();
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(point.x, point.y, 1, 1).data;
            let hex = '';
            if (imageData[0] == 0 && imageData[1] == 0 && imageData[2] == 0 && imageData[3] == 0) {
                const container = stage.container();
                const bgColor = getComputedStyle(container).backgroundColor;
                const colorRgb = bgColor.replace(/rgba?\((\d+), (\d+), (\d+)\)/, '$1,$2,$3').split(',').map(Number);
                hex = rgbToHex(colorRgb[0], colorRgb[1], colorRgb[2]);
            } else {
                hex = rgbToHex(imageData[0], imageData[1], imageData[2]);
            }
            setColor(hex);
        };
        img.src = dataURL;
    }, [layers, setColor]);

    const selectActiveLayer = useCallback((index: number) => {
        if (index < 0 || index >= layers.length) {
            return;
        }
        if (layers[index].type !== 'object') {
            setLayerIndexes([index]);
            const allLayersObj = layers
                .map((layer, index) => {
                    if (layer.type !== 'object') return null;
                    const node = layer.canvas.findOne((node: Konva.Node) => (node.hasName('shape') || node.hasName('img') || node.hasName('text')));
                    return node ? { layer, index, node } : null;
                }).filter(Boolean) as { layer: Layer, index: number, node: Konva.Node }[];
            allLayersObj.forEach((obj) => { obj.node.draggable(false) });
            transformerRef.current?.nodes([]);
            setSelectActive(null);
            return;
        } else {
            setLayerIndexes([index]);
            const node = layers[index].canvas.findOne((node: Konva.Node) => (node.hasName('shape') || node.hasName('img') || node.hasName('text')));
            if (!node) return;
            setAttrsTransformer(node as Konva.Shape | Konva.Image | Konva.Text);
            transformerRef.current?.nodes([node]);
            node.draggable(true);
            selectActiveFunc(node as Konva.Shape | Konva.Image | Konva.Text);
            if (settings.tool !== 'select') {
                setTool('select');
            }
        }

    }, [layers, setLayerIndexes, selectActiveFunc, setTool, transformerRef, settings.tool]);

    return {
        isDrawing,
        settings,
        startDrawing,
        draw,
        stopDrawing,
        startCreateShape,
        createShape,
        stopCreateShape,
        selectClick,
        //selectMove,
        //selectEnd,
        eyedropper,
        delShape,
        onDropImage,
        createText,
        textEdit,
        setColor,
        setLineWidth,
        setTool,
        setBrushPattern,
        setOpacityBrush,
        setToolShape,
        setColorStroke,
        setWidthStroke,
        setBlur,
        setContrast,
        setBrightness,
        setColorFill,
        setFontSize,
        setFontStyle,
        setFontColor,
        selectActive,
        selectionRef,
        selectActiveLayer,
        canvasRef,
        containerRef,
        scale,
        setScale,
        offset,
        setOffset,
        screenToCanvas
    };
};