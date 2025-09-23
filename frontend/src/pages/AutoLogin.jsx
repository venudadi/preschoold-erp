import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../services/api';

const AutoLogin = () => {
  const [msg, setMsg] = useState('Logging in...');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const email = searchParams.get('email');
      const password = searchParams.get('password');
      if (!email || !password) {
        setMsg('Missing email or password query params');
        return;
      }
      try {
        const data = await loginUser(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('csrfToken', data.csrfToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setMsg('Success. Redirecting...');
        navigate('/');
      } catch (e) {
        setMsg('Login failed: ' + (e?.message || 'unknown error'));
      }
    };
    run();
  }, [navigate, searchParams]);

  return <div style={{ padding: 16 }}>{msg}</div>;
};

export default AutoLogin;
