import { Star } from "lucide-react";

export function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${rating} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? "text-primary fill-primary" : i < rating ? "text-primary fill-primary/50" : "text-muted-foreground"}`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}
