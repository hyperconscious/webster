import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterData, registerSchema } from '../../validation/schemas';
import InputField from '../../components/InputField';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { notifyDismiss, notifyError, notifyLoading, notifySuccess } from '../../utils/notification';
import { ArrowRight, Mail, User, Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactSelect, { type SingleValue } from 'react-select';
import { type Theme } from '../../types';
import { GoogleAuthButton } from "../../components/GoogleAuthButton.tsx";

interface Country {
    code: string;
    name: string;
    flag: string;
}

function Register() {
    const navigate = useNavigate();
    const [countries, setCountries] = useState<Country[]>([]);
    const [theme, setTheme] = useState<Theme>('light');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("https://restcountries.com/v3.1/all")
            .then((response) => response.json())
            .then((data: { cca2: string; name: { common: string }; flags: { png: string } }[]) => {
                const formattedCountries: Country[] = data.map((country) => ({
                    name: country.name.common,
                    code: country.cca2,
                    flag: country.flags.png,
                }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                setCountries(formattedCountries);
            });
    }, []);

    const countryOptions = countries.map((country) => ({
        value: country.name,
        label: (
            <div className="flex items-center">
                <img src={country.flag} alt={country.name} className="w-5 h-3 mr-2" />
                {country.name}
            </div>
        ),
    }));

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<RegisterData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit: SubmitHandler<RegisterData> = async (data) => {
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
                return 'bg-white-100 text-gray-900';
            case 'blue':
                return 'bg-blue-950 text-white';
            default:
                return 'bg-gray-900 text-white';
        }
    };

    return (
        <div ref={containerRef} className={`${getThemeClasses()}`}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create an account</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Fill in your details to get started</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-x-1 grid grid-cols-1 md:grid-cols-2 gap-2" noValidate>
                <div>
                    <InputField
                        label="Login"
                        type="text"
                        register={register('login')}
                        icon={<User />}
                        placeholder="Enter your login"
                        error={errors.login?.message}
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
                    />
                </div>

                <div className="col-span-2">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>Create account</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                <GoogleAuthButton
                    containerRef={containerRef}
                    loadingMessage="Registering..."
                    successMessage="Registration successful!"
                />
            </form>
        </div>
    );
}

export default Register;