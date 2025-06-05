import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {User, Building, Mail, Plus, Edit2, X, Camera, LogIn, Palette} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useUser } from '../hooks/useUser';
import { useNavigate, useParams } from 'react-router-dom';
import UserService from '../services/UserService';
import { useForm } from 'react-hook-form';
import { type UpdateUserData, updateUserDto } from '../validation/schemas';
import { joiResolver } from '@hookform/resolvers/joi';
import InputField from '../components/InputField';
import { notifyError, notifySuccess } from '../utils/notification';
import config from '../config/env.config';
import PasswordModal from '../components/PasswordConfirmModal';

export const Profile: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const { user, setUser } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const passwordModalResolveRef = useRef<(() => void) | null>(null);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<UpdateUserData>({
        resolver: joiResolver(updateUserDto),
    });

    const onDrop = async (acceptedFiles: File[]) => {
        if (!user) return;
        const file = acceptedFiles[0];
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await UserService.uploadAvatar(user.id, formData);
            console.log('Avatar uploaded:', response);
            setUser(response);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxSize: 5242880,
        maxFiles: 1
    });

    useEffect(() => {
        if (user) {
            setValue('full_name', user.full_name);
            setValue('login', user.login);
            setValue('email', user.email);
        } else {
            reset();
        }
    }, [user, setValue, reset]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500 dark:text-gray-300">Loading...</p>
            </div>
        );
    }

    const onPasswordConfirm = async (currentPassword: string) => {
        try {
            const isCredentials = await UserService.verifyCredential(user.id, currentPassword);
            console.log('isCredentials', isCredentials);
            if (!isCredentials) {
                notifyError('Неверный текущий пароль');
                return;
            }
            notifySuccess('Пароль змінено');
        } catch (e) {
            notifyError('Помилка зміни пароля');
        }
    };

    const onSubmit = async (data: UpdateUserData) => {
        try {
            Object.keys(data).forEach((key) => {
                const value = (data as any)[key];
                if (value === '' || value === null || value === undefined) {
                    delete (data as any)[key];
                }
            });
            data.verified = true;
            if (data.password) {
                await new Promise<void>((resolve) => {
                    passwordModalResolveRef.current = resolve;
                    setShowPasswordModal(true);
                });
            };
            const { passwordConfirmation, ...dataWithoutPasswordConfirmation } = data;
            await UserService.updateUserProfile(user.id, dataWithoutPasswordConfirmation);
            notifySuccess('User updated successfully');
            setUser((prev) => prev ? ({ ...prev, ...data, id: prev.id }) : null);
            setIsEditing(false);
            setValue('password', '');
            setValue('passwordConfirmation', '');
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    return (
        <>
            <header className={`p-2 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Palette className="text-blue-500" size={24}/>
                        <h1 className="text-xl font-bold">Photster</h1>
                    </div>
                </div>
            </header>
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Profile Settings
                </h1>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <User className="w-6 h-6 text-blue-500" />
                            Personal Information
                        </h2>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
                        >
                            {isEditing ? (
                                <>
                                    <X className="w-4 h-4" />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-8 mb-8">
                        <div className="relative">
                            <img
                                src={`${config.BACKEND_URL}${user.avatar}`}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover" />
                            <div
                                {...getRootProps()}
                                className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
                            >
                                <input {...getInputProps()} />
                                <Camera className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        <div className="flex-1">
                            {isEditing ? (
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <InputField
                                            label="Full Name"
                                            type="text"
                                            register={register('full_name')}
                                            error={errors.full_name?.message} />
                                        <InputField
                                            label="Login"
                                            type="text"
                                            register={register('login')}
                                            error={errors.login?.message} />
                                        <InputField
                                            label="Email"
                                            type="email"
                                            register={register('email')}
                                            error={errors.email?.message} />
                                        <div className="flex gap-2 col-span-2">
                                            <InputField
                                                label="Password"
                                                type="password"
                                                register={register('password')}
                                                error={errors.password?.message} />
                                            <InputField
                                                label="Password Confirmation"
                                                type="password"
                                                register={register('passwordConfirmation')}
                                                error={errors.passwordConfirmation?.message} />
                                        </div>

                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <LogIn className="w-4 h-4 text-gray-500" />
                                        {user.login}
                                    </p>
                                    <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <User className="w-4 h-4 text-gray-500" />
                                        {user.full_name}
                                    </p>
                                    <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        {user.email}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div >
            <PasswordModal
                open={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onConfirm={onPasswordConfirm} />
        </>
    );
};
