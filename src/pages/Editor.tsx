import { useEffect, useMemo, useState } from 'react';
import Canvas from '../components/Canvas';
import ToolPanel from '../components/ToolPanel';
import LayerPanel from '../components/LayerPanel';
import ColorPicker from '../components/ColorPicker';
import Header from '../components/Header';
import { useLayers } from '../hooks/useLayers';
import { useCanvas } from '../hooks/useCanvas';
import { type HistoryItem, type ShapeTool, type Theme, PRESET_SIZES, type FontStyle } from '../types';
import { useDropzone } from 'react-dropzone';
import { useParams } from 'react-router-dom';
import ProjectService from '../services/ProjectService';
import { notifyError, notifySuccess } from '../utils/notification';
import Konva from 'konva';
import HistoryModal from '../components/HistoryModal';
import { jsPDF } from 'jspdf';

interface IHistoryItem {
    id: string;
    timestamp: Date;
    action: string;
    snapshot: any;
}

interface EditorPageProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const Editor: React.FC<EditorPageProps> = ({ theme, setTheme }) => {
    const { slug } = useParams();
    const isProject = !!slug;
    const [canvasWidth, setCanvasWidth] = useState(1200);
    const [canvasHeight, setCanvasHeight] = useState(800);
    const [projectName, setProjectName] = useState('Untitled');
    const [showShapesPanel, setShowShapesPanel] = useState(false);
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<IHistoryItem[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);


    useEffect(() => {
        const loadProject = async () => {
            if (isProject) {
                try {
                    const response = await ProjectService.getProjectBySlug(slug);
                    setProjectName(response.name);

                    const projectData = typeof response.data === 'string'
                        ? JSON.parse(response.data)
                        : response.data;

                    setCanvasWidth(projectData.width);
                    setCanvasHeight(projectData.height);
                    setTheme(projectData.theme);

                    const restoredLayers = projectData.layers.map((layerData: any) => ({
                        ...layerData,
                        canvas: Konva.Node.create(layerData.canvasJSON) as Konva.Layer,
                        canvasJSON: layerData.canvasJSON
                    }));

                    setCurrentStep(0);
                    setLayers(restoredLayers);
                } catch (error) {
                    notifyError("Error loading project. Please try again.");
                }
                finally {
                    setIsLoading(false);
                }
            } else {
                // loadFromLocalStorage();
                setIsLoading(false);
            }
        };


        loadProject();
    }, [slug, projectName]);

    const addHistoryItem = (action: string, snapshot: any) => {
        setHistory(prev => [
            {
                id: Date.now().toString(),
                timestamp: new Date(),
                action,
                snapshot
            },
            ...prev
        ].slice(0, 50))
    };

    const {
        layers,
        activeLayerIndexes, addLayer,
        addLayerForObject,
        removeLayer,
        toggleLayerVisibility,
        setLayerOpacity,
        moveLayer,
        setLayerIndex,
        setLayerIndexes,
        activeLayers,
        handleUndo,
        setLayers,
        handleRedo,
        canUndo,
        canRedo,
        createHistorySnapshot,
        transformerSelectLayer,
        setCurrentStep
    } = useLayers(canvasWidth, canvasHeight);

