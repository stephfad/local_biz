import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StarRating } from '@/components/StarRating';
import ReviewFrequencyDialog from '@/components/ReviewFrequencyDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Star, Loader2, MessageSquare } from 'lucide-react';

interface ReviewDialogProps {
  businessId: string;
  businessName: string;
  businessData?: {
    id: string;
    name: string;
    category: string;
    description: string;
    address: string;
    phone: string;
  };
  onReviewAdded?: () => void;
  children: React.ReactNode;
}

const ReviewDialog = ({ businessId, businessName, businessData, onReviewAdded, children }: ReviewDialogProps) => {
  const { user, canReviewBusiness, logReviewAttempt } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [frequencyDialogOpen, setFrequencyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [nextReviewDate, setNextReviewDate] = useState<string>('');

  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
  });

  useEffect(() => {
    if (open && user) {
      checkReviewEligibility();
    }
  }, [open, user, businessId]);

  const checkReviewEligibility = async () => {
    const { canReview, nextReviewDate: nextDate, error } = await canReviewBusiness(businessId);
    
    if (error) {
      setError(error.message || 'Failed to check review eligibility');
      return;
    }

    if (!canReview) {
      if (nextDate) {
        setNextReviewDate(nextDate);
      }
      setOpen(false);
      setFrequencyDialogOpen(true);
      
      // Log the failed attempt
      await logReviewAttempt(businessId, false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!user) {
      setError('You must be logged in to leave a review');
      setIsLoading(false);
      return;
    }

    if (formData.rating === 0) {
      setError('Please provide a rating');
      setIsLoading(false);
      return;
    }

    // Check if this is a Google business and save it first
    let finalBusinessId = businessId;
    
    if (businessId.startsWith('google_') && businessData) {
      try {
        const { data: savedBusiness, error: saveError } = await supabase.functions.invoke(
          'save-google-business',
          {
            body: { businessData }
          }
        );

        if (saveError) {
          console.error('Error saving Google business:', saveError);
          setError('Failed to save business information');
          setIsLoading(false);
          return;
        }

        finalBusinessId = savedBusiness.businessId;
        console.log('Google business saved with ID:', finalBusinessId);
      } catch (error) {
        console.error('Error calling save-google-business:', error);
        setError('Failed to save business information');
        setIsLoading(false);
        return;
      }
    }

    // Double-check eligibility before submitting
    const { canReview, nextReviewDate: nextDate } = await canReviewBusiness(finalBusinessId);
    
    if (!canReview) {
      if (nextDate) {
        setNextReviewDate(nextDate);
      }
      setOpen(false);
      setFrequencyDialogOpen(true);
      await logReviewAttempt(finalBusinessId, false);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .insert({
        business_id: finalBusinessId,
        reviewer_id: user.id,
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
      });

    if (error) {
      setError(error.message || 'Failed to submit review');
      await logReviewAttempt(finalBusinessId, false);
    } else {
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. The business has been saved to our database.",
      });
      
      // Log successful attempt
      await logReviewAttempt(finalBusinessId, true);
      
      // Reset form
      setFormData({
        rating: 0,
        title: '',
        content: '',
      });
      
      setOpen(false);
      onReviewAdded?.();
    }

    setIsLoading(false);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Review {businessName}
            </DialogTitle>
            <DialogDescription>
              Share your experience with this business
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Rating *</Label>
              <StarRating
                rating={formData.rating}
                onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
                size="lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-title">Title</Label>
              <Input
                id="review-title"
                type="text"
                placeholder="Great service!"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-content">Review (Optional)</Label>
              <Textarea
                id="review-content"
                placeholder="Tell others about your experience..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                disabled={isLoading}
                rows={4}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ReviewFrequencyDialog
        open={frequencyDialogOpen}
        onOpenChange={setFrequencyDialogOpen}
        nextReviewDate={nextReviewDate}
        businessName={businessName}
      />
    </>
  );
};

export default ReviewDialog;