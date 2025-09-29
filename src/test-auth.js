// Test authentication connection
import { supabase } from './config/supabase';

const testAuth = async () => {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabase.supabaseUrl);
  console.log('Key prefix:', supabase.supabaseKey?.substring(0, 20) + '...');

  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    console.log('Session check:', { data, error });

    // Test sign up with a test user
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';
    
    console.log('Attempting sign up...');
    const signUpResult = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    console.log('Sign up result:', signUpResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run test
testAuth();
