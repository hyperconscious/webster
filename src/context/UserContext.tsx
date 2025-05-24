import React, { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import type { User } from '../types/user';
import UserService from '../services/UserService';
import AuthStore from '../store/AuthStore';

interface UserContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    refreshUser: () => Promise<void>;
}
export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const refreshUser = useCallback(async () => {
        const tokens = AuthStore.getTokens();
        if (tokens.accessToken && tokens.refreshToken) {
            try {
                const userData = await UserService.getMyProfile();
                setUser(userData);
            } catch (error) {
                console.error('Failed to fetch user profile', error);
                // If there's an error fetching the user profile, clear the user state
                setUser(null);
            }
        } else {
            // If no tokens, clear the user state
            setUser(null);
        }
    }, []);

    // Initial load and token change handler
    useEffect(() => {
        refreshUser();
        // Add event listener for storage changes (for cross-tab synchronization)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'accessToken' || e.key === 'refreshToken') {
                refreshUser();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [refreshUser]);

    return (
        <UserContext.Provider value={{ user, setUser, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};
