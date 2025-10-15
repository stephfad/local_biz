import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating = ({ 
  rating, 
  maxRating = 5, 
  size = "md", 
  showValue = true,
  interactive = false,
  onRatingChange 
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const handleStarClick = (starValue: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= rating;
          const isPartial = starValue > rating && starValue - 1 < rating;
          
          return (
            <button
              key={i}
              onClick={() => handleStarClick(starValue)}
              disabled={!interactive}
              className={cn(
                "relative",
                interactive && "cursor-pointer hover:scale-110 transition-transform"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors",
                  isFilled ? "fill-accent text-accent" : "text-muted-foreground"
                )}
              />
              {isPartial && (
                <Star
                  className={cn(
                    sizeClasses[size],
                    "absolute top-0 left-0 fill-accent text-accent",
                    "clip-path-half"
                  )}
                  style={{
                    clipPath: `inset(0 ${100 - ((rating - (starValue - 1)) * 100)}% 0 0)`
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)} ({maxRating})
        </span>
      )}
    </div>
  );
};