-- Update the handle_new_user function to make the first user an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  account_type TEXT;
  user_count INTEGER;
BEGIN
  -- Get account type from metadata
  account_type := NEW.raw_user_meta_data ->> 'account_type';
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Insert profile for regular users
  IF account_type IS NULL OR account_type = 'user' THEN
    INSERT INTO public.profiles (user_id, username, display_name)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'username',
      NEW.raw_user_meta_data ->> 'display_name'
    );
    
    -- Assign admin role if this is the first user, otherwise regular user role
    IF user_count = 1 THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin');
    ELSE
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user');
    END IF;
    
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
    
    -- Assign business role (first user still gets admin if business account)
    IF user_count = 1 THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin'), (NEW.id, 'business');
    ELSE
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'business');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the reviews delete policy to allow admins to delete any review
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

CREATE POLICY "Users can delete their own reviews or admins can delete any"
ON public.reviews
FOR DELETE
USING (
  auth.uid() = reviewer_id OR has_role(auth.uid(), 'admin')
);