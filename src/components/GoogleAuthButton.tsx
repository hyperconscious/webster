import { type CredentialResponse, GoogleLogin} from "@react-oauth/google";
import React, { type RefObject, useEffect, useState, useContext } from "react";
import { notifyDismiss, notifyLoading, notifySuccess } from "../utils/notification.tsx";
import AuthService from "../services/AuthService.ts";
import AuthStore from "../store/AuthStore.ts";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

interface GoogleAuthButtonProps {
    containerRef: RefObject<HTMLDivElement>;
    loadingMessage: string,
    successMessage: string
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
    containerRef,
    loadingMessage,
    successMessage
}) => {
    const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
    const navigate = useNavigate();
    const { refreshUser } = useContext(UserContext) || {};

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, [containerRef]);

    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        const loginId = notifyLoading(loadingMessage);
        try {
            if (credentialResponse.credential) {
                const { accessToken, refreshToken } = await AuthService.googleLogin(
                    credentialResponse.credential
                );
                AuthStore.setTokens(accessToken, refreshToken);
                if (refreshUser) {
                    await refreshUser();
                }
                notifyDismiss(loginId);
                notifySuccess(successMessage);
                navigate('/');
            } else {
                throw new Error('No credential received from Google');
            }
        } catch (error) {
            notifyDismiss(loginId);
            console.error('Failed to login with Google', error);
        }
    };

    const handleError = () => {
        console.log('Google login failed');
    };

    return (
        <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            auto_select={true}
            theme={"filled_blue"}
            text={'continue_with'}
            useOneTap
            width={containerWidth}
            containerProps={{
                style: {
                    colorScheme: "light",
                }
            }}
        />
    )
}
