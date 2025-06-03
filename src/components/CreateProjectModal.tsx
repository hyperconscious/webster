import React, { useState } from 'react';
import { type Theme, type CanvasSize, PRESET_SIZES } from '../types';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import ProjectService from '../services/ProjectService';
import { notifyError } from '../utils/notification';
import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen,
    onClose,
    theme
}) => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [customWidth, setCustomWidth] = useState('1200');
    const [customHeight, setCustomHeight] = useState('800');
    const [selectedSize, setSelectedSize] = useState<CanvasSize | null>(null);

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    overlay: 'bg-black/20',
                    modal: 'bg-white',
                    input: 'bg-white border-gray-200 focus:border-blue-500',
                    text: 'text-gray-900',
                    size: 'bg-white border-gray-200 hover:border-gray-300',
                    activeSize: 'border-blue-500 ring-2 ring-blue-500/20'
                };
            case 'blue':
                return {
                    overlay: 'bg-black/40',
                    modal: 'bg-blue-900',
                    input: 'bg-blue-800 border-blue-700 focus:border-blue-500',
                    text: 'text-white',
                    size: 'bg-blue-800 border-blue-700 hover:border-blue-600',
                    activeSize: 'border-blue-500 ring-2 ring-blue-500/20'
                };
            default:
                return {
                    overlay: 'bg-black/40',
                    modal: 'bg-gray-800',
                    input: 'bg-gray-700 border-gray-600 focus:border-blue-500',
                    text: 'text-white',
                    size: 'bg-gray-700 border-gray-600 hover:border-gray-500',
                    activeSize: 'border-blue-500 ring-2 ring-blue-500/20'
                };
        }
    };

    const themeClasses = getThemeClasses();

    if (!isOpen) return null;

    const handleCreate = async () => {
        const width = selectedSize ? selectedSize.width : parseInt(customWidth);
        const height = selectedSize ? selectedSize.height : parseInt(customHeight);

        if (!name || !width || !height) return;

        const projectData = {
            width,
            height,
            theme,
            layers: [
                {
                    id: uuidv4(),
                    name: 'Background',
                    visible: true,
                    canvasJSON: JSON.stringify(new Konva.Layer().toObject()),
                    opacity: 1
                }
            ],
            background: '#ffffff'
        };

        const response = await ProjectService.createProject({
            name,
            data: JSON.stringify(projectData),
        });
        if (!response) {
            notifyError('Failed to create project. Please try again.');
            onClose();
            return;
        }
        navigate(`/projects/${response.slug}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
            <div className={`fixed inset-0 ${themeClasses.overlay}`} onClick={onClose} />

            <div className={`${themeClasses.modal} w-full max-w-3xl rounded-xl shadow-xl relative z-10 max-h-screen overflow-y-auto`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold">Create New Project</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Project"
                            className={`w-full px-4 py-2 rounded-lg border ${themeClasses.input} transition-colors`}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-4">Choose Size</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {PRESET_SIZES.map((size, index) => {
                                const maxPreviewDimension = 80;
                                const scale = Math.min(maxPreviewDimension / size.width, maxPreviewDimension / size.height);
                                const previewWidth = Math.round(size.width * scale);
                                const previewHeight = Math.round(size.height * scale);
                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setSelectedSize(size);
                                            setCustomWidth(size.width.toString());
                                            setCustomHeight(size.height.toString());
                                        }}
                                        className={`${themeClasses.size} p-4 rounded-xl border transition-all ${selectedSize === size ? themeClasses.activeSize : ''
                                            }`}
                                    >
                                        <div
                                            className="grid place-items-center mb-3"
                                            style={{ width: maxPreviewDimension, height: maxPreviewDimension }}
                                        >
                                            <div
                                                className="bg-gradient-to-br from-blue-500 to-purple-600 ml-14"
                                                style={{
                                                    width: previewWidth,
                                                    height: previewHeight,
                                                }}
                                            />
                                        </div>
                                        <div className="text-sm font-medium text-center">{size.label}</div>
                                        <div className="text-xs opacity-75 text-center mt-1">
                                            {size.width} × {size.height}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">Custom Width</label>
                                <input
                                    type="number"
                                    value={customWidth}
                                    min={1}
                                    max={10000}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        if (value < 1) {
                                            setCustomWidth("1");
                                        } else if (value > 10000) {
                                            setCustomWidth("10000");
                                        }
                                        else {
                                            setCustomWidth(e.target.value);
                                        }
                                        setSelectedSize(null);
                                    }}
                                    className={`w-full px-4 py-2 rounded-lg border ${themeClasses.input} transition-colors`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">Custom Height</label>
                                <input
                                    type="number"
                                    value={customHeight}
                                    min={1}
                                    max={10000}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        if (value < 1) {
                                            setCustomHeight("1");
                                        } else if (value > 10000) {
                                            setCustomHeight("10000");
                                        }
                                        else {
                                            setCustomHeight(e.target.value);
                                        }
                                        setSelectedSize(null);
                                    }}
                                    className={`w-full px-4 py-2 rounded-lg border ${themeClasses.input} transition-colors`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg transition-colors ${theme === 'light'
                            ? 'hover:bg-gray-100'
                            : 'hover:bg-gray-700'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name || (!selectedSize && (!customWidth || !customHeight))}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProjectModal;