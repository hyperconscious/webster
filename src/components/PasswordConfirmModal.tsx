import { useState } from 'react';
import { type Theme } from '../types';

interface PasswordModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    theme?: Theme;
}

export default function PasswordModal({ open, onClose, onConfirm, theme = 'light' }: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-white',
                    text: 'text-gray-800',
                    label: 'text-gray-600',
                    input: 'border-gray-300',
                    cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
                    confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white'
                };
            case 'blue':
                return {
                    bg: 'bg-blue-900',
                    text: 'text-white',
                    label: 'text-blue-200',
                    input: 'border-blue-700 bg-blue-800 text-white',
                    cancelButton: 'bg-blue-800 hover:bg-blue-700 text-white',
                    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
            default:
                return {
                    bg: 'bg-gray-800',
                    text: 'text-white',
                    label: 'text-gray-300',
                    input: 'border-gray-600 bg-gray-700 text-white',
                    cancelButton: 'bg-gray-700 hover:bg-gray-600 text-white',
                    confirmButton: 'bg-gray-600 hover:bg-gray-500 text-white'
                };
        }
    };

    const themeClasses = getThemeClasses();

    if (!open) return null;

    const handleConfirm = () => {
        if (!password.trim()) {
            setError('Введіть поточний пароль');
            return;
        }
        setError('');
        onConfirm(password);
        setPassword('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className={`${themeClasses.bg} rounded-lg shadow-lg w-full max-w-sm p-6 relative`}>
                <h2 className={`text-xl font-semibold ${themeClasses.text} mb-4`}>Підтвердження пароля</h2>

                <label className={`block text-sm ${themeClasses.label} mb-1`}>Поточний пароль</label>
                <input
                    type="password"
                    className={`w-full border ${themeClasses.input} rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                />
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded ${themeClasses.cancelButton}`}
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded ${themeClasses.confirmButton}`}
                    >
                        Підтвердити
                    </button>
                </div>
            </div>
        </div>
    );
}
