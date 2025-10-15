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

    const { query, location, radius = 50000 } = await req.json();
    
    console.log('Fetching Google businesses with query:', query);

    // Use New Places API (Text Search)
    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    const requestBody: any = {
      textQuery: query || 'businesses',
      maxResultCount: 20
    };

    if (location) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: parseFloat(location.split(',')[0]),
            longitude: parseFloat(location.split(',')[1])
          },
          radius: radius
        }
      };
    }

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.photos,places.nationalPhoneNumber,places.currentOpeningHours,places.editorialSummary'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      throw new Error(`Google Places API error: ${data.error?.message || response.statusText}`);
    }

    // Transform Google Places data to match our business format
    const businesses = (data.places || []).map((place: any) => ({
      id: `google_${place.id}`,
      name: place.displayName?.text || 'Unknown',
      category: place.types?.[0]?.replace(/_/g, ' ') || 'Other',
      image: place.photos?.[0]?.name
        ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=400&key=${GOOGLE_API_KEY}`
        : "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      address: place.formattedAddress || 'Address not available',
      phone: place.nationalPhoneNumber || 'Phone not available',
      hours: place.currentOpeningHours?.openNow ? 'Open now' : 'Hours not available',
      priceRange: '$$',
      description: place.editorialSummary?.text || 'No description available',
      isGoogleBusiness: true,
    }));

    console.log(`Found ${businesses.length} Google businesses`);

    return new Response(JSON.stringify({ businesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-google-businesses function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
