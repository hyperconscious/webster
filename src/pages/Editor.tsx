import { useEffect, useMemo, useState } from 'react';
import Canvas from '../components/Canvas';
import ToolPanel from '../components/ToolPanel';
import LayerPanel from '../components/LayerPanel';
import ColorPicker from '../components/ColorPicker';
import Header from '../components/Header';
import { useLayers } from '../hooks/useLayers';
import { useCanvas } from '../hooks/useCanvas';
import { type Theme, PRESET_SIZES } from '../types';
import { useParams } from 'react-router-dom';
import ProjectService from '../services/ProjectService';
import { notifyError, notifySuccess } from '../utils/notification';
import Konva from 'konva';

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

                    setHistory([{ layers: restoredLayers }]);
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

    const {
        layers,
        activeLayerIndex,
        setActiveLayerIndex,
        addLayer,
        removeLayer,
        toggleLayerVisibility,
        setLayerOpacity,
        moveLayer,
        activeLayer,
        handleUndo,
        setLayers,
        handleRedo,
        canUndo,
        canRedo,
        createHistorySnapshot,
        setHistory,
        setCurrentStep,
        history
    } = useLayers(canvasWidth, canvasHeight);

    const {
        settings,
        startDrawing,
        draw,
        stopDrawing,
        setColor,
        setLineWidth,
        setTool,
        setBrushPattern,
        setOpacityBrush
    } = useCanvas({
        canvasWidth,
        canvasHeight,
        activeLayer,
        createHistorySnapshot,
        layers
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
    };

    const handleSaveProject = async () => {
        try {
            createHistorySnapshot(layers);
            const lastHistoryItem = history[history.length - 1];

            const projectData = {
                width: canvasWidth,
                height: canvasHeight,
                theme,
                layers: lastHistoryItem.layers.map(layer => ({
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


    const handleAddTemplate = async () => {
        if (!isProject) {
            notifyError("You need to log in and save the project first before adding a template.");
            return;
        }
        try {
            createHistorySnapshot(layers);
            const lastHistoryItem = history[history.length - 1];

            const projectData = {
                width: canvasWidth,
                height: canvasHeight,
                theme,
                layers: lastHistoryItem.layers.map(layer => ({
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

    return (
        isLoading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        ) : (
            <div className={`flex flex-col h-screen ${getThemeClasses()}`}>
                <div className="flex-none">
                    <Header
                        theme={theme}
                        setTheme={setTheme}
                        presetSizes={PRESET_SIZES}
                        onSizeChange={handleSizeChange}
                        onSaveProject={handleSaveProject}
                        currentWidth={canvasWidth}
                        currentHeight={canvasHeight}
                        projectSlug={slug}
                        initialProjectName={projectName}
                        setNewProjectName={setProjectName}
                        onAddTemplate={handleAddTemplate}
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
                            {showShapesPanel ? (
                                <div>
                                    <h3 className={`text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                        }`}>Shapes</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['rectangle', 'circle', 'triangle', 'line', 'polygon', 'star'].map(shape => (
                                            <button
                                                key={shape}
                                                onClick={() => setTool('shapes')}
                                                className={`p-3 rounded-lg transition-colors ${theme === 'light'
                                                    ? 'bg-white hover:bg-gray-200 border border-gray-300'
                                                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                                                    }`}
                                            >
                                                <span className="text-sm capitalize">{shape}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h3 className={`text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                                        }`}>Properties</h3>
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
                            )}
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <Canvas
                            width={canvasWidth}
                            height={canvasHeight}
                            layers={layers}
                            activeLayer={activeLayer}
                            startDrawing={startDrawing}
                            draw={draw}
                            stopDrawing={stopDrawing}
                            settings={settings}
                            theme={theme}
                        />
                    </div>

                    <div
                        className={`${showRightSidebar ? 'w-72' : 'w-0'
                            } transition-all duration-300 overflow-hidden flex flex-col border-l ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'
                            }`}
                    >
                        <LayerPanel
                            layers={layers}
                            activeLayerIndex={activeLayerIndex}
                            onAddLayer={addLayer}
                            onRemoveLayer={removeLayer}
                            onToggleVisibility={toggleLayerVisibility}
                            onSetActiveLayer={setActiveLayerIndex}
                            onMoveLayer={moveLayer}
                            onSetLayerOpacity={setLayerOpacity}
                            theme={theme}
                        />
                    </div>
                </div>
            </div>
        )
    );
}

export default Editor;
