import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import {
  Building, Shield, Zap, Eye, EyeOff, X, CheckCircle, ArrowRight, Sparkles,
  TrendingUp, Users, FileText, Clock, AlertTriangle, Target, Star, ChevronRight
} from 'lucide-react';

const LandingPage = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'signin') {
        // Sign In
        const result = await authService.signIn(formData.email, formData.password);
        
        if (result.success) {
          console.log('Sign in successful, redirecting to profile...');
          // Keep loading state while profile loads
          await onLogin(result.user, true); // true = redirect to profile
          setShowAuthModal(false);
          resetForm();
          setLoading(false);
        } else {
          setError(result.error || 'Failed to sign in');
          setLoading(false);
        }
      } else {
        // Sign Up
        const result = await authService.signUp(formData.email, formData.password, {
          fullName: formData.fullName
        });
        
        console.log('Signup result:', result);
        
        if (result.success) {
          // Check if we have a session - only login if session exists
          if (result.session && result.user) {
            // Session exists - user can login immediately
            console.log('Session available, logging in user and redirecting to profile...');
            // Keep loading state while profile loads
            await onLogin(result.user, true); // true = redirect to profile
            setShowAuthModal(false);
            resetForm();
            setLoading(false);
          } else if (result.user && !result.session) {
            // No session - email confirmation required
            console.log('No session - email confirmation required');
            setShowAuthModal(false);
            resetForm();
            setLoading(false);
            alert('✅ Account created successfully!\n\nPlease check your email to verify your account, then sign in.');
          } else {
            setError('Account created but user data missing. Please try signing in.');
            setLoading(false);
          }
        } else {
          setError(result.error || 'Failed to create account');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred');
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Starting Google OAuth...');
      console.log('Browser allows popups:', !window.navigator.userAgent.includes('Headless'));
      
      const result = await authService.signInWithGoogle();
      
      console.log('OAuth result:', result);
      
      if (result.success) {
        console.log('Google OAuth initiated successfully - redirecting to Google...');
        // The redirect should happen automatically
        // If still here after 2 seconds, something went wrong
        setTimeout(() => {
          if (!window.location.href.includes('accounts.google.com')) {
            console.warn('Redirect did not happen - check if popups are blocked');
            setError('Popup blocked? Please allow popups for this site and try again.');
            setLoading(false);
          }
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      
      if (error.message?.includes('Provider not found')) {
        setError('Google authentication is not configured in Supabase. Please use email/password or contact support.');
      } else if (error.message?.includes('Invalid provider')) {
        setError('Google provider is disabled. Please use email/password login.');
      } else if (error.message?.includes('popup')) {
        setError('Popup blocked! Please allow popups for this site and try again.');
      } else {
        setError(error.message || 'Failed to start Google sign-in. Please check console for details.');
      }
      
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', fullName: '' });
    setError('');
    setShowPassword(false);
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    resetForm();
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    resetForm();
  };

  const switchMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-glow"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-cyan-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-glow animation-delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float"></div>
        <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-rose-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float animation-delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/propply-logo-transparent.png" 
              alt="Propply AI" 
              className="h-12 w-auto"
            />
            <span className="text-2xl font-bold text-white">Propply</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => openAuthModal('signin')}
              className="px-6 py-3 text-white hover:text-purple-200 font-medium transition-all duration-300 hover:scale-105"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg transform hover:scale-105 font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-16 pb-24">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/20 shadow-lg">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-sm font-semibold text-white">AI-Powered Property Compliance</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-bold mb-8 text-white leading-tight">
            Property Compliance<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
              Made Simple
            </span>
          </h1>
          
          <p className="text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Automate inspections, track violations, and stay compliant with AI-powered insights for NYC & Philadelphia properties.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <button
              onClick={() => openAuthModal('signup')}
              className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl transform hover:scale-105 font-semibold text-xl flex items-center space-x-3"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => openAuthModal('signin')}
              className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-lg border border-white/30 font-semibold text-xl"
            >
              Sign In
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-gray-300">Properties Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-300">Compliance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-300">AI Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">Powerful Features</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to manage property compliance with AI-powered insights and automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="group bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">Smart Compliance</h3>
            <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
              AI-powered compliance tracking for NYC & Philadelphia properties with automated violation detection and real-time alerts.
            </p>
            <div className="mt-6 flex items-center text-blue-300 font-medium group-hover:text-blue-200 transition-colors">
              <span>Learn more</span>
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="group bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">Instant Reports</h3>
            <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
              Generate comprehensive compliance reports in seconds with actionable insights, recommendations, and automated scheduling.
            </p>
            <div className="mt-6 flex items-center text-purple-300 font-medium group-hover:text-purple-200 transition-colors">
              <span>Learn more</span>
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature Card 3 */}
          <div className="group bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">Stay Compliant</h3>
            <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
              Never miss a deadline with automated scheduling, reminders, and vendor marketplace integration for seamless compliance.
            </p>
            <div className="mt-6 flex items-center text-green-300 font-medium group-hover:text-green-200 transition-colors">
              <span>Learn more</span>
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature Card 4 */}
          <div className="group bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors">Analytics Dashboard</h3>
            <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
              Track performance metrics, identify trends, and optimize your property management with comprehensive analytics.
            </p>
            <div className="mt-6 flex items-center text-orange-300 font-medium group-hover:text-orange-200 transition-colors">
              <span>Learn more</span>
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature Card 5 */}
          <div className="group bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">Team Collaboration</h3>
            <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
              Collaborate with your team, assign tasks, and track progress with role-based permissions and real-time updates.
            </p>
            <div className="mt-6 flex items-center text-indigo-300 font-medium group-hover:text-indigo-200 transition-colors">
              <span>Learn more</span>
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature Card 6 */}
          <div className="group bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-pink-300 transition-colors">Smart Alerts</h3>
            <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
              Get intelligent notifications about potential violations, upcoming deadlines, and compliance opportunities.
            </p>
            <div className="mt-6 flex items-center text-pink-300 font-medium group-hover:text-pink-200 transition-colors">
              <span>Learn more</span>
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-16 text-center border border-white/20 shadow-2xl">
          <h2 className="text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of property managers who trust Propply for their compliance needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={() => openAuthModal('signup')}
              className="group px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl transform hover:scale-105 font-semibold text-xl flex items-center space-x-3"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => openAuthModal('signin')}
              className="px-12 py-5 bg-white/10 backdrop-blur-sm text-white rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-lg border border-white/30 font-semibold text-xl"
            >
              Sign In to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <button
                  onClick={closeAuthModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                {authMode === 'signin' 
                  ? 'Sign in to access your dashboard' 
                  : 'Get started with your free account'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                    </span>
                  ) : (
                    <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="mt-4 w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={switchMode}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  {authMode === 'signin' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
