import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { authService } from '../services/auth';

const AuthTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, message, details = null) => {
    setTestResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toISOString() }]);
  };

  const runAuthTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Supabase Connection
      addResult('Supabase Connection', 'running', 'Testing Supabase connection...');
      try {
        const { error } = await supabase.from('user_profiles').select('count').limit(1);
        if (error) throw error;
        addResult('Supabase Connection', 'success', 'Connected to Supabase successfully');
      } catch (error) {
        addResult('Supabase Connection', 'error', 'Failed to connect to Supabase', error.message);
      }

      // Test 2: Environment Variables
      addResult('Environment Variables', 'running', 'Checking environment variables...');
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        addResult('Environment Variables', 'error', 'Missing Supabase environment variables', {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey
        });
      } else if (supabaseUrl.includes('your-project-ref') || supabaseKey.includes('your-anon-key')) {
        addResult('Environment Variables', 'warning', 'Using placeholder values - please configure real values');
      } else {
        addResult('Environment Variables', 'success', 'Environment variables configured');
      }

      // Test 3: Auth Service
      addResult('Auth Service', 'running', 'Testing auth service...');
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser.success) {
          addResult('Auth Service', 'success', 'Auth service working correctly');
        } else {
          addResult('Auth Service', 'warning', 'Auth service working but no user logged in');
        }
      } catch (error) {
        addResult('Auth Service', 'error', 'Auth service error', error.message);
      }

      // Test 4: Database Schema
      addResult('Database Schema', 'running', 'Checking database schema...');
      try {
        const { data: tables, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .in('table_name', ['user_profiles', 'properties', 'compliance_reports']);

        if (error) throw error;

        const requiredTables = ['user_profiles', 'properties', 'compliance_reports'];
        const existingTables = tables ? tables.map(t => t.table_name) : [];
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));

        if (missingTables.length === 0) {
          addResult('Database Schema', 'success', 'All required tables exist');
        } else {
          addResult('Database Schema', 'error', 'Missing required tables', missingTables);
        }
      } catch (error) {
        addResult('Database Schema', 'error', 'Failed to check database schema', error.message);
      }

      // Test 5: RLS Policies
      addResult('RLS Policies', 'running', 'Checking Row Level Security policies...');
      try {
        const { data: policies, error } = await supabase
          .from('pg_policies')
          .select('tablename, policyname')
          .eq('schemaname', 'public')
          .in('tablename', ['user_profiles', 'properties']);

        if (error) throw error;

        if (policies && policies.length > 0) {
          addResult('RLS Policies', 'success', 'RLS policies are configured');
        } else {
          addResult('RLS Policies', 'warning', 'No RLS policies found - this may be expected');
        }
      } catch (error) {
        addResult('RLS Policies', 'warning', 'Could not check RLS policies', error.message);
      }

    } catch (error) {
      addResult('Test Suite', 'error', 'Test suite failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testEmailAuth = async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    addResult('Email Auth Test', 'running', 'Testing email authentication...');
    
    try {
      // Test signup
      const signupResult = await authService.signUp(testEmail, testPassword, {
        fullName: 'Test User'
      });

      if (signupResult.success) {
        addResult('Email Signup', 'success', 'Email signup successful');
        
        // Test signin
        const signinResult = await authService.signIn(testEmail, testPassword);
        if (signinResult.success) {
          addResult('Email Signin', 'success', 'Email signin successful');
          
          // Test signout
          const signoutResult = await authService.signOut();
          if (signoutResult.success) {
            addResult('Email Signout', 'success', 'Email signout successful');
          } else {
            addResult('Email Signout', 'error', 'Email signout failed', signoutResult.error);
          }
        } else {
          addResult('Email Signin', 'error', 'Email signin failed', signinResult.error);
        }
      } else {
        addResult('Email Signup', 'error', 'Email signup failed', signupResult.error);
      }
    } catch (error) {
      addResult('Email Auth Test', 'error', 'Email authentication test failed', error.message);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>Authentication Test Suite</h2>
      
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={runAuthTests}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={testEmailAuth}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Test Email Auth
        </button>
        
        <button
          onClick={clearResults}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Clear Results
        </button>
      </div>

      {testResults.length > 0 && (
        <div style={{ 
          backgroundColor: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '0.5rem',
          padding: '1rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Test Results</h3>
          
          {testResults.map((result, index) => (
            <div 
              key={index}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                borderRadius: '0.375rem',
                backgroundColor: result.status === 'success' ? '#dcfce7' : 
                               result.status === 'error' ? '#fef2f2' : 
                               result.status === 'warning' ? '#fef3c7' : '#f1f5f9',
                border: `1px solid ${result.status === 'success' ? '#bbf7d0' : 
                                        result.status === 'error' ? '#fecaca' : 
                                        result.status === 'warning' ? '#fde68a' : '#e2e8f0'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ 
                  fontWeight: '600',
                  color: result.status === 'success' ? '#166534' : 
                         result.status === 'error' ? '#dc2626' : 
                         result.status === 'warning' ? '#d97706' : '#374151'
                }}>
                  {result.test}
                </span>
                <span style={{ 
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  {result.timestamp}
                </span>
              </div>
              
              <div style={{ 
                color: result.status === 'success' ? '#166534' : 
                       result.status === 'error' ? '#dc2626' : 
                       result.status === 'warning' ? '#d97706' : '#374151',
                marginBottom: result.details ? '0.5rem' : '0'
              }}>
                {result.message}
              </div>
              
              {result.details && (
                <details style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <summary style={{ cursor: 'pointer', marginBottom: '0.25rem' }}>Details</summary>
                  <pre style={{ 
                    backgroundColor: '#f1f5f9', 
                    padding: '0.5rem', 
                    borderRadius: '0.25rem',
                    overflow: 'auto',
                    fontSize: '0.75rem'
                  }}>
                    {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f0f9ff', 
        border: '1px solid #bae6fd', 
        borderRadius: '0.5rem' 
      }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#0369a1' }}>Setup Instructions</h4>
        <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e' }}>
          <li>Configure your Supabase project URL and anon key in environment variables</li>
          <li>Set up Google OAuth in your Supabase dashboard</li>
          <li>Run the database schema from <code>database/schema.sql</code></li>
          <li>Configure redirect URLs in both Supabase and Google OAuth settings</li>
          <li>See <code>AUTHENTICATION_SETUP.md</code> for detailed instructions</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthTest;
