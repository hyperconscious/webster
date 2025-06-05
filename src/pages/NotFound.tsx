import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

interface NotFoundProps {
    theme: string;
}

const NotFound: React.FC<NotFoundProps> = ({ theme }) => {
    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-50',
                    text: 'text-gray-900',
                    muted: 'text-gray-600',
                    border: 'border-gray-200',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
            case 'blue':
                return {
                    bg: 'bg-blue-950',
                    text: 'text-white',
                    muted: 'text-blue-200',
                    border: 'border-blue-800',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    text: 'text-white',
                    muted: 'text-gray-300',
                    border: 'border-gray-800',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center relative overflow-hidden`}>
            {/* Animated Background Circles */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[800px] h-[800px]">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`absolute inset-0 rounded-full ${themeClasses.border} animate-pulse`}
                            style={{
                                animationDelay: `${i}s`,
                                opacity: 0.1
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-8">
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <AlertCircle
                            className="h-24 w-24 text-red-500 animate-pulse"
                            strokeWidth={1.5}
                        />
                        <div className="absolute inset-0 animate-ping opacity-75">
                            <AlertCircle
                                className="h-24 w-24 text-red-500"
                                strokeWidth={1.5}
                            />
                        </div>
                    </div>
                </div>

                <h1 className={`text-8xl font-extrabold mb-4 ${themeClasses.text} animate-fade-in`}>
                    404
                </h1>

                <h2 className={`text-2xl font-semibold mb-4 ${themeClasses.text} animate-slide-up`}>
                    Page Not Found
                </h2>

                <p className={`mb-8 ${themeClasses.muted} animate-slide-up`}>
                    Oops! It seems you've ventured into uncharted territory.
                    <br />
                    The page you're looking for doesn't exist or was moved.
                </p>

                <Link
                    to="/"
                    className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all ${themeClasses.button}`}
                >
                    <Home className="h-4 w-4" />
                    Return Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;