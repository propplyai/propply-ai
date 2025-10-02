import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import { authService } from './services/auth';
import LandingPage from './components/LandingPage';
import MVPDashboard from './components/MVPDashboard';
import { ThemeProvider } from './contexts/ThemeContext';
// Debug components removed for production
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [initialTab, setInitialTab] = useState('profile'); // Default to profile for new logins

  // Debug initialTab changes
  useEffect(() => {
    console.log('App: initialTab changed to:', initialTab);
  }, [initialTab]);

  useEffect(() => {
    let mounted = true;
    let timeoutCleared = false;
    let isInitializing = true; // Flag to prevent duplicate profile loading
    
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const oauthErrorCode = urlParams.get('error_code');
    const oauthErrorDesc = urlParams.get('error_description');
    
    if (oauthError) {
      console.error('OAuth error detected:', oauthError, oauthErrorCode, oauthErrorDesc);
      console.error('Current URL:', window.location.href);
      console.error('Current origin:', window.location.origin);
      console.error('Expected origin should match Supabase Site URL exactly');
      
      const friendlyError = oauthErrorCode === 'bad_oauth_callback' 
        ? `OAuth configuration mismatch. Please verify your Supabase Site URL is exactly: ${window.location.origin} (no trailing slash, with https://)`
        : oauthErrorDesc || oauthError;
      
      setAuthError(`OAuth Error: ${friendlyError}`);
      setLoading(false);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return; // Don't proceed with auth initialization
    }
    
    // Check for tab parameter in URL
    const tabParam = urlParams.get('tab');
    if (tabParam === 'profile') {
      setInitialTab('profile');
    }
    
    // Check if this is an OAuth callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    if (accessToken) {
      console.log('OAuth callback detected, waiting for auth state change...');
      setInitialTab('profile'); // Redirect to profile after OAuth
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted && !timeoutCleared) {
        console.warn('Auth initialization timeout - forcing app to load');
        setLoading(false);
        setAuthError('Authentication timeout - please refresh the page');
      }
    }, 5000); // 5 second timeout
    
    const clearLoadingTimeout = () => {
      timeoutCleared = true;
      clearTimeout(loadingTimeout);
    };

    // Helper to wait for profile to be created
    const waitForProfile = async (userId, maxRetries = 5) => {
      for (let i = 0; i < maxRetries; i++) {
        const profileResult = await authService.getUserProfile(userId);
        if (profileResult.success) {
          return profileResult.data;
        }
        // Wait 500ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      // After all retries, create profile manually
      console.log('Profile not found after retries, creating manually...');
      const createResult = await authService.createUserProfile({ id: userId });
      if (createResult.success) {
        return createResult.data[0];
      }
      return null;
    };

    // Get initial session and user profile
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');

        // Check if this is an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');

        if (authCode) {
          console.log('OAuth callback detected with code:', authCode.substring(0, 20) + '...');
          console.log('Current URL:', window.location.href);
          
          // Exchange the code for a session
          // Supabase will automatically handle PKCE verification and store the session
          console.log('Exchanging OAuth code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          // Clean the URL immediately after exchange attempt
          window.history.replaceState({}, document.title, window.location.pathname);

          if (!mounted) return;

          if (error) {
            console.error('❌ OAuth code exchange failed:', error);
            console.error('Error details:', {
              message: error.message,
              status: error.status,
              name: error.name
            });
            setAuthError(`Failed to complete Google sign-in: ${error.message}`);
            clearLoadingTimeout();
            setLoading(false);
            return;
          }

          if (data?.session?.user) {
            const session = data.session;
            console.log('✅ OAuth session established for:', session.user.email);
            setInitialTab('profile');

            // Wait for profile to be created by trigger
            const profile = await waitForProfile(session.user.id);

            if (!mounted) return;

            if (profile) {
              setUser({ ...session.user, profile });
            } else {
              setUser(session.user);
            }
          } else {
            console.error('❌ No session returned from code exchange');
            setAuthError('Failed to complete Google sign-in. Please try again.');
          }

          if (mounted) {
            clearLoadingTimeout();
            setLoading(false);
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          console.log('User found:', session.user.email);

          // Get user profile (database trigger should have created it)
          const profileResult = await authService.getUserProfile(session.user.id);
          console.log('Profile fetch result:', profileResult);

          if (!mounted) return;

          if (profileResult.success) {
            setUser({
              ...session.user,
              profile: profileResult.data
            });
          } else {
            // Try waiting for profile
            const profile = await waitForProfile(session.user.id);
            if (profile) {
              setUser({ ...session.user, profile });
            } else {
              setUser(session.user);
            }
          }
        } else {
          console.log('No session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthError(error.message);
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('Auth initialization complete');
          isInitializing = false; // Allow onAuthStateChange to handle future auth changes
          clearLoadingTimeout();
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.email);

      // Skip handling during initial auth - initializeAuth() will handle it
      if (isInitializing) {
        console.log('Skipping auth state change during initialization');
        return;
      }

      if (session?.user) {
        // Redirect to profile on SIGNED_IN event (new login/signup)
        if (event === 'SIGNED_IN') {
          console.log('User signed in via auth state change, redirecting to profile');
          setInitialTab('profile');

          // Wait for profile to be created by trigger
          const profile = await waitForProfile(session.user.id);

          if (!mounted) return;

          if (profile) {
            setUser({ ...session.user, profile });
          } else {
            setUser(session.user);
          }
          
          // Clear loading state after user is set
          if (mounted) {
            console.log('SIGNED_IN: User and profile loaded, clearing loading state');
            clearLoadingTimeout();
            setLoading(false);
          }
        } else {
          // For other events, just try to get profile once
          const profileResult = await authService.getUserProfile(session.user.id);

          if (!mounted) return;

          if (profileResult.success) {
            setUser({ ...session.user, profile: profileResult.data });
          } else {
            setUser(session.user);
          }
          
          // Clear loading state after user is set
          if (mounted) {
            console.log('Auth state change - User loaded, clearing loading state');
            clearLoadingTimeout();
            setLoading(false);
          }
        }
      } else {
        if (mounted) {
          setUser(null);
          console.log('Auth state change - No session, clearing loading state');
          clearLoadingTimeout();
          setLoading(false);
        }
      }
    });
    
    return () => {
      mounted = false;
      clearLoadingTimeout();
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (userData, redirectToProfile = true) => {
    console.log('handleLogin called with redirectToProfile:', redirectToProfile);
    
    // ALWAYS redirect to profile after login
    console.log('handleLogin: Setting initialTab to profile');
    setInitialTab('profile');
    
    // Get user profile after login
    if (userData?.id) {
      console.log('handleLogin: Fetching profile for user:', userData.id);
      
      const profileResult = await authService.getUserProfile(userData.id);
      
      if (profileResult.success) {
        console.log('handleLogin: Profile loaded successfully:', profileResult.data);
        setUser({
          ...userData,
          profile: profileResult.data
        });
      } else {
        // Profile doesn't exist, create it in background
        console.warn('handleLogin: Profile not found, creating in background...');
        authService.createUserProfile(userData); // Don't wait
        setUser(userData); // Set user immediately
      }
    } else {
      setUser(userData);
    }
  };

  const handleLogout = async () => {
    const result = await authService.signOut();
    if (result.success) {
      setUser(null);
      setInitialTab('profile'); // Will show profile on next login
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center relative overflow-hidden">
        {/* Enterprise Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-corporate-500/10 to-gold-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-500/10 to-corporate-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-2xl mb-6 shadow-enterprise animate-glow">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Propply AI</h1>
          <p className="text-slate-400 text-lg font-medium">Loading Enterprise Dashboard...</p>
          {authError && (
            <div className="mt-6 p-4 bg-slate-800 border border-ruby-500/30 text-ruby-300 rounded-xl max-w-md mx-auto">
              <p className="text-sm mb-3">{authError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary text-sm"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Log when rendering with user
  if (user) {
    console.log('App: Rendering MVPDashboard with initialTab:', initialTab);
  }

  return (
    <ThemeProvider>
      <div className="App">
        {user ? (
          <MVPDashboard user={user} onLogout={handleLogout} initialTab={initialTab} />
        ) : (
          <LandingPage onLogin={handleLogin} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
