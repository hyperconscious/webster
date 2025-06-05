import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import AuthService from '../../services/AuthService';
import axios from 'axios';
import { notifyDismiss, notifyError, notifyLoading, notifySuccess } from '../../utils/notification';
import type { Theme } from '../../types';

interface ResetProps {
    theme: Theme;
}

function Reset({ theme }: ResetProps) {
    const [email, setEmail] = useState('');
    const [isResetPassword, setIsResetPassword] = useState(true);

    const handleEmailAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            notifyError("Please enter a valid email.");
            return;
        }
        const emailId = notifyLoading(isResetPassword ? "Sending password reset link..." : "Sending verification email...");
        try {
            isResetPassword
                ? await AuthService.sendPasswordReset(email)
                : await AuthService.sendVerificationEmail(email);
            notifyDismiss(emailId);
            notifySuccess("Email sent successfully. Please check your inbox.");
        } catch (error) {
            notifyDismiss(emailId);
            if (axios.isAxiosError(error)) {
                if (error.response?.data?.message) {
                    notifyError(error.response.data.message);
                } else {
                    notifyError("An unexpected error occurred. Please try again.");
                }
            } else {
                notifyError("An unexpected error occurred. Please try again.");
            }
        }
    };

    const handleToggle = () => {
        setIsResetPassword(!isResetPassword);
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    text: 'text-gray-900',
                    subtext: 'text-gray-600',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white',
                    input: 'border-gray-300 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900',
                    label: 'text-gray-700',
                    toggle: {
                        active: 'bg-blue-600 text-white',
                        inactive: 'bg-gray-200 text-gray-700'
                    }
                };
            case 'blue':
                return {
                    text: 'text-white',
                    subtext: 'text-gray-300',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white',
                    input: 'border-blue-700 focus:ring-blue-400 focus:border-transparent bg-blue-800 text-white',
                    label: 'text-gray-200',
                    toggle: {
                        active: 'bg-blue-600 text-white',
                        inactive: 'bg-blue-800 text-gray-300'
                    }
                };
            default:
                return {
                    text: 'text-white',
                    subtext: 'text-gray-300',
                    button: 'bg-gray-700 hover:bg-gray-600 text-white',
                    input: 'border-gray-600 focus:ring-gray-500 focus:border-transparent bg-gray-700 text-white',
                    label: 'text-gray-200',
                    toggle: {
                        active: 'bg-gray-700 text-white',
                        inactive: 'bg-gray-800 text-gray-300'
                    }
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <>
            <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                Reset password
            </h2>
            <p className={`${themeClasses.subtext} mb-8`}>
                Enter your email to receive reset instructions
            </p>
            <form onSubmit={handleEmailAction} className="space-y-4">
                <label className={`block text-sm font-medium ${themeClasses.label} mb-1`}>
                    Email
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 ${themeClasses.input}`}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className="flex items-center justify-between w-full mb-4">
                    <button
                        type='button'
                        onClick={handleToggle}
                        className={`w-1/2 py-2 text-center rounded-lg ${isResetPassword ? themeClasses.toggle.active : themeClasses.toggle.inactive}`}
                    >
                        Reset password
                    </button>
                    <button
                        type='button'
                        onClick={handleToggle}
                        className={`w-1/2 py-2 text-center rounded-lg ${!isResetPassword ? themeClasses.toggle.active : themeClasses.toggle.inactive}`}
                    >
                        Resend verification
                    </button>
                </div>
                <button
                    type="submit"
                    className={`w-full ${themeClasses.button} font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2`}
                >
                    <span>Send instructions</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </form>
        </>
    );
}

export default Reset;