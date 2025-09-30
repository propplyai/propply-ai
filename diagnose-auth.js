/**
 * Auth Diagnostic Script
 * 
 * Run this in your browser console to diagnose authentication issues.
 * 
 * Usage:
 * 1. Open your app in browser
 * 2. Open DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Review the diagnostic results
 */

(async function diagnoseAuth() {
  console.log('🔍 Starting Authentication Diagnostics...\n');
  
  const results = {
    passed: [],
    warnings: [],
    errors: []
  };

  // Test 1: Check environment variables
  console.log('1️⃣ Checking Environment Variables...');
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
    results.errors.push('❌ REACT_APP_SUPABASE_URL not configured');
    console.error('   ❌ Supabase URL missing or invalid');
  } else {
    results.passed.push('✅ Supabase URL configured');
    console.log(`   ✅ URL: ${supabaseUrl}`);
  }
  
  if (!supabaseKey || supabaseKey.includes('your-anon-key')) {
    results.errors.push('❌ REACT_APP_SUPABASE_ANON_KEY not configured');
    console.error('   ❌ Supabase API key missing or invalid');
  } else {
    results.passed.push('✅ Supabase API key configured');
    console.log(`   ✅ Key prefix: ${supabaseKey.substring(0, 20)}...`);
  }

  // Test 2: Check if Supabase client is initialized
  console.log('\n2️⃣ Checking Supabase Client...');
  try {
    const { supabase } = await import('./src/config/supabase');
    
    if (supabase) {
      results.passed.push('✅ Supabase client initialized');
      console.log('   ✅ Client initialized successfully');
      
      // Test connection
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          results.errors.push('❌ Cannot get session: ' + error.message);
          console.error('   ❌ Session fetch error:', error.message);
        } else {
          results.passed.push('✅ Can communicate with Supabase');
          console.log('   ✅ Connection successful');
          
          if (data.session) {
            console.log('   ℹ️  Current session:', {
              user: data.session.user.email,
              expires: new Date(data.session.expires_at * 1000).toLocaleString()
            });
          } else {
            console.log('   ℹ️  No active session');
          }
        }
      } catch (err) {
        results.errors.push('❌ Supabase connection failed: ' + err.message);
        console.error('   ❌ Connection error:', err);
      }
    } else {
      results.errors.push('❌ Supabase client not initialized');
      console.error('   ❌ Client is null or undefined');
    }
  } catch (err) {
    results.errors.push('❌ Cannot import Supabase client: ' + err.message);
    console.error('   ❌ Import error:', err);
  }

  // Test 3: Check localStorage for session
  console.log('\n3️⃣ Checking Browser Storage...');
  try {
    const authToken = localStorage.getItem('supabase.auth.token');
    if (authToken) {
      results.passed.push('✅ Auth token found in localStorage');
      console.log('   ✅ Token stored locally');
      
      try {
        const token = JSON.parse(authToken);
        console.log('   ℹ️  Token info:', {
          hasAccessToken: !!token.access_token,
          hasRefreshToken: !!token.refresh_token,
          expiresAt: token.expires_at ? new Date(token.expires_at * 1000).toLocaleString() : 'N/A'
        });
      } catch (e) {
        results.warnings.push('⚠️  Cannot parse auth token');
        console.warn('   ⚠️  Token exists but cannot be parsed');
      }
    } else {
      results.warnings.push('⚠️  No auth token in localStorage');
      console.warn('   ℹ️  No stored authentication token (user not logged in)');
    }
    
    // Check if localStorage is available
    localStorage.setItem('test', '1');
    localStorage.removeItem('test');
    results.passed.push('✅ localStorage is working');
    console.log('   ✅ localStorage functional');
  } catch (err) {
    results.errors.push('❌ localStorage not available: ' + err.message);
    console.error('   ❌ localStorage error:', err);
    console.warn('   💡 Tip: Check if you\'re in incognito/private mode');
  }

  // Test 4: Check cookies
  console.log('\n4️⃣ Checking Cookies...');
  const cookies = document.cookie;
  if (cookies.includes('supabase')) {
    results.passed.push('✅ Supabase cookies present');
    console.log('   ✅ Auth cookies found');
  } else {
    results.warnings.push('⚠️  No Supabase cookies found');
    console.warn('   ℹ️  No auth cookies (might be using localStorage only)');
  }

  // Test 5: Check if user profile table is accessible
  console.log('\n5️⃣ Checking Database Access...');
  try {
    const { supabase } = await import('./src/config/supabase');
    const { data: session } = await supabase.auth.getSession();
    
    if (session?.session?.user) {
      const userId = session.session.user.id;
      console.log(`   ℹ️  Testing profile access for user: ${userId}`);
      
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            results.errors.push('❌ User profile not found in database');
            console.error('   ❌ Profile missing for authenticated user');
            console.log('   💡 Tip: Run the manual profile creation SQL from LOGIN_TROUBLESHOOTING.md');
          } else if (error.code === '42P01') {
            results.errors.push('❌ user_profiles table does not exist');
            console.error('   ❌ Table not found');
            console.log('   💡 Tip: Run database/schema.sql in Supabase SQL Editor');
          } else {
            results.errors.push('❌ Database error: ' + error.message);
            console.error('   ❌ Query error:', error);
          }
        } else if (profile) {
          results.passed.push('✅ User profile found');
          console.log('   ✅ Profile exists:', {
            email: profile.email,
            name: profile.full_name,
            tier: profile.subscription_tier,
            created: new Date(profile.created_at).toLocaleString()
          });
        }
      } catch (err) {
        results.errors.push('❌ Cannot query user_profiles: ' + err.message);
        console.error('   ❌ Query exception:', err);
      }
    } else {
      console.log('   ℹ️  Skipping (no active session)');
    }
  } catch (err) {
    results.warnings.push('⚠️  Could not test database access');
    console.warn('   ⚠️  Test skipped:', err.message);
  }

  // Test 6: Check RLS policies
  console.log('\n6️⃣ Checking Row Level Security...');
  try {
    const { supabase } = await import('./src/config/supabase');
    
    // Try to query without auth (should fail)
    const { error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42501') {
      results.passed.push('✅ RLS policies active (good security)');
      console.log('   ✅ RLS is enforcing permissions');
    } else if (!error) {
      results.warnings.push('⚠️  RLS might not be enabled');
      console.warn('   ⚠️  Query succeeded without auth (potential security issue)');
    }
  } catch (err) {
    console.warn('   ℹ️  RLS test skipped');
  }

  // Test 7: Check CORS
  console.log('\n7️⃣ Checking CORS Configuration...');
  const currentOrigin = window.location.origin;
  console.log(`   ℹ️  Current origin: ${currentOrigin}`);
  
  if (currentOrigin.includes('localhost')) {
    results.passed.push('✅ Running on localhost (CORS usually not an issue)');
    console.log('   ✅ Local development environment');
  } else {
    results.warnings.push('⚠️  Running in production - verify CORS settings');
    console.warn('   ⚠️  Ensure this domain is whitelisted in Supabase Dashboard');
    console.log(`   💡 Add "${currentOrigin}" to Supabase → API Settings → CORS Origins`);
  }

  // Test 8: Check React Router
  console.log('\n8️⃣ Checking React Router...');
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  console.log(`   ℹ️  Current URL: ${window.location.href}`);
  console.log(`   ℹ️  Tab parameter: ${tabParam || 'none'}`);
  
  if (tabParam === 'profile') {
    results.passed.push('✅ Profile tab parameter detected');
    console.log('   ✅ Should redirect to profile dashboard');
  }

  // Test 9: Check Auth Service
  console.log('\n9️⃣ Checking Auth Service...');
  try {
    const { authService } = await import('./src/services/auth');
    
    if (authService && typeof authService.signIn === 'function') {
      results.passed.push('✅ Auth service available');
      console.log('   ✅ Auth service loaded');
      console.log('   ℹ️  Available methods:', Object.keys(authService).join(', '));
    } else {
      results.errors.push('❌ Auth service not properly initialized');
      console.error('   ❌ Service missing or malformed');
    }
  } catch (err) {
    results.errors.push('❌ Cannot load auth service: ' + err.message);
    console.error('   ❌ Import error:', err);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ PASSED (${results.passed.length}):`);
  results.passed.forEach(item => console.log(`   ${item}`));
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(item => console.warn(`   ${item}`));
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORS (${results.errors.length}):`);
    results.errors.forEach(item => console.error(`   ${item}`));
  }
  
  // Provide recommendations
  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(60) + '\n');
  
  if (results.errors.length === 0 && results.warnings.length === 0) {
    console.log('✨ Everything looks good! If you\'re still having issues:');
    console.log('   1. Clear browser cache and cookies');
    console.log('   2. Try incognito/private mode');
    console.log('   3. Check network tab for failed requests');
  } else if (results.errors.length > 0) {
    console.log('🔧 Fix these critical errors first:');
    results.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
    console.log('\n📖 See LOGIN_TROUBLESHOOTING.md for detailed solutions');
  } else {
    console.log('⚠️  Minor issues detected. Review warnings above.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic complete!');
  console.log('='.repeat(60));
  
  return {
    passed: results.passed,
    warnings: results.warnings,
    errors: results.errors,
    status: results.errors.length === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'
  };
})();
