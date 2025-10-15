-- Add created_by field to track who added the business
ALTER TABLE public.business_profiles 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add claimed status to track if business owner has claimed the account
ALTER TABLE public.business_profiles 
ADD COLUMN is_claimed BOOLEAN DEFAULT FALSE;

-- Add claim_token for business owners to claim their accounts
ALTER TABLE public.business_profiles 
ADD COLUMN claim_token UUID DEFAULT gen_random_uuid();

-- Drop the existing unique constraint on business_id and reviewer_id in reviews
ALTER TABLE public.reviews 
DROP CONSTRAINT reviews_business_id_reviewer_id_key;

-- Create a new table to track review attempts and timing
CREATE TABLE public.review_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_profiles(user_id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  was_successful BOOLEAN DEFAULT FALSE
);

-- Enable RLS on review_attempts
ALTER TABLE public.review_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for review_attempts
CREATE POLICY "Users can view their own review attempts" 
ON public.review_attempts 
FOR SELECT 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can insert their own review attempts" 
ON public.review_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

-- Create function to check if user can review a business
CREATE OR REPLACE FUNCTION public.can_user_review_business(_reviewer_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_creator_id uuid;
  last_review_date timestamp with time zone;
  is_creator boolean;
BEGIN
  -- Get the creator of the business
  SELECT created_by INTO business_creator_id
  FROM public.business_profiles
  WHERE user_id = _business_id;
  
  -- Check if the reviewer is the creator of the business
  is_creator := (business_creator_id = _reviewer_id);
  
  -- If not the creator, they can review normally (existing constraint will apply)
  IF NOT is_creator THEN
    RETURN TRUE;
  END IF;
  
  -- If creator, check last review date (fortnight = 14 days)
  SELECT created_at INTO last_review_date
  FROM public.reviews
  WHERE business_id = _business_id 
    AND reviewer_id = _reviewer_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no previous review, allow it
  IF last_review_date IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if 14 days have passed since last review
  RETURN (last_review_date + INTERVAL '14 days') <= now();
END;
$$;

-- Create function to log review attempts
CREATE OR REPLACE FUNCTION public.log_review_attempt(_reviewer_id uuid, _business_id uuid, _was_successful boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.review_attempts (business_id, reviewer_id, was_successful)
  VALUES (_business_id, _reviewer_id, _was_successful);
END;
$$;

-- Update RLS policy for reviews to use the new function
DROP POLICY "Users can create reviews" ON public.reviews;

CREATE POLICY "Users can create reviews if allowed" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND 
  public.can_user_review_business(auth.uid(), business_id)
);

-- Add new constraint to allow one review per user per business, but with timing restrictions
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_business_reviewer_unique UNIQUE(business_id, reviewer_id);

-- Create function to handle business claiming
CREATE OR REPLACE FUNCTION public.claim_business_account(_claim_token uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_user_id uuid;
BEGIN
  -- Find the business with this claim token
  SELECT user_id INTO business_user_id
  FROM public.business_profiles
  WHERE claim_token = _claim_token AND NOT is_claimed;
  
  -- If no business found or already claimed, return false
  IF business_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the business profile to mark as claimed and update user_id
  UPDATE public.business_profiles
  SET is_claimed = TRUE, user_id = _user_id, claim_token = NULL
  WHERE user_id = business_user_id;
  
  -- Update user role to business
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'business')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;