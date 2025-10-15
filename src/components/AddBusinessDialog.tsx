import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, Plus } from 'lucide-react';

interface AddBusinessDialogProps {
  onBusinessAdded?: () => void;
}

const AddBusinessDialog = ({ onBusinessAdded }: AddBusinessDialogProps) => {
  const { addBusiness } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessDescription: '',
    businessCategory: '',
    businessAddress: '',
    businessPhone: '',
    businessWebsite: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.businessName || !formData.businessEmail) {
      setError('Business name and email are required');
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.businessEmail)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    const { error } = await addBusiness(formData);

    if (error) {
      setError(error.message || 'Failed to add business');
    } else {
      toast({
        title: "Business Added!",
        description: "The business has been added successfully. They can claim their account using the email you provided.",
      });
      
      // Reset form
      setFormData({
        businessName: '',
        businessEmail: '',
        businessDescription: '',
        businessCategory: '',
        businessAddress: '',
        businessPhone: '',
        businessWebsite: '',
      });
      
      setOpen(false);
      onBusinessAdded?.();
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Business
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Add a Business
          </DialogTitle>
          <DialogDescription>
            Add a business to the platform. The business owner will receive an invitation to claim their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name *</Label>
              <Input
                id="business-name"
                type="text"
                placeholder="Enter business name"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-email">Business Email *</Label>
              <Input
                id="business-email"
                type="email"
                placeholder="business@example.com"
                value={formData.businessEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-category">Category</Label>
            <Select
              value={formData.businessCategory}
              onValueChange={(value) => setFormData(prev => ({ ...prev, businessCategory: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Restaurant">Restaurant</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
                <SelectItem value="Automotive">Automotive</SelectItem>
                <SelectItem value="Beauty">Beauty & Wellness</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-description">Description</Label>
            <Textarea
              id="business-description"
              placeholder="Describe the business..."
              value={formData.businessDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-phone">Phone Number</Label>
              <Input
                id="business-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.businessPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-website">Website</Label>
              <Input
                id="business-website"
                type="url"
                placeholder="https://example.com"
                value={formData.businessWebsite}
                onChange={(e) => setFormData(prev => ({ ...prev, businessWebsite: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-address">Address</Label>
            <Input
              id="business-address"
              type="text"
              placeholder="123 Main St, City, State 12345"
              value={formData.businessAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
              disabled={isLoading}
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
                  Adding Business...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Business
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBusinessDialog;