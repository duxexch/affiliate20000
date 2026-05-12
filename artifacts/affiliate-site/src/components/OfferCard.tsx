import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Offer } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ChevronRight } from "lucide-react";
import { useTrackClick } from "@workspace/api-client-react";

export function OfferCard({ offer }: { offer: Offer }) {
  const { t, language } = useLanguage();
  const trackClick = useTrackClick();

  const handleClaim = (e: React.MouseEvent) => {
    e.preventDefault();
    trackClick.mutate(
      { data: { offerId: offer.id, userAgent: navigator.userAgent } },
      {
        onSuccess: (res) => {
          window.open(res.affiliateUrl, '_blank');
        }
      }
    );
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={offer.imageUrl || "https://placehold.co/600x400/1a1f2c/d4af37?text=Offer"} 
          alt={t(offer.title, offer.titleAr)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        
        {offer.category && (
          <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-md text-foreground border-primary/50">
            {t(offer.category.name, offer.category.nameAr)}
          </Badge>
        )}
        
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/80 backdrop-blur-md px-2 py-1 rounded-md text-sm font-medium">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span>{offer.rating.toFixed(1)}</span>
        </div>
      </div>

      <CardContent className="p-5">
        <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          <Link href={`/offer/${offer.slug}`} className="hover:underline">
            {t(offer.title, offer.titleAr)}
          </Link>
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 min-h-[2.5rem]">
          {t(offer.shortDescription || "", offer.shortDescriptionAr)}
        </p>
      </CardContent>

      <CardFooter className="p-5 pt-0 mt-auto">
        <Button 
          onClick={handleClaim}
          className="w-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all group-hover:scale-[1.02]"
        >
          {t(offer.ctaText || "Claim Bonus", offer.ctaTextAr || "احصل على المكافأة")}
          <ChevronRight className={`w-4 h-4 ml-1 ${language === 'ar' ? 'rotate-180' : ''}`} />
        </Button>
      </CardFooter>
    </Card>
  );
}
