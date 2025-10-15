import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const { placeId } = await req.json();
    
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    // Remove 'google_' prefix if present
    const cleanPlaceId = placeId.replace('google_', '');
    
    console.log('Fetching Google reviews for place:', cleanPlaceId);

    // Use New Places API (Place Details)
    const placeUrl = `https://places.googleapis.com/v1/places/${cleanPlaceId}`;
    
    const response = await fetch(placeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'reviews'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      throw new Error(`Google Places API error: ${data.error?.message || response.statusText}`);
    }

    // Transform Google reviews to match our review format
    const reviews = (data.reviews || []).map((review: any) => ({
      id: `google_review_${review.name}`,
      userId: review.authorAttribution?.displayName || 'Google User',
      userName: review.authorAttribution?.displayName || 'Google User',
      userAvatar: review.authorAttribution?.photoUri || undefined,
      rating: review.rating || 0,
      title: '',
      content: review.text?.text || '',
      date: review.publishTime || new Date().toISOString(),
      helpful: 0,
      verified: true,
      isGoogleReview: true
    }));

    console.log(`Found ${reviews.length} Google reviews`);

    return new Response(JSON.stringify({ reviews }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-google-place-reviews function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
