import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { businessData } = await req.json();
    
    if (!businessData) {
      throw new Error('Business data is required');
    }

    console.log('Saving Google business to local database:', businessData.name);

    // Check if this Google business was already saved
    const googleSourceId = businessData.id.replace('google_', '');
    
    const { data: existing, error: checkError } = await supabaseClient
      .from('business_profiles')
      .select('user_id')
      .eq('business_name', businessData.name)
      .eq('business_address', businessData.address)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing business:', checkError);
    }

    // If business already exists, return its ID
    if (existing) {
      console.log('Business already exists with ID:', existing.user_id);
      return new Response(
        JSON.stringify({ businessId: existing.user_id, isNew: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the current user for created_by field
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Create a new business profile
    const { data: newBusiness, error: insertError } = await supabaseClient
      .from('business_profiles')
      .insert({
        business_name: businessData.name,
        business_description: businessData.description,
        business_category: businessData.category,
        business_address: businessData.address,
        business_phone: businessData.phone,
        business_email: null,
        business_website: null,
        is_claimed: false,
        created_by: user?.id || null,
      })
      .select('user_id')
      .single();

    if (insertError) {
      console.error('Error inserting business:', insertError);
      throw insertError;
    }

    console.log('Successfully saved Google business with ID:', newBusiness.user_id);

    // Now fetch and save Google reviews for this business
    if (GOOGLE_API_KEY) {
      try {
        const cleanPlaceId = googleSourceId;
        console.log('Fetching Google reviews for place:', cleanPlaceId);

        const placeUrl = `https://places.googleapis.com/v1/places/${cleanPlaceId}`;
        
        const reviewsResponse = await fetch(placeUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'reviews'
          }
        });

        const reviewsData = await reviewsResponse.json();

        if (reviewsResponse.ok && reviewsData.reviews) {
          console.log(`Found ${reviewsData.reviews.length} Google reviews to save`);
          
          // Save each Google review to our database
          for (const review of reviewsData.reviews) {
            await supabaseClient
              .from('reviews')
              .insert({
                business_id: newBusiness.user_id,
                reviewer_id: user?.id || null,
                rating: review.rating || 5,
                title: '',
                content: review.text?.text || '',
              });
          }
          
          console.log('Successfully saved Google reviews');
        }
      } catch (reviewError) {
        console.error('Error saving Google reviews:', reviewError);
        // Don't fail the whole operation if reviews fail to save
      }
    }

    return new Response(
      JSON.stringify({ businessId: newBusiness.user_id, isNew: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save-google-business function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
