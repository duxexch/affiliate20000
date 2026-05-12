import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-9xl font-black text-primary/20 select-none">404</div>
      <h1 className="text-3xl font-bold mb-3">
        {t("Page Not Found", "الصفحة غير موجودة")}
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {t(
          "The page you are looking for doesn't exist or has been moved.",
          "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
        )}
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button asChild>
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            {t("Go Home", "الصفحة الرئيسية")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/offers">
            <Search className="w-4 h-4 mr-2" />
            {t("Browse Offers", "تصفح العروض")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
