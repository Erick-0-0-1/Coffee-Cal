import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Facebook, Chrome, ArrowRight, WifiOff, Coffee } from 'lucide-react';
import api, { wakeUpServer } from '../services/api';

const Auth = () => {
  const [step, setStep] = useState('form');  // 'form' | 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [form, setForm] = useState({ email: '', password: '' });
  const [pendingEmail, setPendingEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('waking');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    wakeUpServer()
      .then(() => setServerStatus('ready'))
      .catch(() => setServerStatus('offline'));
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── OTP input ────────────────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    document.getElementById(`otp-${focusIdx}`)?.focus();
  };

  // ── Send Login OTP ───────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Direct call to login OTP endpoint
      const res = await api.post('/auth/send-login-otp', { username: form.email });
      setPendingEmail(res.data.email);
      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        username: form.email,
        password: form.password,
        otp: code,
      });
      localStorage.setItem('token', res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      // Force a hard redirect to ensure the app state refreshes with the new token
      window.location.href = '/dashboard';
      
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
    window.location.href = `${backendUrl}/oauth2/authorization/${provider}`;
  };

  const otpComplete = otp.every(d => d !== '');

  const ServerBanner = () => {
    if (serverStatus === 'ready') return null;
    return (
      <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-4 ${
        serverStatus === 'waking' ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-red-50 border border-red-200 text-red-700'
      }`}>
        {serverStatus === 'waking' ? (
          <><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span>Server warming up — first load may take ~30s</span></>
        ) : (
          <><WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>Cannot reach the server. Please try again later.</span></>
        )}
      </div>
    );
  };

  // ── OTP screen ────────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
            <p className="text-gray-500 text-sm mt-1">We sent a 6-digit code to</p>
            <p className="font-semibold text-gray-800 text-sm mt-0.5 break-all">{pendingEmail}</p>
          </div>

          <div className="flex justify-center gap-2 mb-5" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                autoFocus={i === 0}
                className={`w-11 h-13 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                  ${digit ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-900'}
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
                style={{ height: '52px' }}
              />
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 mb-4 text-sm text-center">{error}</div>}

          <button
            onClick={handleVerifyOtp}
            disabled={loading || !otpComplete}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</> : <><span>Verify code</span><ArrowRight className="w-4 h-4" /></>}
          </button>

          <div className="flex items-center justify-between mt-4">
            <button onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); setError(''); }} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← Back</button>
            <button onClick={handleSendOtp} disabled={loading || resendCooldown > 0} className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main login screen ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center gap-10">

        {/* Brand panel */}
        <div className="flex-1 text-center lg:text-left px-4">
          <div className="flex items-center gap-3 justify-center lg:justify-start mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-blue-600">coffeeCalc</h1>
          </div>
          <p className="text-gray-600 max-w-sm leading-relaxed">
            Professional coffee costing calculator. Manage recipes, track costs, and maximize your profits.
          </p>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">

            <ServerBanner />

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-sm mb-6">Log in to manage your coffee recipes</p>

            {/* Social buttons */}
            <div className="space-y-2 mb-5">
              <button onClick={() => handleSocialLogin('google')} className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl transition-colors text-sm">
                <Chrome className="w-4 h-4" /> Continue with Google
              </button>
              <button onClick={() => handleSocialLogin('facebook')} className="w-full flex items-center justify-center gap-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                <Facebook className="w-4 h-4" /> Continue with Facebook
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">or use your email</span></div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username or email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || serverStatus === 'offline'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-1"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {serverStatus === 'waking' ? 'Waking server…' : 'Sending code…'}</> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="text-center mt-4">
              <a href="#" className="text-blue-600 hover:text-blue-700 text-xs font-medium">Forgot password?</a>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;