import React from 'react';
import { type Theme } from '../types';

interface InputFieldProps {
    label: string;
    type: string;
    register: any;
    placeholder?: string;
    error?: string;
    icon?: React.ReactNode;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    theme?: Theme;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    type,
    register,
    placeholder,
    error,
    icon,
    theme = 'light'
}) => {
    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    label: 'text-gray-700',
                    input: 'bg-white border-gray-300 text-gray-900',
                    error: 'text-red-700'
                };
            case 'blue':
                return {
                    label: 'text-white',
                    input: 'bg-blue-800 border-blue-700 text-white',
                    error: 'text-red-200'
                };
            default:
                return {
                    label: 'text-gray-200',
                    input: 'bg-gray-700 border-gray-600 text-white',
                    error: 'text-red-200'
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <div className="flex flex-col mb-4 w-full">
            <label className={`block text-sm font-medium ${themeClasses.label} mb-2`}>{label}</label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    {...register}
                    className={`w-full pl-10 py-3 border ${error ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : themeClasses.input}
                     rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent`}
                    placeholder={placeholder}
                />
            </div>
            {error && (
                <div className="p-2 rounded-lg flex items-center justify-center space-x-2">
                    <p className={`text-sm ${themeClasses.error}`}>{error}</p>
                </div>
            )}
        </div>
    );
};

export default InputField;