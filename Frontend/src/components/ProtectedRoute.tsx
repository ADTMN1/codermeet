import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute = ({
  redirectPath = '/login',
  children,
}: ProtectedRouteProps) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const PublicOnlyRoute = ({
  redirectPath = '/dashboard',
  children,
}: ProtectedRouteProps) => {
  if (authService.isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
