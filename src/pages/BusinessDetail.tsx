import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/StarRating";
import { ReviewCard, Review } from "@/components/ReviewCard";
import ReviewDialog from "@/components/ReviewDialog";
import { ArrowLeft, MapPin, Clock, Phone, Share2, Loader2 } from "lucide-react";
import { Business } from "@/components/BusinessCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get business data from navigation state if available
  const navigationBusinessData = location.state?.businessData as Business | undefined;
  
  const fetchReviews = async (businessId: string) => {
    // Fetch local reviews from database
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }
    
    const localReviews: Review[] = (reviewsData || []).map(review => ({
      id: review.id,
      userId: review.reviewer_id,
      userName: 'Anonymous User',
      userAvatar: undefined,
      rating: review.rating,
      title: review.title || '',
      content: review.content || '',
      date: new Date(review.created_at),
      helpful: 0,
      verified: false
    }));
    
    // If it's a Google business, also fetch Google reviews
    if (businessId.startsWith('google_')) {
      try {
        const { data: googleReviewsData, error: googleError } = await supabase.functions.invoke(
          'fetch-google-place-reviews',
          {
            body: { placeId: businessId }
          }
        );
        
        if (googleError) {
          console.error('Error fetching Google reviews:', googleError);
        } else if (googleReviewsData?.reviews) {
          const googleReviews: Review[] = googleReviewsData.reviews.map((review: any) => ({
            id: review.id,
            userId: review.userId,
            userName: review.userName,
            userAvatar: review.userAvatar,
            rating: review.rating,
            title: review.title || '',
            content: review.content || '',
            date: new Date(review.date),
            helpful: review.helpful || 0,
            verified: review.verified || false
          }));
          
          // Combine local and Google reviews
          return [...localReviews, ...googleReviews];
        }
      } catch (error) {
        console.error('Error fetching Google reviews:', error);
      }
    }
    
    return localReviews;
  };
  
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!id) return;
      
      try {
        // If we have business data from navigation, use it first
        if (navigationBusinessData && navigationBusinessData.id === id) {
          setBusiness(navigationBusinessData);
          // Still fetch reviews if it's a local business
          if (!id.startsWith('google_')) {
            const reviewsData = await fetchReviews(id);
            setReviews(reviewsData);
          }
          setLoading(false);
          return;
        }

        // First, try to fetch from local database for all businesses
        const { data: localBusiness, error: localError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', id)
          .maybeSingle();
        
        if (localBusiness) {
          // Found in local database
          const transformedBusiness: Business = {
            id: localBusiness.user_id,
            name: localBusiness.business_name,
            category: localBusiness.business_category || 'Other',
            image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
            rating: Number(localBusiness.average_rating) || 0,
            reviewCount: localBusiness.total_reviews || 0,
            address: localBusiness.business_address || 'Address not provided',
            phone: localBusiness.business_phone || 'Phone not provided',
            hours: localBusiness.business_hours ? 
              (typeof localBusiness.business_hours === 'object' ? 
                'Hours available' : 
                localBusiness.business_hours as string) : 
              'Hours not provided',
            priceRange: "$$",
            description: localBusiness.business_description || 'No description available'
          };
          setBusiness(transformedBusiness);
          
          // Fetch reviews
          const reviewsData = await fetchReviews(id);
          setReviews(reviewsData);
        } else if (id.startsWith('google_')) {
          // Google business not yet saved locally
          // Create a minimal business object to allow reviews
          const minimalBusiness: Business = {
            id: id,
            name: 'Loading business details...',
            category: 'Other',
            image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
            rating: 0,
            reviewCount: 0,
            address: 'Address will be available after first review',
            phone: 'Phone not available',
            hours: 'Hours not available',
            priceRange: "$$",
            description: 'This business will be saved to our database when you add a review.'
          };
          setBusiness(minimalBusiness);
          setReviews([]);
        } else {
          // Non-Google business not found
          setBusiness(null);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [id, navigationBusinessData]);
  
  const handleReviewAdded = async () => {
    if (!id) return;
    
    // Refetch reviews after a new one is added
    const reviewsData = await fetchReviews(id);
    setReviews(reviewsData);
    
    // Also refetch business to update rating count
    const { data: businessData } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();
    
    if (businessData && business) {
      setBusiness({
        ...business,
        rating: Number(businessData.average_rating) || 0,
        reviewCount: businessData.total_reviews || 0,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Business not found</h1>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: `Check out ${business.name} - ${business.description}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Business link copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to search
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Header */}
            <Card className="shadow-elevated">
              <CardHeader className="p-0">
                <div className="relative h-64 w-full overflow-hidden rounded-t-lg">
                  <img 
                    src={business.image}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold">{business.name}</h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      {business.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6 flex-wrap">
                    <StarRating rating={business.rating} size="lg" />
                    <span className="text-sm text-muted-foreground">
                      Based on {business.reviewCount} reviews
                    </span>
                    <span className="text-lg font-medium">{business.priceRange}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard 
                      key={review.id} 
                      review={review} 
                      onDelete={handleReviewAdded}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{business.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">{business.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <p className="text-muted-foreground">{business.hours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Write Review CTA */}
            <Card className="shadow-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Share Your Experience</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Help others discover great local businesses by sharing your review.
                </p>
                {user ? (
                  <ReviewDialog
                    businessId={business.id}
                    businessName={business.name}
                    businessData={{
                      id: business.id,
                      name: business.name,
                      category: business.category,
                      description: business.description,
                      address: business.address,
                      phone: business.phone,
                    }}
                    onReviewAdded={handleReviewAdded}
                  >
                    <Button className="w-full">Write a Review</Button>
                  </ReviewDialog>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Sign in to leave a review
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate('/auth', { state: { from: location } })}
                    >
                      Sign In to Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;