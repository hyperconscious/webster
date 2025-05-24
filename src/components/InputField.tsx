import React from 'react';

interface InputFieldProps {
    label: string;
    type: string;
    register: any;
    placeholder?: string;
    error?: string;
    icon?: React.ReactNode;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    type,
    register,
    placeholder,
    error,
    icon,
}) => {
    return (
        <div className="flex flex-col mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{label}</label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    {...register}
                    className={`w-full pl-10 py-3 border ${error ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'}
                     rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white `}
                    placeholder={placeholder}
                />
            </div>
            {error && (
                <div className="p-2 rounded-lg flex items-center justify-center space-x-2 text-red-700 dark:text-red-200">
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};

export default InputField;