import { useState, useEffect } from 'react';
import { LogIn, UserPlus, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthStore from '../../store/AuthStore';
import Login from './Login';
import Register from './Register';
import Reset from './Reset';
import type { Theme } from '../../types';

type FormType = 'login' | 'register' | 'reset';

interface AuthenticationProps {
    theme: Theme;
}

function Authentication({ theme }: AuthenticationProps) {
    const [formType, setFormType] = useState<FormType>('login');
    const navigate = useNavigate();
    const [tokens] = useState(AuthStore.getTokens());

    useEffect(() => {
        if (tokens.accessToken) {
            navigate('/');
        }
    }, [tokens, navigate]);

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-50',
                    card: 'bg-white',
                    text: 'text-gray-900',
                    button: {
                        active: 'bg-blue-50 text-blue-600',
                        inactive: 'text-gray-600 hover:bg-gray-100'
                    }
                };
            case 'blue':
                return {
                    bg: 'bg-blue-950',
                    card: 'bg-blue-900',
                    text: 'text-white',
                    button: {
                        active: 'bg-blue-800/20 text-blue-400',
                        inactive: 'text-gray-300 hover:bg-blue-800'
                    }
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    button: {
                        active: 'bg-gray-700/20 text-gray-300',
                        inactive: 'text-gray-300 hover:bg-gray-700'
                    }
                };
        }
    };

    const themeClasses = getThemeClasses();

    const renderForm = () => {
        switch (formType) {
            case 'login':
                return <Login theme={theme} />
            case 'register':
                return <Register theme={theme} />
            case 'reset':
                return <Reset theme={theme} />
        }
    };

    return (
        <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center p-4`}>
            <div className="max-w-md w-full">
                <div className={`${themeClasses.card} rounded-2xl shadow-xl p-8`}>
                    {renderForm()}

                    <div className="mt-6 flex items-center justify-center space-x-4">
                        <button
                            onClick={() => setFormType('login')}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition duration-200 ${
                                formType === 'login'
                                    ? themeClasses.button.active
                                    : themeClasses.button.inactive
                            }`}
                        >
                            <LogIn className="w-5 h-5" />
                            <span>Login</span>
                        </button>
                        <button
                            onClick={() => setFormType('register')}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition duration-200 ${
                                formType === 'register'
                                    ? themeClasses.button.active
                                    : themeClasses.button.inactive
                            }`}
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Register</span>
                        </button>
                        <button
                            onClick={() => setFormType('reset')}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition duration-200 ${
                                formType === 'reset'
                                    ? themeClasses.button.active
                                    : themeClasses.button.inactive
                            }`}
                        >
                            <KeyRound className="w-5 h-5" />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Authentication;