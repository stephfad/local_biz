import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessCard, Business } from "@/components/BusinessCard";
import Navbar from "@/components/Navbar";
import AddBusinessDialog from "@/components/AddBusinessDialog";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-business-street.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user, accountType } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch businesses from Supabase and Google
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        // Fetch from Supabase
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('business_profiles')
          .select('*');
        
        if (supabaseError) {
          console.error('Error fetching Supabase businesses:', supabaseError);
        }

        // Transform Supabase data
        const supabaseBusinesses: Business[] = (supabaseData || []).map(business => ({
          id: business.user_id,
          name: business.business_name,
          category: business.business_category || 'Other',
          image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
          rating: Number(business.average_rating) || 0,
          reviewCount: business.total_reviews || 0,
          address: business.business_address || 'Address not provided',
          phone: business.business_phone || 'Phone not provided',
          hours: business.business_hours ? 
            (typeof business.business_hours === 'object' ? 
              'Hours available' : 
              business.business_hours as string) : 
            'Hours not provided',
          priceRange: "$$",
          description: business.business_description || 'No description available'
        }));

        // Fetch from Google Places - prioritize highly-rated businesses in Zimbabwe
        try {
          const { data: googleData, error: googleError } = await supabase.functions.invoke(
            'fetch-google-businesses',
            {
              body: { query: 'top rated businesses in Zimbabwe' }
            }
          );

          if (googleError) {
            console.error('Error fetching Google businesses:', googleError);
            setBusinesses(supabaseBusinesses);
          } else {
            // Merge both sources intelligently, removing duplicates
            const googleBusinesses = googleData?.businesses || [];
            
            // Create a map of Google businesses by name+address for quick lookup
            const googleBusinessMap = new Map(
              googleBusinesses.map((b: Business) => [
                `${b.name.toLowerCase()}_${b.address.toLowerCase()}`,
                b
              ])
            );
            
            // Filter out local businesses that exist in Google results
            const uniqueLocalBusinesses = supabaseBusinesses.filter(localBusiness => {
              const key = `${localBusiness.name.toLowerCase()}_${localBusiness.address.toLowerCase()}`;
              return !googleBusinessMap.has(key);
            });
            
            // Combine: Google businesses (priority) + unique local businesses
            setBusinesses([...googleBusinesses, ...uniqueLocalBusinesses]);
          }
        } catch (error) {
          console.error('Error calling Google function:', error);
          setBusinesses(supabaseBusinesses);
        }

      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(businesses.map(b => b.category).filter(Boolean)));
    return cats;
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(business => {
      const matchesSearch = searchTerm === "" || 
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "" || business.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [businesses, searchTerm, selectedCategory]);

  const handleBusinessClick = (businessId: string, businessData?: Business) => {
    navigate(`/business/${businessId}`, { state: { businessData } });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Discover Amazing
            <span className="block bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
              Local Businesses
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Find the best restaurants, services, and shops in your neighborhood. 
            Share your experiences and help your community grow.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for businesses, restaurants, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-lg bg-background/95 backdrop-blur border-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Businesses Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Local Businesses</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore top-rated businesses recommended by your community
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge 
              variant={selectedCategory === "" ? "default" : "outline"}
              className="cursor-pointer px-4 py-2"
              onClick={() => setSelectedCategory("")}
            >
              All Categories
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-4 py-2"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Add Business Button for Regular Users */}
          {user && accountType === 'user' && (
            <div className="flex justify-center mb-8">
              <AddBusinessDialog />
            </div>
          )}

          {/* Business Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBusinesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    onClick={() => handleBusinessClick(business.id, business)}
                  />
                ))}
              </div>

              {filteredBusinesses.length === 0 && !loading && (
                <div className="text-center py-16">
                  <h3 className="text-2xl font-semibold mb-4">
                    {businesses.length === 0 ? "No businesses yet" : "No businesses found"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {businesses.length === 0 
                      ? "Be the first to add a business to our platform!" 
                      : "Try adjusting your search or category filters"}
                  </p>
                  {businesses.length === 0 ? (
                    user && accountType === 'user' && <AddBusinessDialog />
                  ) : (
                    <Button onClick={() => {setSearchTerm(""); setSelectedCategory("");}}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Own a Local Business?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join our community and connect with customers who are looking for exactly what you offer.
          </p>
          <Button size="lg" variant="secondary" className="text-primary">
            List Your Business
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;