import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    skipAuthRoutes?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, skipAuthRoutes }) => {
    const { user } = useContext(UserContext) || {};
    if (!user && !skipAuthRoutes) {
        return <Navigate to="/auth" />;
    }
    return <>{children}</>;
};

export default ProtectedRoute;