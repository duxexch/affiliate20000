import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Offers from "@/pages/Offers";
import OfferDetail from "@/pages/OfferDetail";
import Category from "@/pages/Category";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminOffersList from "@/pages/admin/OffersList";
import OfferForm from "@/pages/admin/OfferForm";
import AdminCategories from "@/pages/admin/Categories";
import AdminSeoSettings from "@/pages/admin/SeoSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/offers" component={Offers} />
      <Route path="/offer/:slug" component={OfferDetail} />
      <Route path="/category/:slug" component={Category} />

      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/offers" component={AdminOffersList} />
      <Route path="/admin/offers/new" component={OfferForm} />
      <Route path="/admin/offers/edit/:id" component={OfferForm} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/seo" component={AdminSeoSettings} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
