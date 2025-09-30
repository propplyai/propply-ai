import React, { useState } from 'react';
import { supabase } from '../config/supabase';

const AuthDebug = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('Testing connection...');
    
    try {
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Supabase Key (first 20 chars):', supabase.supabaseKey?.substring(0, 20) + '...');
      
      // Test 1: Basic connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session test:', { sessionData, sessionError });
      
      if (sessionError) {
        setTestResult(`Session Error: ${sessionError.message}`);
        return;
      }
      
      // Test 2: Try to sign up with a test user
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      console.log('Testing signup with:', testEmail);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });
      
      console.log('Signup test:', { signUpData, signUpError });
      
      if (signUpError) {
        setTestResult(`Signup Error: ${signUpError.message}`);
        return;
      }
      
      setTestResult(`Success! User created: ${signUpData.user?.email}. Check console for details.`);
      
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    setLoading(true);
    setTestResult('Testing sign in...');
    
    try {
      // Try to sign in with the test email from the form
      const email = 'art.ajayan@gmail.com';
      const password = 'testpassword123';
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('Sign in test:', { data, error });
      
      if (error) {
        setTestResult(`Sign In Error: ${error.message}`);
        return;
      }
      
      setTestResult(`Sign in successful! User: ${data.user?.email}`);
      
    } catch (error) {
      console.error('Sign in test failed:', error);
      setTestResult(`Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleSignIn = async () => {
    setLoading(true);
    setTestResult('Initiating Google sign in...');
    
    try {
      console.log('Testing Google OAuth...');
      console.log('Current URL:', window.location.href);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href.includes('ngrok') 
            ? window.location.origin 
            : 'https://477b7af352e3.ngrok-free.app'
        }
      });
      
      console.log('OAuth result:', { data, error });
      
      if (error) {
        console.error('OAuth error:', error);
        setTestResult(`Google OAuth Error: ${error.message}`);
      } else {
        setTestResult('Google OAuth initiated! Should redirect to Google...');
      }
      
    } catch (error) {
      console.error('Google sign in test failed:', error);
      setTestResult(`Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      <h3>Auth Debug Panel</h3>
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px', marginBottom: '5px' }}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        <button 
          onClick={testSignIn} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px', marginBottom: '5px' }}
        >
          Test Sign In
        </button>
        <button 
          onClick={testGoogleSignIn} 
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            marginBottom: '5px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          🔍 Test Google
        </button>
      </div>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        borderRadius: '4px',
        fontSize: '12px',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
        {testResult || 'Click "Test Connection" to debug auth issues'}
      </div>
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
        Check browser console for detailed logs
      </div>
    </div>
  );
};

export default AuthDebug;
