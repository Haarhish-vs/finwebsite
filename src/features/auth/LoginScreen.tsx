import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email/username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid administrator credentials. Please check and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Brand & Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
              <Shield className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">finance-app</h2>
              <p className="text-xs text-[#64748B] mt-1 font-medium">Authorized Admin Sign In</p>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Admin Username / Email *"
              placeholder="e.g. ashokfinapp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefixIcon={<User className="w-4 h-4 text-slate-400" />}
              autoComplete="username"
              required
            />

            <div>
              <Input
                label="Admin Password *"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4 text-slate-400" />}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-bold tracking-wide"
              loading={isLoading}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Security Banner Note */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-[#94A3B8] font-medium">
              Authorized Personnel Only • Secure Single Administrator Access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
