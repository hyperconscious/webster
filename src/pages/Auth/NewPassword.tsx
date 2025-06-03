import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import { notifyDismiss, notifyError, notifyLoading, notifySuccess } from '../../utils/notification';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { passwordResetSchema, type ResetPasswordData } from '../../validation/schemas';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PasswordResetPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [isPasswordReset, setIsPasswordReset] = useState<boolean>(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordData>({
        resolver: zodResolver(passwordResetSchema),
    });

    const onSubmit: SubmitHandler<ResetPasswordData> = async (data) => {

        const token = searchParams.get('token');
        if (!token) {
            notifyError("Invalid or missing token");
            return;
        }

        const loadId = notifyLoading("Resetting your password...");
        try {
            await AuthService.resetPassword(token, data);
            notifyDismiss(loadId);
            notifySuccess("Password reset successfully! Redirecting to login page...");
            setIsPasswordReset(true);
            setTimeout(() => navigate('/auth'), 4000);
        } catch (error) {
            notifyDismiss(loadId);
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.data && error.response.data.message) {
                    notifyError(error.response.data.message);
                } else {
                    notifyError("An unexpected error occurred. Please try again.");
                }
            } else {
                notifyError("An unexpected error occurred. Please try again.");
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-800">
            {isPasswordReset ? (
                <p className="text-gray-700 dark:text-gray-300 text-center mb-16">
                    Your password has been reset successfully. Redirecting...
                </p>
            ) : (
                <>
                    <div className="max-w-4xl bg-white dark:bg-gray-700 rounded-md shadow-lg p-8 w-full">
                        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
                            Reset Password
                        </h1>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    {...register('password')}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter new password"
                                />
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Password Confirmation
                                </label>
                                <input
                                    type="password"
                                    {...register('passwordConfirmation')}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Confirm new password"
                                />
                                {errors.passwordConfirmation && <p className="text-red-500 text-sm mt-1">{errors.passwordConfirmation.message}</p>}
                            </div>
                            <div className="flex justify-center mt-4">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default PasswordResetPage;