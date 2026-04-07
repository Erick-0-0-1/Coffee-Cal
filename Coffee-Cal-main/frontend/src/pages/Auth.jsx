import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Facebook, Chrome, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import api, { wakeUpServer } from '../services/api';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [serverStatus, setServerStatus] = useState('waking'); // 'waking' | 'ready' | 'offline'

  const navigate = useNavigate();

  // ── Wake up Render server on page load ──────────────────────────────────────
  useEffect(() => {
    setServerStatus('waking');
    wakeUpServer()
      .then(() => setServerStatus('ready'))
      .catch(() => setServerStatus('offline'));
  }, []);

  // ── OTP input handler ────────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // ── Send OTP (Register flow) ─────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await api.post('/auth/send-login-otp', { username: email });
        setPendingEmail(res.data.email);
      } else {
        await api.post('/auth/send-otp', { email, username, password });
        setPendingEmail(email);
      }
      setShowOtpScreen(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', {
          username: email,
          password,
          otp: otpCode,
        });
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        navigate('/dashboard');
      } else {
        const res = await api.post('/auth/verify-otp', {
          email: pendingEmail,
          otp: otpCode,
        });
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Login flow ───────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/send-login-otp', { username: email });
      setPendingEmail(res.data.email);
      setShowOtpScreen(true);
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Social login ─────────────────────────────────────────────────────────────
  const handleSocialLogin = (provider) => {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
    window.location.href = `${backendUrl}/oauth2/authorization/${provider}`;
  };

  // ── Server status banner ─────────────────────────────────────────────────────
  const ServerBanner = () => {
    if (serverStatus === 'ready') return null;
    return (
      <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg mb-4 ${
        serverStatus === 'waking'
          ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}>
        {serverStatus === 'waking' ? (
          <>
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
            Server is waking up — this may take up to 30 seconds on first load.
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            Cannot reach the server. Please try again later.
          </>
        )}
      </div>
    );
  };

  // ── OTP Screen ───────────────────────────────────────────────────────────────
  if (showOtpScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="text-gray-600 mt-2">
              We sent a 6-digit code to <span className="font-semibold">{pendingEmail}</span>
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.some((d) => !d)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify Code
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full mt-4 text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-medium transition-colors"
          >
            Resend code
          </button>

          <button
            onClick={() => {
              setShowOtpScreen(false);
              setOtp(['', '', '', '', '', '']);
              setError('');
            }}
            className="w-full mt-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Main Auth Screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12">

        {/* Brand */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-5xl font-extrabold text-blue-600 mb-4">coffeeCalc</h1>
          <p className="text-xl text-gray-700 max-w-md">
            Professional coffee costing calculator for your business. Manage recipes, track costs,
            and maximize profits.
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-6">

            <ServerBanner />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Tab toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  !isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Social login */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSocialLogin('google')}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-colors"
              >
                <Chrome className="w-5 h-5" />
                Continue with Google
              </button>
              <button
                onClick={() => handleSocialLogin('facebook')}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                <Facebook className="w-5 h-5" />
                Continue with Facebook
              </button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  or {isLogin ? 'login' : 'sign up'} with email
                </span>
              </div>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleSendOtp} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={isLogin ? 'Username or Email' : 'Email address'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || serverStatus === 'offline'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {serverStatus === 'waking' ? 'Waking server...' : 'Please wait...'}
                  </>
                ) : (
                  isLogin ? 'Log In' : 'Create Account'
                )}
              </button>
            </form>

            {isLogin && (
              <div className="text-center mt-4">
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Forgot password?
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;