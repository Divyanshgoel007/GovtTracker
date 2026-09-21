import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Eye, EyeOff, Loader2, UserPlus, MapPin, Shield, Bell, CheckCircle, X } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/register', { 
        name, 
        username, 
        email, 
        password 
      });
      setSuccess(res.data.message || 'Account created successfully!');
      
      // Clear form on success
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || 'Registration failed';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* ===== LEFT PANEL — Visual Story ===== */}
      <div className="login-hero">
        <div className="login-hero-bg">
          <div className="hero-circle hero-circle-1" />
          <div className="hero-circle hero-circle-2" />
          <div className="hero-circle hero-circle-3" />
        </div>

        <div className="login-hero-content">
          <img
            src="/logohorigental.svg"
            alt="GovTracker"
            className="login-hero-logo"
          />

          <h1 className="login-hero-title">Join GovTracker</h1>
          <p className="login-hero-subtitle">Create an account to start tracking your public transit in real-time.</p>

          <div className="login-hero-features">
            <div className="hero-feature-pill">
              <MapPin className="w-4 h-4" />
              <span>Live Tracking</span>
            </div>
            <div className="hero-feature-pill">
              <Bell className="w-4 h-4" />
              <span>Smart Alerts</span>
            </div>
            <div className="hero-feature-pill">
              <Shield className="w-4 h-4" />
              <span>Secure Account</span>
            </div>
          </div>

          <div className="login-hero-illustration">
            <svg viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs opacity-30">
              <path d="M 20 80 Q 80 20 160 60 T 300 40" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="6 4" fill="none">
                <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
              </path>
              <rect x="120" y="50" width="80" height="40" rx="8" fill="rgba(255,255,255,0.25)">
                <animateTransform attributeName="transform" type="translate" values="0,0;4,-2;0,0" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect x="130" y="56" width="14" height="12" rx="2" fill="rgba(255,255,255,0.4)">
                <animateTransform attributeName="transform" type="translate" values="0,0;4,-2;0,0" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect x="150" y="56" width="14" height="12" rx="2" fill="rgba(255,255,255,0.4)">
                <animateTransform attributeName="transform" type="translate" values="0,0;4,-2;0,0" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect x="170" y="56" width="14" height="12" rx="2" fill="rgba(255,255,255,0.4)">
                <animateTransform attributeName="transform" type="translate" values="0,0;4,-2;0,0" dur="3s" repeatCount="indefinite" />
              </rect>
              <circle cx="140" cy="92" r="6" fill="rgba(255,255,255,0.3)">
                <animateTransform attributeName="transform" type="translate" values="0,0;4,-2;0,0" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="180" cy="92" r="6" fill="rgba(255,255,255,0.3)">
                <animateTransform attributeName="transform" type="translate" values="0,0;4,-2;0,0" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="40" cy="72" r="5" fill="rgba(255,255,255,0.5)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="270" cy="44" r="5" fill="rgba(255,255,255,0.5)">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Auth Card ===== */}
      <div className="login-form-panel" style={{ overflowY: 'auto' }}>
        <div className="login-card login-card-animate" style={{ margin: 'auto' }}>
          <div className="login-card-mobile-logo">
            <img src="/logohorigental.svg" alt="TrackMate" className="h-10 mobile-logo-img" />
          </div>

          <div className="mb-7">
            <h2 className="login-card-title">Create Account</h2>
            <p className="login-card-subtitle">Sign up to get real-time bus tracking alerts.</p>
          </div>

          {success && (
            <div className="login-card-animate rounded-xl px-4 py-3 text-sm flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 mb-5">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success} Redirecting to login...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="login-field">
              <label className="login-label">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="login-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="login-field">
              <label className="login-label">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Username / Passenger ID */}
            <div className="login-field">
              <label className="login-label">Passenger ID / Username</label>
              <input
                type="text"
                placeholder="Choose a unique ID or username"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="login-input pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error login-card-animate mt-2">
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="login-btn-primary mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          {/* Footer hint */}
          <p className="text-center mt-6 text-sm text-gray-600 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 hover:text-orange-600 transition-colors">
              Log In here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Register;
