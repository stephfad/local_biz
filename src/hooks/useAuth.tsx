import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  business_category: string | null;
  business_address: string | null;
  business_phone: string | null;
  business_email: string | null;
  business_website: string | null;
  business_hours: any;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  businessProfile: BusinessProfile | null;
  accountType: 'user' | 'business' | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (
    email: string, 
    password: string, 
    accountType: 'user' | 'business',
    userData?: {
      username?: string;
      displayName?: string;
      businessName?: string;
      businessDescription?: string;
      businessCategory?: string;
    }
  ) => Promise<{ error: any }>;
  addBusiness: (
    businessData: {
      businessName: string;
      businessEmail: string;
      businessDescription?: string;
      businessCategory?: string;
      businessAddress?: string;
      businessPhone?: string;
      businessWebsite?: string;
    }
  ) => Promise<{ error: any }>;
  canReviewBusiness: (businessId: string) => Promise<{ canReview: boolean; nextReviewDate?: string; error?: any }>;
  logReviewAttempt: (businessId: string, wasSuccessful: boolean) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  updateBusinessProfile: (updates: Partial<BusinessProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [accountType, setAccountType] = useState<'user' | 'business' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      // Check all user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roles = rolesData?.map(r => r.role) || [];
      const hasAdminRole = roles.includes('admin');
      setIsAdmin(hasAdminRole);

      // Determine account type
      if (roles.includes('business')) {
        setAccountType('business');
        // Fetch business profile
        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!businessError && businessData) {
          setBusinessProfile(businessData);
        }
      } else {
        setAccountType('user');
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer user data fetching with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setBusinessProfile(null);
          setAccountType(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    accountType: 'user' | 'business',
    userData?: {
      username?: string;
      displayName?: string;
      businessName?: string;
      businessDescription?: string;
      businessCategory?: string;
    }
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const signUpData: any = {
      account_type: accountType,
    };

    if (accountType === 'user') {
      signUpData.username = userData?.username;
      signUpData.display_name = userData?.displayName;
    } else if (accountType === 'business') {
      signUpData.business_name = userData?.businessName;
      signUpData.business_description = userData?.businessDescription;
      signUpData.business_category = userData?.businessCategory;
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: signUpData
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  const addBusiness = async (businessData: {
    businessName: string;
    businessEmail: string;
    businessDescription?: string;
    businessCategory?: string;
    businessAddress?: string;
    businessPhone?: string;
    businessWebsite?: string;
  }) => {
    if (!user) return { error: new Error('No user logged in') };

    // Create a placeholder user_id for the business (will be updated when claimed)
    const placeholderUserId = crypto.randomUUID();

    const { error } = await supabase
      .from('business_profiles')
      .insert({
        user_id: placeholderUserId,
        business_name: businessData.businessName,
        business_email: businessData.businessEmail,
        business_description: businessData.businessDescription,
        business_category: businessData.businessCategory,
        business_address: businessData.businessAddress,
        business_phone: businessData.businessPhone,
        business_website: businessData.businessWebsite,
        created_by: user.id,
        is_claimed: false,
      });

    return { error };
  };

  const canReviewBusiness = async (businessId: string) => {
    if (!user) return { canReview: false, error: new Error('No user logged in') };

    try {
      const { data, error } = await supabase.rpc('can_user_review_business', {
        _reviewer_id: user.id,
        _business_id: businessId
      });

      if (error) return { canReview: false, error };

      if (!data) {
        // Get the last review date to calculate next review date
        const { data: lastReview } = await supabase
          .from('reviews')
          .select('created_at')
          .eq('business_id', businessId)
          .eq('reviewer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastReview) {
          const nextReviewDate = new Date(lastReview.created_at);
          nextReviewDate.setDate(nextReviewDate.getDate() + 14);
          return { 
            canReview: false, 
            nextReviewDate: nextReviewDate.toISOString() 
          };
        }
      }

      return { canReview: data };
    } catch (error) {
      return { canReview: false, error };
    }
  };

  const logReviewAttempt = async (businessId: string, wasSuccessful: boolean) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase.rpc('log_review_attempt', {
      _reviewer_id: user.id,
      _business_id: businessId,
      _was_successful: wasSuccessful
    });

    return { error };
  };

  const updateBusinessProfile = async (updates: Partial<BusinessProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error && businessProfile) {
      setBusinessProfile({ ...businessProfile, ...updates });
    }

    return { error };
  };

  const value = {
    user,
    session,
    profile,
    businessProfile,
    accountType,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateBusinessProfile,
    addBusiness,
    canReviewBusiness,
    logReviewAttempt,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};