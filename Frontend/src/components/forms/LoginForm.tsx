import React, { useEffect, useRef, useState } from 'react';

const LoginForm: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [typedPlaceholder, setTypedPlaceholder] = useState('');

  // Matrix background animation
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

  // Typing animation for placeholder
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging in with:', { email, password });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Matrix animated background */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      {/* Login form */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 mx-auto mt-20 w-full max-w-sm p-8 bg-black bg-opacity-80 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-neon-purple hover:shadow-[0_0_40px_#C27AFF] transition-shadow duration-500 flex flex-col gap-6"
      >
        <h2
          className="text-5xl font-extrabold text-neon-purple text-center tracking-wider animate-pulse"
          style={{ textShadow: '0 0 12px #C27AFF, 0 0 24px #C27AFF' }}
        >
          LOGIN
        </h2>

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
    focus:border-neon-purple  focus:ring-neon-purple transition-all 
    duration-300 caret-neon-purple shadow-sm"
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
    focus:border-neon-purple  focus:ring-neon-purple transition-all 
    duration-300 caret-neon-purple shadow-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-neon-purple hover:bg-neon-purple/80 text-white font-bold py-3 rounded-md 
            transition-transform transform hover:scale-105 hover:shadow-[0_0_25px_#C27AFF] shadow-md cursor-pointer"
        >
          Sign In
        </button>

        {/* Sign Up */}
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

      {/* Autofill and caret fix */}
      <style>{`
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0px 1000px #1e1e2e inset; /* background */
    -webkit-text-fill-color: #C27AFF;               /* text color */
    border: 2px solid #C27AFF;                      /* keep border neon */
    transition: background-color 5000s ease-in-out 0s;
  }

  .caret-neon-purple {
    caret-color: #C27AFF;
  }

  @keyframes blink {
    0%, 50%, 100% { opacity: 1; }
    25%, 75% { opacity: 0; }
  }
`}</style>
    </div>
  );
};

export default LoginForm;
