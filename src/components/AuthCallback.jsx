import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { authService } from '../services/auth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setStatus('Authentication failed');
          return;
        }

        if (data.session) {
          const user = data.session.user;
          console.log('Authentication successful for user:', user.email);
          setStatus('Authentication successful! Loading your profile...');
          
          // Wait a moment for database trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to fetch the user profile - this verifies the unique profile exists
          let retries = 3;
          let profileResult = null;
          
          while (retries > 0 && !profileResult?.success) {
            console.log(`Fetching user profile (attempt ${4 - retries}/3)...`);
            profileResult = await authService.getUserProfile(user.id);
            
            if (!profileResult.success) {
              console.log('Profile not found, waiting...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              retries--;
            }
          }
          
          // If profile still doesn't exist after retries, create it manually
          if (!profileResult?.success) {
            console.log('Profile not found after retries, creating manually...');
            const createResult = await authService.createUserProfile(user);
            console.log('Manual profile creation result:', createResult);
          }
          
          console.log('User profile ready, redirecting to dashboard...');
          setStatus('Profile loaded! Redirecting...');
          
          // Redirect to dashboard with profile tab
          setTimeout(() => {
            navigate('/?tab=profile', { replace: true });
          }, 1000);
        } else {
          console.log('No session found');
          setStatus('No authentication session found');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Auth callback processing error:', error);
        setError(error.message);
        setStatus('Authentication processing failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        {/* Loading spinner */}
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          {error ? 'Authentication Error' : 'Almost there!'}
        </h2>
        
        <p style={{
          color: error ? '#dc2626' : '#6b7280',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          {error || status}
        </p>
        
        {error && (
          <button
            onClick={() => navigate('/', { replace: true })}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Return to Home
          </button>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
