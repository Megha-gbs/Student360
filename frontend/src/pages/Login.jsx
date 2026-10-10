import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ROLES = [
  {
    role: 'Admin',
    identifier: 'admin',
    password: 'password123',
    icon: Building2,
  },
  {
    role: 'Faculty',
    identifier: 'faculty',
    password: 'password123',
    icon: Users,
  },
  {
    role: 'Student',
    identifier: 'student',
    password: 'password123',
    icon: GraduationCap,
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setSelectedRole(null);
    if (error) {
      setError('');
    }
  };

  const handleSelectDemoAccount = (acc) => {
    setIdentifier(acc.identifier);
    setPassword(acc.password);
    setSelectedRole(acc.role);
    setError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter your username and password.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await login(cleanId, cleanPass);
    setLoading(false);

    if (res.success) {
      const userRole = res.user?.role;
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      setError(
        res.error === 'Invalid credentials' || res.error?.toLowerCase().includes('credential') || res.error?.toLowerCase().includes('user') || res.error?.toLowerCase().includes('password')
          ? 'Invalid institutional ID, email, or password. Please verify your credentials and try again.'
          : res.error || 'Authentication failed. Please verify your network connection and credentials.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1A1A1A] flex flex-col justify-between py-10 px-4 sm:px-6">
      {/* Institutional Brand Header */}
      <div className="w-full max-w-md mx-auto text-center pt-2 pb-6">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <div className="w-11 h-11 rounded bg-[#00338D] flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
              Student<span className="text-[#00338D]">360</span>
            </h1>
            <p className="text-[11px] font-medium text-[#767676] uppercase tracking-wider">
              Smart Campus Analytics Platform
            </p>
          </div>
        </div>
      </div>

      {/* Main Login Card & Simple 3-Card Role Selector */}
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Simple Demo Role Autofill Cards */}
        <div className="bg-white border border-[#D0D0D0] rounded p-3 shadow-sm">
          <div className="text-[11px] font-semibold text-[#767676] mb-2 px-1">
            Demo Evaluation Accounts:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ROLES.map((acc) => {
              const Icon = acc.icon;
              const isSelected = selectedRole === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemoAccount(acc)}
                  className={`py-2.5 px-3 rounded text-center border transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-50/80 border-[#00338D] ring-2 ring-[#00338D]/25 font-bold text-[#00338D]'
                      : 'bg-[#FAFAFA] border-[#D0D0D0] hover:bg-white hover:border-[#00338D]/60 text-[#1A1A1A] font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#00338D]' : 'text-[#767676]'}`} />
                  <span className="text-xs">{acc.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-[#D0D0D0] rounded shadow-sm p-7 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#1A1A1A]">
              Institutional Sign In
            </h2>
            <p className="text-xs text-[#767676] mt-1">
              Sign in with your username or select a demo account above.
            </p>
          </div>

          {/* Inline Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="identifier-input"
                className="block text-xs font-semibold text-[#1A1A1A] mb-1.5"
              >
                Username / Email / Student ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#767676]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier-input"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={handleInputChange(setIdentifier)}
                  placeholder="e.g. admin, faculty, or student"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded bg-[#FAFAFA] border border-[#D0D0D0] text-[#1A1A1A] placeholder:text-[#767676] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00338D] focus:border-[#00338D] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-semibold text-[#1A1A1A]"
                >
                  Password
                </label>
                <span className="text-xs text-[#00338D] hover:underline cursor-pointer font-medium">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#767676]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded bg-[#FAFAFA] border border-[#D0D0D0] text-[#1A1A1A] placeholder:text-[#767676] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00338D] focus:border-[#00338D] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#767676] hover:text-[#1A1A1A] transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#00338D] hover:bg-[#002875] active:bg-[#001D54] text-white font-semibold rounded text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>

          {/* Secure Institutional Access Notice */}
          <div className="mt-6 pt-5 border-t border-[#EAEAEA] flex items-center justify-center gap-2 text-[11px] text-[#767676]">
            <ShieldCheck className="w-4 h-4 text-[#00338D]" />
            <span>Secure 256-Bit Encrypted Campus Authentication</span>
          </div>
        </div>
      </div>

      {/* Institutional Footer */}
      <footer className="w-full max-w-2xl mx-auto text-center text-xs text-[#767676] pt-8 pb-2 space-y-1">
        <div>
          Student360 &bull; KPMG Smart Campus Analytics System
        </div>
        <div className="text-[11px] text-[#767676]">
          For login assistance or account provisioning, please contact the IT Helpdesk at{' '}
          <span className="text-[#1A1A1A] font-medium">it-support@smartcampus.edu</span>
        </div>
      </footer>
    </div>
  );
}
