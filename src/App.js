import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import { authService } from './services/auth';
import LandingPage from './components/LandingPage';
import MVPDashboard from './components/MVPDashboard';
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
    
    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
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

    // Get initial session and user profile
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check if this is an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        
        if (authCode) {
          console.log('OAuth callback detected, waiting for auth state change...');
          // Don't proceed - let onAuthStateChange handle it
          // Just clean the URL
          window.history.replaceState({}, document.title, window.location.pathname);
          return; // Exit and let onAuthStateChange handle the session
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
            // Profile doesn't exist, create it quickly and continue
            console.warn('Profile not found, creating and continuing...');
            authService.createUserProfile(session.user); // Don't wait
            setUser(session.user); // Set user immediately without profile
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
        // Don't set loading false here if we have an OAuth code - let onAuthStateChange do it
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        
        if (mounted && !authCode) {
          console.log('Auth initialization complete');
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
      
      if (session?.user) {
        // Redirect to profile on SIGNED_IN event (new login/signup)
        if (event === 'SIGNED_IN') {
          console.log('User signed in via auth state change, redirecting to profile');
          setInitialTab('profile');
        }
        
        try {
          // Get user profile when user signs in
          const profileResult = await authService.getUserProfile(session.user.id);
          console.log('Auth state change - Profile fetch:', profileResult);
          
          if (!mounted) return;
          
          if (profileResult.success) {
            console.log('Auth state change - Setting user with profile');
            setUser({
              ...session.user,
              profile: profileResult.data
            });
          } else {
            // Profile doesn't exist, create it in background and continue
            console.log('Auth state change - Profile not found, creating in background...');
            authService.createUserProfile(session.user); // Don't wait
            setUser(session.user); // Set user immediately
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted) {
            // Set user even if there's an error to avoid infinite loading
            console.warn('Auth state change - Error occurred, setting user anyway');
            setUser(session.user);
          }
        }
      } else {
        if (mounted) {
          setUser(null);
        }
      }
      
      if (mounted) {
        console.log('Auth state change - Clearing loading state');
        clearLoadingTimeout();
        setLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Loading Propply AI...</p>
          {authError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="text-sm">{authError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
    <div className="App">
      {user ? (
        <MVPDashboard user={user} onLogout={handleLogout} initialTab={initialTab} />
      ) : (
        <LandingPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
