import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./StarRating";
import { MapPin, Clock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Business {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  hours: string;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  description: string;
}

interface BusinessCardProps {
  business: Business;
  className?: string;
  onClick?: () => void;
}

export const BusinessCard = ({ business, className, onClick }: BusinessCardProps) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-elevated transition-all duration-300 hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img 
            src={business.image} 
            alt={business.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm"
          >
            {business.category}
          </Badge>
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1">
            <span className="text-sm font-medium">{business.priceRange}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{business.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {business.description}
            </p>
          </div>
          
          <StarRating 
            rating={business.rating} 
            showValue={true}
          />
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="line-clamp-1">{business.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{business.hours}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span>{business.phone}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {business.reviewCount} reviews
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};