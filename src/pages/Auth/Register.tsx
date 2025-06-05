import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterData, registerSchema } from '../../validation/schemas';
import InputField from '../../components/InputField';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { notifyDismiss, notifyError, notifyLoading, notifySuccess } from '../../utils/notification';
import { ArrowRight, Mail, User, Lock } from 'lucide-react';
import { useRef } from 'react';
import { type Theme } from '../../types';
import { GoogleAuthButton } from "../../components/GoogleAuthButton.tsx";
interface RegisterProps {
    theme: Theme;
}

function Register({ theme }: RegisterProps) {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit: SubmitHandler<RegisterData> = async (data) => {
        console.log('Registering with data:', data);
        const registeredId = notifyLoading("Registering...");
        try {
            await AuthService.register(data);
            notifyDismiss(registeredId);
            notifySuccess("Registration successful! Please check your email for verification.");
            await AuthService.sendVerificationEmail(data.email);
            navigate('/auth');
        } catch (error) {
            notifyDismiss(registeredId);
            if (axios.isAxiosError(error)) {
                if (error.response?.data?.message) {
                    notifyError(error.response.data.message);
                } else {
                    notifyError("An unexpected error occurred. Please try again.");
                }
            }
        }
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    text: 'text-gray-900',
                    subtext: 'text-gray-600',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white',
                    select: {
                        bg: '#ffffff',
                        border: '#e2e8f0',
                        text: '#000000',
                        shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        option: {
                            selected: '#3182ce',
                            focused: 'white',
                            default: '#edf2f7'
                        }
                    }
                };
            case 'blue':
                return {
                    text: 'text-white',
                    subtext: 'text-gray-300',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white',
                    select: {
                        bg: '#1e3a8a',
                        border: '#1e40af',
                        text: '#ffffff',
                        shadow: '0 2px 4px rgba(30, 58, 138, 0.3)',
                        option: {
                            selected: '#2563eb',
                            focused: '#1e3a8a',
                            default: '#1e40af'
                        }
                    }
                };
            default:
                return {
                    text: 'text-white',
                    subtext: 'text-gray-300',
                    button: 'bg-gray-700 hover:bg-gray-600 text-white',
                    select: {
                        bg: '#2d3748',
                        border: '#4a5568',
                        text: '#ffffff',
                        shadow: '0 2px 4px rgba(255, 255, 255, 0.1)',
                        option: {
                            selected: '#4a5568',
                            focused: 'black',
                            default: '#2d3748'
                        }
                    }
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <div ref={containerRef}>
            <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Create an account</h2>
            <p className={`${themeClasses.subtext} mb-8`}>Fill in your details to get started</p>
            <form onSubmit={
                handleSubmit(onSubmit)
            } className="space-x-1 grid grid-cols-1 md:grid-cols-2 gap-2" noValidate>
                <div>
                    <InputField
                        label="Login"
                        type="text"
                        register={register('login')}
                        icon={<User />}
                        placeholder="Enter your login"
                        error={errors.login?.message}
                        theme={theme}
                    />
                </div>
                <div>
                    <InputField
                        label="Full Name"
                        type="text"
                        register={register('full_name')}
                        icon={<User />}
                        placeholder="Enter your full name"
                        error={errors.full_name?.message}
                        theme={theme}
                    />
                </div>
                <div className="col-span-2">
                    <InputField
                        label="Email"
                        type="email"
                        register={register('email')}
                        icon={<Mail />}
                        placeholder="Enter your email"
                        error={errors.email?.message}
                        theme={theme}
                    />
                </div>
                <div>
                    <InputField
                        label="Password"
                        type="password"
                        register={register('password')}
                        icon={<Lock />}
                        placeholder="Create a password"
                        error={errors.password?.message}
                        theme={theme}
                    />
                </div>
                <div>
                    <InputField
                        label="Confirm Password"
                        type="password"
                        register={register('passwordConfirmation')}
                        icon={<Lock />}
                        placeholder="Confirm your password"
                        error={errors.passwordConfirmation?.message}
                        theme={theme}
                    />
                </div>

                <div className="col-span-2">
                    <button
                        type="submit"
                        className={`w-full ${themeClasses.button} font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2`}
                    >
                        <span>Create account</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                {/* <GoogleAuthButton
                    containerRef={containerRef}
                    loadingMessage="Registering..."
                    successMessage="Registration successful!"
                /> */}
            </form>
        </div>
    );
}

export default Register;