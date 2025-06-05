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

interface RegisterProps {
    theme: Theme;
}

function Register({ theme }: RegisterProps) {
    const navigate = useNavigate();
    const [countries, setCountries] = useState<Country[]>([]);
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-x-1 grid grid-cols-1 md:grid-cols-2 gap-2" noValidate>
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
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                        Country
                    </label>
                    <Controller
                        name="countryCode"
                        control={control}
                        render={({ field }) => (
                            <ReactSelect
                                options={countryOptions as unknown as { value: string; label: string }[]}
                                className='w-full border border-gray-300 dark:border-gray-600
                     rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white'
                                styles={{
                                    control: (baseStyles) => ({
                                        ...baseStyles,
                                        backgroundColor: themeClasses.select.bg,
                                        borderColor: themeClasses.select.border,
                                        color: themeClasses.select.text,
                                        borderRadius: '8px',
                                        boxShadow: themeClasses.select.shadow,
                                    }),
                                    option: (baseStyles, state) => ({
                                        ...baseStyles,
                                        backgroundColor: state.isSelected
                                            ? themeClasses.select.option.selected
                                            : state.isFocused
                                                ? themeClasses.select.option.focused
                                                : themeClasses.select.option.default,
                                        color: state.isSelected ? '#ffffff' : themeClasses.select.text,
                                        cursor: 'pointer',
                                    }),
                                    singleValue: (baseStyles) => ({
                                        ...baseStyles,
                                        color: themeClasses.select.text,
                                    }),
                                }}
                                classNamePrefix="react-select"
                                onChange={(selectedOption: SingleValue<{ value: string; label: string }>) => {
                                    const selectedValue = selectedOption?.value;
                                    if (selectedValue) {
                                        const selectedCountry = countries.find(
                                            (country) => country.name === selectedValue
                                        );
                                        if (selectedCountry) {
                                            field.onChange(selectedCountry.code);
                                        }
                                    }
                                }}
                            />
                        )}
                    />
                    {errors.countryCode && <p className="p-2 rounded-lg flex items-center justify-center space-x-2 text-red-700 dark:text-red-200">{errors.countryCode.message}</p>}
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