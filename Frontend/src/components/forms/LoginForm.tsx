import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { authService } from '../../services/auth';
import LoadingSpinner from '../ui/loading-spinner';
import { apiService } from '../../services/api';
import { toast } from 'sonner';

// Helper functions for session management
const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown Browser';
};

const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unknown IP';
  }
};

const getAccurateLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return `${data.city}, ${data.country_name}`;
  } catch {
    return 'Unknown Location';
  }
};

const LoginForm: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Get setUser from UserContext
  const { setUser } = useUser();

  // Matrix background animation (keep your existing code)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}()';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#C27AFF';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);

  // Typing animation for placeholder (keep your existing code)
  useEffect(() => {
    const placeholderText = "const user = 'you@example.com';";
    let index = 0;
    const interval = setInterval(() => {
      setTypedPlaceholder(placeholderText.slice(0, index));
      index++;
      if (index > placeholderText.length) index = 0;
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Handle login and update UserContext
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!email || !password) {
      setErrorMessage('Please enter email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      // Save the token using authService
    const token = response.data.token;

if (token && typeof token === 'string') {
  try {
    authService.setToken(token);
    // Also save to localStorage if your app uses it directly
    localStorage.setItem('auth_token', token);
  } catch (err) {
    toast.error('Failed to save authentication token');
  }
} else {
  toast.warning('No token received from server');
}

    // response.data.data.token
const userData = response.data.data; // <--- user info is here

      
      if (userData) {
        // First, set basic user data from login response
        setUser({
          name: userData.name || userData.fullName || email.split('@')[0],
          email: userData.email || email,
          avatar: userData.avatar || userData.profilePicture || userData.profileImage,
          profilePicture: userData.profilePicture || userData.avatar || userData.profileImage,
          points: userData.points || 0,
          bio: userData.bio || '',
          location: userData.location || '',
          website: userData.website || '',
          github: userData.github || '',
          linkedin: userData.linkedin || '',
          skills: userData.skills || [],
          phone: userData.phone || '',
          role: userData.role || 'user', // Add role field
          username: userData.username || '',
          plan: userData.plan || 'Trial',
        });

        // Save user data to localStorage
      localStorage.setItem('user_data', JSON.stringify(userData));

      // Create session record for session management
      try {
        const sessionId = generateSessionId();
        const sessionData = {
          sessionId: sessionId,
          device: getDeviceInfo(),
          ip: await getClientIP(),
          location: await getAccurateLocation(),
          lastActive: new Date().toISOString(),
          current: true,
          isActive: true
        };
        
        // Store session for session management
        const existingSessions = JSON.parse(localStorage.getItem('user_sessions') || '[]');
        existingSessions.push(sessionData);
        localStorage.setItem('user_sessions', JSON.stringify(existingSessions));
        
        console.log('Created new session:', sessionData);
      } catch (sessionError) {
        console.log('Session creation failed:', sessionError);
      }

        // Fetch fresh user data from server to ensure latest profile picture
        try {
          const freshUserData = await apiService.getProfile();
          setUser(freshUserData);
          localStorage.setItem('user_data', JSON.stringify(freshUserData));
        } catch (fetchError) {
          // Could not fetch fresh user data, using login data
        }

        // Redirect to appropriate dashboard
        if (userData.role === 'admin' || userData.role === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        throw new Error('No user data received from server');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Matrix animated background */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      {/* Login form */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 mx-auto mt-20 w-full max-w-sm p-8 bg-black bg-opacity-80 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-neon-purple hover:shadow-[0_0_40px_#C27AFF] transition-shadow duration-500 flex flex-col gap-3"
      >
        <h2
          className="text-5xl font-extrabold text-neon-purple text-center tracking-wider animate-pulse"
          style={{ textShadow: '0 0 12px #C27AFF, 0 0 24px #C27AFF' }}
        >
          LOGIN
        </h2>

        {errorMessage && (
          <div className="text-red-500 text-md text-center">{errorMessage}</div>
        )}

        {/* Email Field */}
        <div className="flex flex-col gap-2 relative">
          <label
            htmlFor="email"
            className="text-sm font-medium text-neon-purple"
            style={{ textShadow: '0 0 4px #C27AFF' }}
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder={email ? '' : typedPlaceholder}
            className="w-full p-3 rounded-md bg-[#1e1e2e] border border-neon-purple 
            text-neon-purple font-mono placeholder:text-neon-purple/50 focus:outline-none 
            focus:border-neon-purple focus:ring-neon-purple transition-all duration-300 caret-neon-purple shadow-sm"
            disabled={isLoading}
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-neon-purple"
            style={{ textShadow: '0 0 4px #C27AFF' }}
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="********"
            className="w-full p-3 rounded-md bg-[#1e1e2e] border border-neon-purple 
            text-neon-purple font-mono placeholder:text-neon-purple/50 focus:outline-none 
            focus:border-neon-purple focus:ring-neon-purple transition-all duration-300 caret-neon-purple shadow-sm"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-neon-purple hover:bg-neon-purple/80 text-white font-bold py-3 rounded-md 
          transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_25px_#C27AFF] shadow-md cursor-pointer
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-neon-purple/80">
          Don't have an account?{' '}
          <a
            href="/signup"
            className="text-neon-purple hover:text-neon-purple/60 hover:underline transition-colors"
          >
            Sign Up
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
