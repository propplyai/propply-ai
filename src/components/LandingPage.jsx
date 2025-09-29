import React, { useState, useEffect } from 'react';
import { supabase, APP_CONFIG } from '../config/supabase';
import { authService } from '../services/auth';
import {
  Building, Users, BarChart3, Calendar, CheckCircle, ArrowRight,
  Shield, Zap, Eye, EyeOff, X
} from 'lucide-react';

const LandingPage = ({ onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.signIn(email, password);
      
      if (result.success) {
        onLogin(result.user);
        setShowLogin(false);
        // Clear form
        setEmail('');
        setPassword('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Starting signup process...');
      
      const result = await authService.signUp(email, password, {
        fullName: fullName
      });
      
      console.log('Signup result:', result);
      
      if (result.success) {
        if (result.user) {
          onLogin(result.user);
          setShowSignup(false);
          // Clear form
          setEmail('');
          setPassword('');
          setFullName('');
        } else {
          // Email confirmation required
          setError('Please check your email to verify your account before signing in.');
        }
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error in component:', error);
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Starting Google OAuth...');
      console.log('Supabase URL:', supabase.supabaseUrl);
      
      // Use the auth service for consistent error handling
      const result = await authService.signInWithGoogle();
      
      if (result.success) {
        console.log('Google OAuth initiated successfully');
        // The redirect should happen automatically
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Google OAuth error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('Provider not found')) {
        setError('Google authentication is not configured. Please contact support.');
      } else if (error.message?.includes('Invalid provider')) {
        setError('Google authentication is not available. Please use email/password.');
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        setError('OAuth configuration error. Please contact support.');
      } else {
        setError(error.message || 'Failed to sign in with Google. Please try again.');
      }
      
      setLoading(false);
    }
  };

  // Remove the old createOrUpdateUserProfile function since it's now handled in authService

  const features = [
    {
      icon: Building,
      title: 'Locale-Aware Compliance',
      description: 'NYC & Philadelphia specific compliance punch lists with swipe-to-remove functionality'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'AI-powered insights and risk assessment for your property portfolio'
    },
    {
      icon: Users,
      title: 'Vendor Marketplace',
      description: 'Connect with certified vendors and generate formal RFPs'
    },
    {
      icon: Calendar,
      title: 'Automated Scheduling',
      description: 'Never miss an inspection with intelligent scheduling and reminders'
    },
    {
      icon: Shield,
      title: 'Report Library',
      description: 'Centralized reports with 30-day updates and 12-month entitlements'
    },
    {
      icon: Zap,
      title: 'Quick To-Dos',
      description: 'Generate property-specific action items with portfolio roll-up'
    }
  ];

  const pricingPlans = Object.entries(APP_CONFIG.subscriptionTiers).map(([key, plan]) => ({
    key,
    ...plan,
    popular: key === 'enterprise_monthly'
  }));

  return (
    <>
      {/* Add the CSS styles */}
      <style>{`
        :root {
          --primary-navy: #0F172A;
          --electric-blue: #3B82F6;
          --emerald-green: #10B981;
          --amber-highlight: #F59E0B;
          --slate-50: #F8FAFC;
          --slate-100: #F1F5F9;
          --slate-200: #E2E8F0;
          --slate-300: #CBD5E1;
          --slate-400: #94A3B8;
          --slate-500: #64748B;
          --slate-600: #475569;
          --slate-700: #334155;
          --slate-800: #1E293B;
          --slate-900: #0F172A;
          --white: #FFFFFF;
          
          --font-inter: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
          
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
          
          --radius-sm: 0.375rem;
          --radius: 0.5rem;
          --radius-md: 0.75rem;
          --radius-lg: 1rem;
          --radius-xl: 1.5rem;
          --radius-2xl: 2rem;
        }

        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideDown 0.8s ease-out;
        }

        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .nav-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 4rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          font-size: 1.5rem;
          color: var(--primary-navy);
          text-decoration: none;
          transition: all 0.3s ease;
          animation: fadeInLeft 1s ease-out 0.2s both;
        }

        .logo:hover {
          transform: scale(1.05);
        }

        .logo-image {
          height: 2.5rem;
          width: auto;
          transition: all 0.3s ease;
          animation: pulse 2s infinite;
        }

        .logo-image:hover {
          transform: rotate(5deg) scale(1.1);
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
          list-style: none;
        }

        .nav-link {
          color: var(--slate-600);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          animation: fadeInRight 1s ease-out 0.4s both;
        }

        .nav-link:hover {
          color: var(--electric-blue);
          transform: translateY(-2px);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--electric-blue), var(--emerald-green));
          transition: width 0.3s ease;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .hero {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--slate-50) 0%, rgba(59, 130, 246, 0.03) 50%, var(--slate-50) 100%);
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding-top: 4rem;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="%233B82F6" stroke-width="0.5" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          animation: backgroundMove 20s linear infinite;
          opacity: 0.3;
        }

        @keyframes backgroundMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-10px, -10px); }
        }

        .hero-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
          position: relative;
          z-index: 2;
        }

        .hero-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          animation: fadeInUp 1.2s ease-out 0.6s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: var(--radius-2xl);
          color: var(--electric-blue);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 2rem;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 800;
          color: var(--primary-navy);
          margin-bottom: 1.5rem;
          line-height: 1.1;
          animation: titleGlow 3s ease-in-out infinite alternate;
        }

        @keyframes titleGlow {
          from {
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          to {
            text-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 40px rgba(16, 185, 129, 0.3);
          }
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--slate-600);
          margin-bottom: 2rem;
          line-height: 1.6;
          animation: fadeInUp 1.2s ease-out 0.8s both;
        }

        .hero-cta {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          margin-bottom: 3rem;
          animation: fadeInUp 1.2s ease-out 1s both;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border-radius: var(--radius-lg);
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: none;
          font-size: 1rem;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .btn:hover::before {
          left: 100%;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--electric-blue), #2563EB);
          color: white;
          box-shadow: var(--shadow-md);
          animation: buttonPulse 2s infinite;
        }

        .btn-primary:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
        }

        @keyframes buttonPulse {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
          }
        }

        .btn-secondary {
          background: var(--white);
          color: var(--slate-700);
          border: 2px solid var(--slate-200);
        }

        .btn-secondary:hover {
          background: var(--slate-50);
          border-color: var(--electric-blue);
          color: var(--electric-blue);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }


        @keyframes iconFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(5deg);
          }
        }

        .pricing-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideInUp 0.8s ease-out both;
          position: relative;
          overflow: hidden;
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          transform: rotate(45deg);
          transition: all 0.6s ease;
          opacity: 0;
        }

        .pricing-card:hover::before {
          animation: shimmer 1.5s ease-in-out;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
            opacity: 0;
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .popular-badge {
          animation: badgePulse 2s infinite;
        }

        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @media (min-width: 640px) {
          .hero-cta {
            flex-direction: row;
            justify-content: center;
          }
        }
      `}</style>

      <div style={{ fontFamily: 'var(--font-inter)', lineHeight: '1.6', color: 'var(--slate-700)', background: 'var(--white)', overflowX: 'hidden' }}>
        {/* Navigation */}
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
          <div className="nav-container">
            <a href="/" className="logo">
              <img 
                src="/propply-logo-dark.png" 
                alt="Propply AI" 
                className="logo-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span style={{ display: 'none', fontWeight: '800', fontSize: '1.5rem' }}>Propply AI</span>
            </a>
            
            <ul className="nav-links">
              <li><a href="#features" className="nav-link">Features</a></li>
              <li><a href="#pricing" className="nav-link">Pricing</a></li>
              <li><a href="#about" className="nav-link">About</a></li>
              <li><a href="#contact" className="nav-link">Contact</a></li>
              <li>
                <button
                  onClick={() => setShowLogin(true)}
                  className="nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowSignup(true)}
                  className="nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Sign Up
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                Property Compliance<br/>
                <span style={{ background: 'linear-gradient(135deg, var(--electric-blue), var(--emerald-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Made Simple
                </span>
              </h1>
              
              <p className="hero-subtitle">
                Streamline NYC and Philadelphia property compliance with AI-powered analytics, 
                automated scheduling, and a verified vendor marketplace. Stay compliant, save time, reduce costs.
              </p>
              
              <div className="hero-cta">
                <button
                  onClick={() => setShowSignup(true)}
                  className="btn btn-primary"
                >
                  Start Free Trial
                  <ArrowRight size={20} />
                </button>
                <button className="btn btn-secondary">
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ padding: '8rem 0', background: 'var(--white)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: 'var(--primary-navy)', marginBottom: '1rem', lineHeight: '1.2' }}>
                Everything You Need for Property Compliance
              </h2>
              <p style={{ fontSize: '1.125rem', color: 'var(--slate-600)', maxWidth: '36rem', margin: '0 auto' }}>
                Built specifically for NYC and Philadelphia property managers, with intelligent features that save time and reduce compliance risks.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    style={{ 
                      background: 'var(--white)', 
                      border: '1px solid var(--slate-200)', 
                      borderRadius: 'var(--radius-xl)', 
                      padding: '2rem',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: `fadeInUp 0.8s ease-out ${0.2 * index}s both`,
                      transform: 'translateY(20px)',
                      opacity: 0
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-10px) scale(1.02)';
                      e.target.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                      e.target.style.borderColor = 'var(--electric-blue)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0) scale(1)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.borderColor = 'var(--slate-200)';
                    }}
                  >
                    <div style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      borderRadius: 'var(--radius-lg)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginBottom: '1.5rem', 
                      color: 'white', 
                      fontSize: '1.25rem',
                      background: index % 3 === 0 ? 'linear-gradient(135deg, var(--electric-blue), #2563EB)' : 
                                 index % 3 === 1 ? 'linear-gradient(135deg, var(--emerald-green), #059669)' :
                                 'linear-gradient(135deg, var(--amber-highlight), #D97706)',
                      transition: 'all 0.3s ease',
                      animation: 'iconFloat 3s ease-in-out infinite'
                    }}>
                      <Icon size={20} />
                    </div>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '700', 
                      color: 'var(--primary-navy)', 
                      marginBottom: '0.75rem',
                      transition: 'color 0.3s ease'
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{ 
                      color: 'var(--slate-600)', 
                      lineHeight: '1.6',
                      transition: 'color 0.3s ease'
                    }}>
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" style={{ 
          padding: '8rem 0', 
          background: 'linear-gradient(135deg, var(--slate-50) 0%, rgba(59, 130, 246, 0.03) 50%, var(--slate-50) 100%)' 
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: 'var(--primary-navy)', marginBottom: '1rem', lineHeight: '1.2' }}>
                Choose the perfect plan<br/>
                <span style={{ background: 'linear-gradient(135deg, var(--amber-highlight), var(--electric-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  for your needs
                </span>
              </h2>
              <p style={{ fontSize: '1.125rem', color: 'var(--slate-600)', maxWidth: '36rem', margin: '0 auto' }}>
                Start free and scale as you grow. All plans include our core compliance features with transparent pricing and no hidden fees.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {pricingPlans.map((plan, index) => (
                <div 
                  key={plan.key} 
                  className="pricing-card"
                  style={{
                    background: 'var(--white)',
                    border: plan.popular ? '2px solid var(--electric-blue)' : '2px solid var(--slate-200)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: '2.5rem 2rem',
                    position: 'relative',
                    transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: plan.popular ? 'var(--shadow-2xl)' : 'var(--shadow-lg)',
                    animationDelay: `${index * 0.2}s`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = plan.popular ? 'scale(1.08) translateY(-10px)' : 'scale(1.03) translateY(-10px)';
                    e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = plan.popular ? 'scale(1.05) translateY(0)' : 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = plan.popular ? 'var(--shadow-2xl)' : 'var(--shadow-lg)';
                  }}
                >
                  {plan.popular && (
                    <div 
                      className="popular-badge"
                      style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        background: 'linear-gradient(135deg, var(--electric-blue), var(--emerald-green))',
                        color: 'white',
                        textAlign: 'center',
                        padding: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      Most Popular
                    </div>
                  )}
                  
                  <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: plan.popular ? '2rem' : '0' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
                      {plan.name}
                    </h3>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.5rem', verticalAlign: 'top' }}>$</span>{plan.price}
                    </div>
                    <div style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
                      {plan.type === 'subscription' && plan.interval === 'year' ? 'per year' : 
                       plan.type === 'subscription' && plan.interval === 'month' ? 'per month' :
                       plan.type === 'one_time' ? 'one-time' : 'forever free'}
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
                    {plan.features.map((feature, index) => (
                      <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--slate-700)' }}>
                        <CheckCircle size={20} style={{ color: 'var(--emerald-green)', flexShrink: 0 }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setShowSignup(true)}
                    className={plan.popular ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{ width: '100%' }}
                  >
                    {plan.price === 0 ? 'Get Started Free' : 
                     plan.type === 'one_time' ? 'Order Report' : 'Start Free Trial'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div style={{
          position: 'fixed',
          inset: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: '9999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            boxShadow: 'var(--shadow-2xl)',
            maxWidth: '28rem',
            width: '100%',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-navy)' }}>Welcome Back</h2>
              <button
                onClick={() => setShowLogin(false)}
                style={{ padding: '0.5rem', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '0.75rem',
                color: '#DC2626'
              }}>
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--slate-300)',
                borderRadius: '0.75rem',
                background: 'white',
                color: 'var(--slate-700)',
                fontSize: '1rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--slate-50)';
                e.target.style.borderColor = 'var(--electric-blue)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = 'var(--slate-300)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1.5rem',
              gap: '1rem'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--slate-200)' }}></div>
              <span style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--slate-200)' }}></div>
            </div>

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '0.75rem',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      paddingRight: '3rem',
                      border: '1px solid var(--slate-300)',
                      borderRadius: '0.75rem',
                      fontSize: '1rem'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--slate-400)'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setShowLogin(false);
                  setShowSignup(true);
                }}
                style={{ color: 'var(--electric-blue)', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div style={{
          position: 'fixed',
          inset: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: '9999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            boxShadow: 'var(--shadow-2xl)',
            maxWidth: '28rem',
            width: '100%',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-navy)' }}>Create Account</h2>
              <button
                onClick={() => setShowSignup(false)}
                style={{ padding: '0.5rem', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '0.75rem',
                color: '#DC2626'
              }}>
                {error}
              </div>
            )}

            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--slate-300)',
                borderRadius: '0.75rem',
                background: 'white',
                color: 'var(--slate-700)',
                fontSize: '1rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--slate-50)';
                e.target.style.borderColor = 'var(--electric-blue)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = 'var(--slate-300)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Creating account...' : 'Continue with Google'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1.5rem',
              gap: '1rem'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--slate-200)' }}></div>
              <span style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--slate-200)' }}></div>
            </div>

            <form onSubmit={handleEmailSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '0.75rem',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '0.75rem',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      paddingRight: '3rem',
                      border: '1px solid var(--slate-300)',
                      borderRadius: '0.75rem',
                      fontSize: '1rem'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--slate-400)'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setShowSignup(false);
                  setShowLogin(true);
                }}
                style={{ color: 'var(--electric-blue)', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingPage;
