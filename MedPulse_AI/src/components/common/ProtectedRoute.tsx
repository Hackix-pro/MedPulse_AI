import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRole?: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    if (role === 'patient') {
      return <Navigate to="/patient/dashboard" replace />;
    } else if (role === 'doctor') {
      return <Navigate to="/doctor/dashboard" replace />;
    }
  }

  return children;
};
