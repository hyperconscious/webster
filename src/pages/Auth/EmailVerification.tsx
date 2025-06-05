import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import { notifyDismiss, notifyError, notifyLoading, notifySuccess } from '../../utils/notification';
import axios from 'axios';
import type { Theme } from '../../types';

interface EmailVerificationProps {
    theme: Theme;
}

const EmailVerificationPage: React.FC<EmailVerificationProps> = ({ theme }) => {
    const [error, setError] = React.useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            if (!token) {
                notifyError("Invalid or missing token.");
                setError("Invalid or missing token.");
                return;
            }
            const loadId = notifyLoading("Verifying your email...");
            try {
                await AuthService.verifyEmail(token);
                notifyDismiss(loadId);
                notifySuccess('Email verified successfully! Redirecting to login page...');
                setTimeout(() => navigate('/auth'), 4000);
            } catch (error) {
                notifyDismiss(loadId);
                if (axios.isAxiosError(error)) {
                    if (error.response && error.response.data && error.response.data.message) {
                        setError(error.response.data.message);
                    } else {
                        setError("An unexpected error occurred. Please try again.");
                    }
                } else {
                    setError("An unexpected error occurred. Please try again.");
                }
            };
        };
        verifyEmail();
    }, [searchParams, navigate]);

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-50',
                    text: 'text-gray-900'
                };
            case 'blue':
                return {
                    bg: 'bg-blue-950',
                    text: 'text-white'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    text: 'text-white'
                };
        }
    };

    const themeClasses = getThemeClasses();

    return (
        <div className={`flex flex-col items-center justify-center h-screen ${themeClasses.bg}`}>
            {error ?
                <p className={`mb-16 ${themeClasses.text}`}>{error}</p>
                :
                <p className={`mb-16 ${themeClasses.text}`}>Please wait while we verify your email.</p>
            }
            <img
                src="https://i.gifer.com/7VE.gif"
                alt="Loading GIF"
                className="object-cover w-272 h-272"
            ></img>
        </div>
    );
}

export default EmailVerificationPage;