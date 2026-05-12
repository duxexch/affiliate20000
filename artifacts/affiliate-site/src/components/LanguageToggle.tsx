import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="flex items-center gap-2"
    >
      <Globe className="w-4 h-4" />
      <span className="font-semibold">{language === "en" ? "AR" : "EN"}</span>
    </Button>
  );
}
