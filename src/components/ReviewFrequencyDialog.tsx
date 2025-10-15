import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

interface ReviewFrequencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextReviewDate?: string;
  businessName?: string;
}

const ReviewFrequencyDialog = ({ 
  open, 
  onOpenChange, 
  nextReviewDate, 
  businessName 
}: ReviewFrequencyDialogProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilNextReview = (dateString: string) => {
    const nextDate = new Date(dateString);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            Review Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've reached your review limit for this business.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Since you added <strong>{businessName}</strong> to the platform, you can only review it once every 2 weeks to prevent spam.
            </AlertDescription>
          </Alert>

          {nextReviewDate && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Next Review Available:</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {formatDate(nextReviewDate)}
              </p>
              <p className="text-sm font-medium">
                {getDaysUntilNextReview(nextReviewDate)} days remaining
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Why this limit exists:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Prevents users from repeatedly reviewing businesses they created</li>
              <li>• Ensures authentic and unbiased reviews</li>
              <li>• Maintains the integrity of our review system</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewFrequencyDialog;