import { useState } from 'react';

interface PasswordModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
}

export default function PasswordModal({ open, onClose, onConfirm }: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 relative">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Підтвердження пароля</h2>

                <label className="block text-sm text-gray-600 mb-1">Поточний пароль</label>
                <input
                    type="password"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                />
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        Підтвердити
                    </button>
                </div>
            </div>
        </div>
    );
}