    const {
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
        delShape,
        eyedropper,
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
    } = useCanvas({
        canvasWidth,
        canvasHeight,
        activeLayers,
        createHistorySnapshot,
        addLayerForObject,
        activeLayerIndexes,
        setLayerIndex,
        setLayerIndexes,
        layers,
        setLayers,
        transformerSelectLayer,
        addHistoryItem
    });



    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return 'bg-gray-100 text-gray-900';
            case 'blue':
                return 'bg-blue-950 text-white';
            default:
                return 'bg-gray-900 text-white';
        }
    };

    const handleSizeChange = (width: number, height: number) => {
        setCanvasWidth(width);
        setCanvasHeight(height);
        const snapshot = {
            width: canvasWidth,
            height: canvasHeight,
            layers: layers.map(layer => ({
                ...layer,
                canvasJSON: layer.canvas.toJSON()
            })),
            timestamp: new Date()
        };

        addHistoryItem(`Canvas Change(${width} x ${height})`, snapshot);
    };

    const handleSaveProject = async () => {
        try {
            const polotno = {
                layers: layers.map(layer => ({
                    ...layer,
                    canvasJSON: JSON.parse(JSON.stringify(layer.canvas.toObject()))
                }))
            };
            const projectData = {
                width: canvasWidth,
                height: canvasHeight,
                theme,
                layers: polotno.layers.map(layer => ({
                    ...layer,
                    canvasJSON: typeof layer.canvasJSON === 'string'
                        ? JSON.parse(layer.canvasJSON)
                        : layer.canvasJSON
                }))
            };

            if (isProject) {
                await ProjectService.updateProject(slug, {
                    name: projectName,
                    data: JSON.stringify(projectData),
                });
            } else {
                await ProjectService.createProject({
                    name: projectName,
                    data: JSON.stringify(projectData),
                });
            }

            notifySuccess("Project saved successfully!");
        } catch (error) {
            notifyError("Error saving project. Please try again.");
        }
    };

    const revertToSnapshot = (snapshot: any) => {
        setCanvasWidth(snapshot.width || canvasWidth);
        setCanvasHeight(snapshot.height || canvasHeight);

        const restoredLayers = snapshot.layers.map((layerData: any) => ({
            ...layerData,
            canvas: Konva.Node.create(layerData.canvasJSON) as Konva.Layer,
            canvasJSON: layerData.canvasJSON
        }));
        setLayers(restoredLayers);

        setShowHistoryModal(false);

        notifySuccess(`State was been revert to ${new Date(snapshot.timestamp).toLocaleString()}`);
    };


    const handleAddTemplate = async () => {
        if (!isProject) {
            notifyError("You need to log in and save the project first before adding a template.");
            return;
        }
        try {
            const polotno = {
                layers: layers.map(layer => ({
                    ...layer,
                    canvasJSON: JSON.parse(JSON.stringify(layer.canvas.toObject()))
                }))
            };

            const projectData = {
                width: canvasWidth,
                height: canvasHeight,
                theme,
                layers: polotno.layers.map(layer => ({
                    ...layer,
                    canvasJSON: typeof layer.canvasJSON === 'string'
                        ? JSON.parse(layer.canvasJSON)
                        : layer.canvasJSON
                }))
            };

            const response = await ProjectService.createProject({
                name: projectName,
                isTemplate: true,
                data: JSON.stringify(projectData),
            });
            if (!response) {
                notifyError('Failed to create templatre. Please try again.');
                return;
            }
            // navigate(`/projects/${response.slug}`);
            notifySuccess("Template added successfully!");
        } catch (error) {
            console.error("Export error: " + error);
            notifyError('Failed to create templatre. Please try again.');
        }
    }

    useEffect(() => {
        if (!isProject) return;
        const autosaveInterval = setInterval(() => {
            handleSaveProject();
        }, 25000);

        return () => clearInterval(autosaveInterval);
    }, [isProject, layers, canvasWidth, canvasHeight, theme, projectName, history]);

    const exportAsPNG = () => {
        try {
            const stage = layers[0].canvas.getStage();
            if (!stage) return;

            const dataURL = stage.toDataURL();
            const link = document.createElement('a');
            link.download = `${projectName}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notifySuccess('Image exported as PNG successfully!');
        } catch (error) {
            console.error("Export error: " + error);
            notifyError('Failed to export as PNG');
        }
    };

    const exportAsJPEG = () => {
        try {
            const stage = layers[0].canvas.getStage();
            if (!stage) return;

            // Create a temporary layer for the white background
            const tempLayer = new Konva.Layer();
            const background = new Konva.Rect({
                x: 0,
                y: 0,
                width: canvasWidth,
                height: canvasHeight,
                fill: 'white'
            });
            tempLayer.add(background);
            stage.add(tempLayer);
            tempLayer.moveToBottom();

            const dataURL = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.8 });
            // Remove the temporary layer
            tempLayer.destroy();

            const link = document.createElement('a');
            link.download = `${projectName}.jpg`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notifySuccess('Image exported as JPEG successfully!');
        } catch (error) {
            console.error("Export error: " + error);
            notifyError('Failed to export as JPEG');
        }
    };

    const exportAsSVG = () => {
        try {
            const stage = layers[0].canvas.getStage();
            if (!stage) return;
            // Create a temporary stage for merging all visible layers
            const tempStage = new Konva.Stage({
                container: document.createElement('div'),
                width: canvasWidth,
                height: canvasHeight
            });

            // Add all visible layers to the temporary stage
            layers.forEach(layer => {
                if (layer.visible) {
                    const tempLayer = new Konva.Layer();
                    const group = new Konva.Group({
                        opacity: layer.opacity
                    });
                    layer.canvas.getChildren().forEach((child: any) => {
                        group.add(child.clone());
                    });
                    tempLayer.add(group);
                    tempStage.add(tempLayer);
                }
            });

            // Export to PNG first
            const dataUrl = tempStage.toDataURL();

            // Create an image element
            const img = new Image();
            img.onload = () => {
                // Create a canvas to draw the image
                const canvas = document.createElement('canvas');
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    throw new Error('Could not get canvas context');
                }

                // Draw the image on the canvas
                ctx.drawImage(img, 0, 0);

                // Convert to SVG using a data URL
                const svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    <image href="${dataUrl}" width="${canvasWidth}" height="${canvasHeight}"/>
</svg>`;

                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${projectName}.svg`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                // Clean up
                tempStage.destroy();
                canvas.remove();
            };
            img.src = dataUrl;

            notifySuccess('Image exported as SVG successfully!');
        } catch (error) {
            console.error("Export error: " + error);
            notifyError('Failed to export as SVG');
        }
    };

    const exportAsPDF = async () => {
        try {
            const stage = layers[0].canvas.getStage();
            if (!stage) return;

            const dataURL = stage.toDataURL();
            const pdf = new jsPDF({
                orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvasWidth, canvasHeight]
            });

            pdf.addImage(dataURL, 'PNG', 0, 0, canvasWidth, canvasHeight);
            pdf.save(`${projectName}.pdf`);
            notifySuccess('Image exported as PDF successfully!');
        } catch (error) {
            notifyError('Failed to export as PDF');
        }
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: onDropImage });

    const getShapeClasses = (shape: ShapeTool) => {
        const base = 'p-3 rounded-lg transition-colors';
        switch (theme) {
            case 'light':
                return settings.shapeTool === shape
                    ? base + ' bg-white border border-black'
                    : base + ' bg-white hover:bg-gray-200 border border-gray-300';
            default:
                return settings.shapeTool === shape
                    ? 'bg-gray-800 border border-white'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700';
        }
    };

    const renderShapesPanel = () => {
        return (
            <div>
                <h1 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-black' : 'text-gray-300'}`}>Shapes</h1>
                <div className="grid grid-cols-2 gap-2">
                    {['rectangle', 'circle', 'triangle', 'line', 'polygon', 'wedge'].map(shape => (
                        <button
                            key={shape}
                            onClick={() => setToolShape(shape as ShapeTool)}
                            className={getShapeClasses(shape as ShapeTool)}
                        >
                            <span className="text-sm capitalize">{shape}</span>
                        </button>
                    ))}
                </div>
                <label className="text-sm mb-1 block">Color</label>
                <ColorPicker
                    currentColor={settings.color}
                    onColorChange={setColor}
                    theme={theme}
                />
            </div>
        );
    }

    const renderDrawPanel = () => {
        return (
            <div>
                <h1 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-black' : 'text-gray-300'
                    }`}>Properties</h1>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm mb-1 block">Size</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={settings.lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="text-sm mt-1">{settings.lineWidth}px</div>
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">Opacity</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.opacity}
                            onChange={(e) => { setOpacityBrush(Number(e.target.value)) }}
                            className="w-full"
                        />
                        <div className="text-sm mt-1">{settings.opacity}</div>
                    </div>
                    {settings.tool === "brush" && <div>
                        <label className="text-sm mb-1 block">Pattern</label>
                        <select
                            value={settings.pattern}
                            onChange={(e) => setBrushPattern(e.target.value as any)}
                            className={`w-full p-2 rounded-lg ${theme === 'light'
                                ? 'bg-white border-gray-200'
                                : 'bg-gray-800 border-gray-700'
                                }`}
                        >
                            <option value="normal">Normal</option>
                            <option value="soft">Soft</option>
                            <option value="scatter">Scatter</option>
                            <option value="calligraphy">Calligraphy</option>
                            <option value="spray">Spray</option>
                            <option value="square">Square</option>
                            <option value="polygon">Polygon</option>
                            <option value="textured">Textured</option>
                        </select>
                    </div>}
                    <div>
                        <label className="text-sm mb-1 block">Color</label>
                        <ColorPicker
                            currentColor={settings.color}
                            onColorChange={setColor}
                            theme={theme}
                        />
                    </div>
                </div>
            </div>
        );
    }


    const renderImagePanel = () => {
        return (
            <div>
                <h1 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-black' : 'text-gray-300'}`}>Images</h1>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}>
                    <input {...getInputProps()} />
                    {
                        isDragActive ?
                            <p>Drop the image here ...</p> :
                            <p>Drag & drop an image here, or click to select one</p>
                    }
                </div>
            </div>
        );
    }

    const renderEyedropperPanel = () => {
        return (
            <div>
                <h1 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-black' : 'text-gray-300'}`}>Eyedropper</h1>
                <div>
                    <label className="text-sm mb-1 block">Color</label>
                    <ColorPicker
                        currentColor={settings.color}
                        onColorChange={setColor}
                        theme={theme}
                    />
                </div>
            </div>
        );
    }

    const renderTextPanel = () => {
        return (
            <div className="space-y-4">
                <h1 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-black' : 'text-gray-300'}`}>Text</h1>
                <div>
                    <label className="text-sm mb-1 block">Font Size</label>
                    <input
                        type="range"
                        min="8"
                        max="72"
                        value={settings.fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full"
                    />
                    <div className="text-sm mt-1">{settings.fontSize}px</div>
                </div>
                <div>
                    <label className="text-sm mb-1 block">Font Style</label>
                    <select
                        value={settings.fontStyle}
                        onChange={(e) => setFontStyle(e.target.value as FontStyle)}
                        className={`w-full p-2 rounded-lg ${theme === 'light'
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-800 border-gray-700'
                            }`}
                    >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                        <option value="bold">Bold</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm mb-1 block">Font Color</label>
                    <ColorPicker
                        currentColor={settings.fontColor}
                        onColorChange={setFontColor}
                        theme={theme}
                    />
                </div>
            </div>
        );
    }

    const renderLeftSidebar = () => {
        if (!showLeftSidebar) return null;
        switch (settings.tool) {
            case 'shapes':
                return renderShapesPanel();
            case 'brush':
            case 'pencil':
            case 'highlighter':
            case 'eraser':
                return renderDrawPanel();
            case 'image':
                return renderImagePanel();
            case 'eyedropper':
                return renderEyedropperPanel();
            case 'text':
                return renderTextPanel();
        }
    }

    const renderSelectPanel = () => {
        if (selectActive === "object") {
            return (
                <div>
                    <h1 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-black' : 'text-gray-300'}`}>Properties</h1>
                    <div>
                        <label className="text-sm mb-1 block">Fill</label>
                        <ColorPicker
                            currentColor={settings.color}
                            onColorChange={setColorFill}
                            theme={theme}
                        />
                    </div>
                    <div className='mt-6'>
                        <div>
                            <label className="text-sm mb-1 block">Stroke color</label>
                            <ColorPicker
                                currentColor={settings.colorStoke}
                                onColorChange={setColorStroke}
                                theme={theme}
                            />
                        </div>
                        <div>
                            <label className="text-sm mb-1 block">Stroke width</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={settings.widthStroke}
                                onChange={(e) => setWidthStroke(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="text-sm mt-1">{settings.widthStroke}px</div>
                        </div>
                    </div>
                    <div className='mt-6'>
                        <h1>Filters</h1>
                        <div>
                            <label className="text-sm mb-1 block">Blur</label>
                            <input
                                type="range"
                                min="0"
                                max="40"
                                value={settings.blur}
                                onChange={(e) => setBlur(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="text-sm mt-1">{settings.blur}%</div>
                        </div>
                        <div>
                            <label className="text-sm mb-1 block">Brighten</label>
                            <input
                                type="range"
                                min="-1"
                                max="1"
                                step="0.01"
                                value={settings.brightness}
                                onChange={(e) => setBrightness(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="text-sm mt-1">{Math.round(settings.brightness * 100)}%</div>
                        </div>
                        <div>
                            <label className="text-sm mb-1 block">Contrast</label>
                            <input
                                type="range"
                                min="-100"
                                max="100"
                                value={settings.contrast}
                                onChange={(e) => setContrast(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="text-sm mt-1">{settings.contrast}%</div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="space-y-4">
                    <h1 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-black' : 'text-gray-300'}`}>Text</h1>
                    <div>
                        <label className="text-sm mb-1 block">Font Size</label>
                        <input
                            type="range"
                            min="8"
                            max="72"
                            value={settings.fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="text-sm mt-1">{settings.fontSize}px</div>
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">Font Style</label>
                        <select
                            value={settings.fontStyle}
                            onChange={(e) => setFontStyle(e.target.value as FontStyle)}
                            className={`w-full p-2 rounded-lg ${theme === 'light'
                                ? 'bg-white border-gray-200'
                                : 'bg-gray-800 border-gray-700'
                                }`}
                        >
                            <option value="normal">Normal</option>
                            <option value="italic">Italic</option>
                            <option value="bold">Bold</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">Font Color</label>
                        <ColorPicker
                            currentColor={settings.fontColor}
                            onColorChange={setFontColor}
                            theme={theme}
                        />
                    </div>
                </div>
            );
        }
    }

    return (
        isLoading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        ) : (
            <>
                <div className={`flex flex-col h-screen ${getThemeClasses()}`}>
                    <div className="flex-none">
                        <Header
                            onSaveProject={handleSaveProject}
                            projectSlug={slug}
                            initialProjectName={projectName}
                            setNewProjectName={setProjectName}
                            onAddTemplate={handleAddTemplate}
                            setShowHistoryModal={setShowHistoryModal}
                            onExportPNG={exportAsPNG}
                            onExportJPEG={exportAsJPEG}
                            onExportSVG={exportAsSVG}
                            onExportPDF={exportAsPDF}
                            theme={theme}
                            setTheme={setTheme}
                            presetSizes={PRESET_SIZES}
                            onSizeChange={handleSizeChange}
                            currentWidth={canvasWidth}
                            currentHeight={canvasHeight}
                        />
                        <ToolPanel
                            currentTool={settings.tool}
                            setTool={setTool}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            theme={theme}
                            showShapesPanel={showShapesPanel}
                            setShowShapesPanel={setShowShapesPanel}
                            showLeftSidebar={showLeftSidebar}
                            setShowLeftSidebar={setShowLeftSidebar}
                            showRightSidebar={showRightSidebar}
                            setShowRightSidebar={setShowRightSidebar}
                        />
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        <div
                            className={`${showLeftSidebar ? 'w-72' : 'w-0'
                                } transition-all duration-300 overflow-hidden flex flex-col border-r ${theme === 'light' ? 'border-gray-400' : theme === 'blue' ? 'bg-blue-900/95 border-gray-800' : ' border-gray-800'
                                }`}
                        >
                            <div className="p-4 flex flex-col gap-4">
                                {selectActive && renderSelectPanel()}
                                {renderLeftSidebar()}
                            </div>
                        </div>

                        <div className="flex-1 relative overflow-hidden">
                            <Canvas
                                width={canvasWidth}
                                height={canvasHeight}
                                layers={layers}
                                activeLayers={activeLayers}
                                startDrawing={startDrawing}
                                draw={draw}
                                stopDrawing={stopDrawing}
                                startCreateShape={startCreateShape}
                                createShape={createShape}
                                stopCreateShape={stopCreateShape}
                                selectClick={selectClick}
                                createText={createText}
                                //selectMove={selectMove}
                                //selectEnd={selectEnd}
                                eyedropper={eyedropper}
                                delShape={delShape}
                                textEdit={textEdit}
                                selectionRef={selectionRef}
                                transformerSelectLayer={transformerSelectLayer}
                                settings={settings}
                                theme={theme}
                                canvasRef={canvasRef}
                                containerRef={containerRef}
                                scale={scale}
                                setScale={setScale}
                                offset={offset}
                                setOffset={setOffset}
                                screenToCanvas={screenToCanvas}
                            />
                        </div>

                        <div
                            className={`${showRightSidebar ? 'w-72' : 'w-0'
                                } transition-all duration-300 overflow-hidden flex flex-col border-l ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'
                                }`}
                        >
                            <LayerPanel
                                layers={layers}
                                activeLayerIndexes={activeLayerIndexes}
                                onAddLayer={addLayer}
                                onRemoveLayer={removeLayer}
                                onToggleVisibility={toggleLayerVisibility}
                                onSetActiveLayer={selectActiveLayer}
                                onMoveLayer={moveLayer}
                                onSetLayerOpacity={setLayerOpacity}
                                theme={theme}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <HistoryModal
                        isOpen={showHistoryModal}
                        onClose={() => setShowHistoryModal(false)}
                        history={history}
                        onRevert={revertToSnapshot}
                        theme={theme}
                    />
                </div>
            </>
        )
    );
}

export default Editor;
