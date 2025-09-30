// Authentication service for Propply AI
import { supabase } from '../config/supabase';

export const authService = {
  // Sign up new user
  signUp: async (email, password, userData = {}) => {
    try {
      console.log('Attempting to sign up user:', email);
      console.log('Supabase URL:', supabase.supabaseUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            company: userData.company || '',
            phone: userData.phone || '',
            subscription_tier: 'free',
            ...userData
          }
        }
      });

      console.log('Supabase response:', { data, error });

      if (error) throw error;

      // Note: Profile creation is handled by database trigger (handle_new_user)
      // Don't create profile here as there might not be a session yet
      
      const hasSession = data.session !== null;
      const message = hasSession 
        ? 'Account created successfully!' 
        : 'Account created successfully! Please check your email to verify your account.';

      console.log(`Signup complete. Has session: ${hasSession}`);

      return {
        success: true,
        user: data.user,
        session: data.session,
        message: message
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create account'
      };
    }
  },

  // Sign in user
  signIn: async (email, password) => {
    try {
      console.log('Attempting to sign in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Sign in response:', { data, error });

      if (error) throw error;

      // Update last login
      if (data.user) {
        await authService.updateLastLogin(data.user.id);
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in'
      };
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      console.log('Attempting to sign in with Google');
      
      // DON'T clear localStorage - PKCE code verifier needs to persist!
      // The code verifier is stored with a key like "sb-{project}-auth-token-code-verifier"
      // and is REQUIRED to complete the OAuth flow
      
      // Use current origin for redirect - App.js will handle profile redirect on OAuth callback
      const redirectUrl = window.location.origin;

      console.log('Using redirect URL:', redirectUrl);
      console.log('Starting OAuth with PKCE flow...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      console.log('Google sign in response:', { data, error });

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in with Google'
      };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update password
  updatePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password updated successfully!'
      };
    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      if (user) {
        // Get user profile with subscription info
        const profile = await authService.getUserProfile(user.id);
        return {
          success: true,
          user: {
            ...user,
            profile: profile.data
          }
        };
      }

      return { success: true, user: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Create user profile
  createUserProfile: async (user) => {
    try {
      console.log('Creating user profile for:', user.id, user.email);

      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid errors when no row exists

      if (existingProfile) {
        console.log('User profile already exists:', existingProfile.id);
        return { success: true, data: [existingProfile] };
      }

      // Extract name from various OAuth providers
      const fullName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.user_metadata?.display_name
        || '';

      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            company: user.user_metadata?.company || '',
            phone: user.user_metadata?.phone || '',
            subscription_tier: 'free',
            subscription_status: 'active',
            reports_used: 0,
            reports_limit: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        // Check if error is due to duplicate key (profile was created by trigger)
        if (error.code === '23505') {
          console.log('Profile already exists (created by trigger), fetching...');
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          return { success: true, data: [profile] };
        }
        throw error;
      }

      console.log('User profile created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Create user profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get user profile
  getUserProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Update user profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update subscription
  updateSubscription: async (userId, subscriptionData) => {
    try {
      const updates = {
        subscription_tier: subscriptionData.tierId,
        subscription_status: subscriptionData.status,
        subscription_id: subscriptionData.subscriptionId,
        customer_id: subscriptionData.customerId,
        current_period_start: subscriptionData.currentPeriodStart,
        current_period_end: subscriptionData.currentPeriodEnd,
        reports_limit: subscriptionData.reportsLimit || 0,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Update subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update last login
  updateLastLogin: async (userId) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update last login error:', error);
      return { success: false };
    }
  },

  // Check if user can generate report
  canGenerateReport: async (userId) => {
    try {
      const profile = await authService.getUserProfile(userId);
      if (!profile.success) throw new Error('Could not get user profile');

      const { subscription_tier, reports_used, reports_limit } = profile.data;
      
      // Free tier can't generate reports
      if (subscription_tier === 'free') {
        return {
          canGenerate: false,
          reason: 'Please upgrade your plan to generate reports',
          reportsUsed: 0,
          reportsLimit: 0
        };
      }

      // Unlimited plans
      if (reports_limit === -1) {
        return {
          canGenerate: true,
          reportsUsed: reports_used || 0,
          reportsLimit: -1
        };
      }

      // Limited plans
      const remaining = (reports_limit || 0) - (reports_used || 0);
      return {
        canGenerate: remaining > 0,
        reason: remaining <= 0 ? 'Monthly report limit reached' : null,
        reportsUsed: reports_used || 0,
        reportsLimit: reports_limit || 0,
        reportsRemaining: remaining
      };
    } catch (error) {
      console.error('Check report generation error:', error);
      return {
        canGenerate: false,
        reason: 'System error',
        error: error.message
      };
    }
  },

  // Consume report credit
  consumeReportCredit: async (userId) => {
    try {
      const profile = await authService.getUserProfile(userId);
      if (!profile.success) throw new Error('Could not get user profile');

      const newReportsUsed = (profile.data.reports_used || 0) + 1;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          reports_used: newReportsUsed,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      return {
        success: true,
        reportsUsed: newReportsUsed,
        reportsRemaining: profile.data.reports_limit === -1 ? -1 : (profile.data.reports_limit || 0) - newReportsUsed
      };
    } catch (error) {
      console.error('Consume report credit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default authService;
