import { useEffect, useRef, useState, useContext } from 'react';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginData, loginSchema } from '../../validation/schemas';
import InputField from '../../components/InputField';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';
import AuthStore from '../../store/AuthStore';
import { notifyDismiss, notifyLoading, notifySuccess } from '../../utils/notification';
import { GoogleAuthButton } from "../../components/GoogleAuthButton.tsx";
import { UserContext } from '../../context/UserContext';
import type { Theme } from '../../types';

interface LoginProps {
    theme: Theme;
}

function Login({ theme }: LoginProps) {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(AuthStore.getTokens);
    const containerRef = useRef<HTMLDivElement>(null);
    const { refreshUser } = useContext(UserContext) || {};

    useEffect(() => {
        if (tokens.accessToken) {
            navigate('/');
        }
    }, [tokens, navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit: SubmitHandler<LoginData> = async (data) => {
        const loginId = notifyLoading("Logging in...");
        try {
            const { accessToken, refreshToken } = await AuthService.login(data);
            AuthStore.setTokens(accessToken, refreshToken);
            if (refreshUser) {
                await refreshUser();
            }
            notifyDismiss(loginId);
            notifySuccess("Login successful!");
            navigate('/');
        } catch (error) {
            notifyDismiss(loginId);
            console.error('Failed to login', error);
        }
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    text: 'text-gray-900',
                    subtext: 'text-gray-600',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
            case 'blue':
                return {
                    text: 'text-white',
                    subtext: 'text-gray-300',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
            default:
                return {
                    text: 'text-white',
                    subtext: 'text-gray-300',
                    button: 'bg-gray-700 hover:bg-gray-600 text-white'
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <div ref={containerRef}>
            <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Welcome back</h2>
            <p className={`${themeClasses.subtext} mb-8`}>Please enter your details to sign in</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <InputField
                    label="Email or Login"
                    type="text"
                    register={register('loginOrEmail')}
                    icon={<Mail />}
                    placeholder="Email or Login"
                    error={errors.loginOrEmail?.message}
                    theme={theme}
                />
                <InputField
                    label="Password"
                    type="password"
                    register={register('password')}
                    icon={<Lock />}
                    placeholder="Password"
                    error={errors.password?.message}
                    theme={theme}
                />
                <button
                    type="submit"
                    className={`w-full ${themeClasses.button} font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2`}
                >
                    <span>Sign in</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
                <GoogleAuthButton
                    containerRef={containerRef}
                    loadingMessage="Logging in..."
                    successMessage="Login successful!"
                />
            </form>
        </div>
    );
}

export default Login;
