import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Trophy } from "lucide-react";
import { useListCategories } from "@workspace/api-client-react";

export function Footer() {
  const { t } = useLanguage();
  const { data: categories } = useListCategories();

  return (
    <footer className="bg-secondary/50 border-t border-border/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-black">
                <span className="text-primary">Affiliate</span>
                <span className="text-foreground">Deals</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {t(
                "Discover the best affiliate offers, casino bonuses, and sports betting deals curated for you.",
                "اكتشف أفضل العروض الحصرية ومكافآت الكازينو والمراهنات الرياضية"
              )}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
              {t("Categories", "الفئات")}
            </h3>
            <ul className="space-y-2">
              {categories?.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t(cat.name, cat.nameAr)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
              {t("Quick Links", "روابط سريعة")}
            </h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("Home", "الرئيسية")}</Link></li>
              <li><Link href="/offers" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("All Offers", "جميع العروض")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            {t(
              "© 2025 AffiliateDeals. All rights reserved. Gambling involves risk. Play responsibly.",
              "© 2025 أفيلييت ديلز. جميع الحقوق محفوظة. المقامرة تنطوي على مخاطر."
            )}
          </p>
          <p className="text-xs text-muted-foreground">18+</p>
        </div>
      </div>
    </footer>
  );
}
