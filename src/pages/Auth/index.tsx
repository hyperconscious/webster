import { useState, useEffect } from 'react';
import { LogIn, UserPlus, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthStore from '../../store/AuthStore';
import Login from './Login';
import Register from './Register';
import Reset from './Reset';

type FormType = 'login' | 'register' | 'reset';

function Authentication() {
    const [formType, setFormType] = useState<FormType>('login');
    const navigate = useNavigate();
    const [tokens] = useState(AuthStore.getTokens());

 /*   useEffect(() => {
        console.log('Tokens:', tokens);
        if (tokens.accessToken) {
            navigate('/');
        }
    }, [tokens, navigate]);*/

    const renderForm = () => {
        switch (formType) {
            case 'login':
                return <Login />
            case 'register':
                return <Register />
            case 'reset':
                return <Reset />
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

                    {renderForm()}

                    <div className="mt-6 flex items-center justify-center space-x-4">
                        <button
                            onClick={() => setFormType('login')}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition duration-200 ${formType === 'login'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <LogIn className="w-5 h-5" />
                            <span>Login</span>
                        </button>
                        <button
                            onClick={() => setFormType('register')}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition duration-200 ${formType === 'register'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Register</span>
                        </button>
                        <button
                            onClick={() => setFormType('reset')}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition duration-200 ${formType === 'reset'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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