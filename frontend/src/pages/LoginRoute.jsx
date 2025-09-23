import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoginPage from './LoginPage.jsx';
import { useApi } from '../services/api';

const LoginRoute = () => {
  const [checking, setChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const api = useApi();

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('token');
      const sessionToken = localStorage.getItem('sessionToken');
      if (!token || !sessionToken) {
        setChecking(false);
        return;
      }
      try {
        await api.get('/auth/verify');
        setShouldRedirect(true);
      } catch {
        // tokens invalid; stay on login
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [api]);

  if (checking) return null; // minimal flicker
  if (shouldRedirect) return <Navigate to="/" replace />;
  return <LoginPage />;
};

export default LoginRoute;
