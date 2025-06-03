import React, { useState } from 'react';
import { X, Clock, RotateCcw } from 'lucide-react';

interface HistoryItem {
    id: string;
    timestamp: Date;
    action: string;
    snapshot: any;
}

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onRevert: (snapshot: any) => void;
    theme: 'light' | 'dark' | 'blue';
}

const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    history,
    onRevert,
    theme
}) => {
    if (!isOpen) return null;

    const themeClasses = {
        light: 'bg-white text-gray-800',
        dark: 'bg-gray-800 text-white',
        blue: 'bg-blue-900 text-white'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeClasses[theme]} rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col`}>
                <div className="flex justify-between items-center p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Clock className="text-blue-500" />
                        <h3 className="text-lg font-semibold">History of changes</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">History is empty </div>
                    ) : (
                        <ul className="space-y-2">
                            {history.map((item) => (
                                <li
                                    key={item.id}
                                    className={`p-3 rounded-lg cursor-pointer hover:bg-opacity-20 ${theme === 'light'
                                        ? 'hover:bg-gray-200'
                                        : theme === 'blue'
                                            ? 'hover:bg-blue-800'
                                            : 'hover:bg-gray-700'
                                        }`}
                                    onClick={() => onRevert(item.snapshot)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{item.action}</div>
                                            <div className="text-sm opacity-75">
                                                {item.timestamp.toLocaleString()}
                                            </div>
                                        </div>
                                        <button
                                            className="p-2 rounded-full hover:bg-opacity-30 hover:bg-gray-500"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRevert(item.snapshot);
                                            }}
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-3 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg ${theme === 'light'
                            ? 'bg-gray-200 hover:bg-gray-300'
                            : theme === 'blue'
                                ? 'bg-blue-700 hover:bg-blue-600'
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;