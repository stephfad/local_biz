-- Update the app_role enum to include business
ALTER TYPE public.app_role ADD VALUE 'business';

-- Create business profiles table
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_category TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  business_website TEXT,
  business_hours JSONB,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on business_profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_profiles
CREATE POLICY "Business profiles are viewable by everyone" 
ON public.business_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Business owners can update their own profile" 
ON public.business_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Business owners can insert their own profile" 
ON public.business_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_profiles(user_id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, reviewer_id) -- One review per user per business
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = reviewer_id);

-- Update the handle_new_user function to support account types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  account_type TEXT;
BEGIN
  -- Get account type from metadata
  account_type := NEW.raw_user_meta_data ->> 'account_type';
  
  -- Insert profile for regular users
  IF account_type IS NULL OR account_type = 'user' THEN
    INSERT INTO public.profiles (user_id, username, display_name)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'username',
      NEW.raw_user_meta_data ->> 'display_name'
    );
    
    -- Assign user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
  -- Insert business profile for business accounts
  ELSIF account_type = 'business' THEN
    INSERT INTO public.business_profiles (
      user_id, 
      business_name, 
      business_description,
      business_category
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'business_name',
      NEW.raw_user_meta_data ->> 'business_description',
      NEW.raw_user_meta_data ->> 'business_category'
    );
    
    -- Assign business role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'business');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to update business profile ratings
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update business profile with new average rating and review count
  UPDATE public.business_profiles 
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews 
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews 
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    )
  WHERE user_id = COALESCE(NEW.business_id, OLD.business_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for updating business ratings
CREATE TRIGGER update_business_rating_on_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_rating();

CREATE TRIGGER update_business_rating_on_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_rating();

CREATE TRIGGER update_business_rating_on_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_rating();

-- Create trigger for automatic timestamp updates on business_profiles
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on reviews
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();