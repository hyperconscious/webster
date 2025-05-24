import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
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

import { useTranslation } from 'react-i18next';
import { GoogleAuthButton } from "../../components/GoogleAuthButton.tsx";

interface Country {
    code: string;
    name: string;
    flag: string;
}

function Register() {
    const navigate = useNavigate()
    const [countries, setCountries] = useState<Country[]>([]);
    const [theme, setTheme] = useState<Theme>('light');
    const { t } = useTranslation();
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
        resolver: joiResolver(registerSchema),
    });

    const onSubmit: SubmitHandler<RegisterData> = async (data) => {
        console.log(data);
        const registeredId = notifyLoading(t('register.loading'));
        try {
            await AuthService.register(data);
            notifyDismiss(registeredId);
            notifySuccess(t('register.success'));
            await AuthService.sendVerificationEmail(data.email);
            navigate('/auth');
        } catch (error) {
            notifyDismiss(registeredId);
            if (axios.isAxiosError(error)) {
                if (error.response?.data?.message) {
                    notifyError(error.response.data.message);
                } else {
                    notifyError(t('errors.unexpectedError'));
                }
            }
        }
    };

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return 'bg-gray-100 text-gray-900';
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
                        label={t('register.login')}
                        type="text"
                        register={register('login')}
                        icon={<User />}
                        placeholder={t('register.loginPlaceholder')}
                        error={errors.login?.message}
                    />
                </div>
                <div>
                    <InputField
                        label={t('register.fullName')}
                        type="text"
                        register={register('full_name')}
                        icon={<User />}
                        placeholder={t('register.fullNamePlaceholder')}
                        error={errors.full_name?.message}
                    />
                </div>
                <div className="col-span-2">
                    <InputField
                        label={t('register.email')}
                        type="email"
                        register={register('email')}
                        icon={<Mail />}
                        placeholder={t('register.emailPlaceholder')}
                        error={errors.email?.message}
                    />
                </div>
                <div>
                    <InputField
                        label={t('register.password')}
                        type="password"
                        register={register('password')}
                        icon={<Lock />}
                        placeholder={t('register.passwordPlaceholder')}
                        error={errors.password?.message}
                    />
                </div>
                <div>
                    <InputField
                        label={t('register.passwordConfirmation')}
                        type="password"
                        register={register('passwordConfirmation')}
                        icon={<Lock />}
                        placeholder={t('register.passwordConfirmationPlaceholder')}
                        error={errors.passwordConfirmation?.message}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        {t('register.country')}
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
                                        backgroundColor: theme === 'dark' ? '#2d3748' : theme === 'blue' ? '#1e3a8a' : '#ffffff', // Dark: #2d3748, Blue: #1e3a8a, Light: #ffffff
                                        borderColor: theme === 'dark' ? '#4a5568' : theme === 'blue' ? '#1e40af' : '#e2e8f0', // Dark: #4a5568, Blue: #1e40af, Light: #e2e8f0
                                        color: theme === 'dark' || theme === 'blue' ? '#ffffff' : '#000000', // Text color
                                        borderRadius: '8px',
                                        boxShadow: theme === 'dark' ? '0 2px 4px rgba(255, 255, 255, 0.1)' : theme === 'blue' ? '0 2px 4px rgba(30, 58, 138, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }),
                                    option: (baseStyles, state) => ({
                                        ...baseStyles,
                                        backgroundColor: state.isSelected
                                            ? (theme === 'dark' ? '#4a5568' : theme === 'blue' ? '#2563eb' : '#3182ce') // Selected: Dark: #4a5568, Blue: #2563eb, Light: #3182ce
                                            : state.isFocused
                                                ? (theme === 'dark' ? 'black' : theme === 'blue' ? '#1e3a8a' : 'white') // Focused: Dark: black, Blue: #1e3a8a, Light: white
                                                : (theme === 'dark' ? '#2d3748' : theme === 'blue' ? '#1e40af' : '#edf2f7'), // Default: Dark: #2d3748, Blue: #1e40af, Light: #edf2f7
                                        color: state.isSelected ? '#ffffff' : (theme === 'dark' || theme === 'blue' ? '#ffffff' : '#000000'), // Text color
                                        cursor: 'pointer',
                                    }),
                                    singleValue: (baseStyles) => ({
                                        ...baseStyles,
                                        color: theme === 'dark' || theme === 'blue' ? '#ffffff' : '#000000', // Text color for the selected value
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>{t('register.button')}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                <GoogleAuthButton
                    containerRef={containerRef}
                    loadingMessage={t('register.loading')}
                    successMessage={t('register.googleSuccess')}
                />
            </form>
        </div>
    );
}

export default Register;