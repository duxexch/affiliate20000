import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/AdminLayout";
import { useSeo } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import {
  useGetOffer,
  useCreateOffer,
  useUpdateOffer,
  useListCategories,
  getListOffersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  titleAr: z.string().optional(),
  slug: z.string().min(1, "Slug required"),
  shortDescription: z.string().optional(),
  shortDescriptionAr: z.string().optional(),
  longDescription: z.string().optional(),
  longDescriptionAr: z.string().optional(),
  affiliateUrl: z.string().url("Valid URL required"),
  imageUrl: z.string().url("Valid URL required"),
  ctaText: z.string().optional(),
  ctaTextAr: z.string().optional(),
  rating: z.coerce.number().min(0).max(5),
  categoryId: z.coerce.number().optional(),
  seoTitle: z.string().optional(),
  seoTitleAr: z.string().optional(),
  seoDescription: z.string().optional(),
  seoDescriptionAr: z.string().optional(),
  keywords: z.string().optional(),
  faqSchema: z.string().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isTrending: z.boolean(),
  sortOrder: z.coerce.number().optional(),
});
type OfferFormData = z.infer<typeof schema>;

export default function OfferForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const offerId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useSeo({ title: isEdit ? "Edit Offer" : "New Offer" });

  const { data: offer, isLoading } = useGetOffer(offerId, {
    query: { enabled: isEdit && !!offerId, queryKey: [] },
  });
  const { data: categories } = useListCategories();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();

  const form = useForm<OfferFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", slug: "", affiliateUrl: "", imageUrl: "",
      rating: 4.5, isActive: true, isFeatured: false, isTrending: false, sortOrder: 0,
    },
  });

  useEffect(() => {
    if (offer && isEdit) {
      form.reset({
        title: offer.title,
        titleAr: offer.titleAr ?? "",
        slug: offer.slug,
        shortDescription: offer.shortDescription ?? "",
        shortDescriptionAr: offer.shortDescriptionAr ?? "",
        longDescription: offer.longDescription ?? "",
        longDescriptionAr: offer.longDescriptionAr ?? "",
        affiliateUrl: offer.affiliateUrl,
        imageUrl: offer.imageUrl,
        ctaText: offer.ctaText ?? "",
        ctaTextAr: offer.ctaTextAr ?? "",
        rating: offer.rating,
        categoryId: offer.categoryId ?? undefined,
        seoTitle: offer.seoTitle ?? "",
        seoTitleAr: offer.seoTitleAr ?? "",
        seoDescription: offer.seoDescription ?? "",
        seoDescriptionAr: offer.seoDescriptionAr ?? "",
        keywords: offer.keywords ?? "",
        faqSchema: offer.faqSchema ?? "",
        isActive: offer.isActive,
        isFeatured: offer.isFeatured,
        isTrending: offer.isTrending,
        sortOrder: offer.sortOrder,
      });
    }
  }, [offer, isEdit]);

  const onSubmit = (data: OfferFormData) => {
    if (isEdit) {
      updateOffer.mutate(
        { id: offerId, data },
        {
          onSuccess: () => {
            toast({ title: "Offer updated" });
            queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
            setLocation("/admin/offers");
          },
          onError: () => toast({ title: "Error updating offer", variant: "destructive" }),
        }
      );
    } else {
      createOffer.mutate(
        { data: { ...data, affiliateUrl: data.affiliateUrl, imageUrl: data.imageUrl } },
        {
          onSuccess: () => {
            toast({ title: "Offer created" });
            queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
            setLocation("/admin/offers");
          },
          onError: () => toast({ title: "Error creating offer", variant: "destructive" }),
        }
      );
    }
  };

  if (isEdit && isLoading) {
    return <AdminLayout><Skeleton className="h-96 w-full rounded-xl" /></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/offers"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          </Button>
          <h1 className="text-3xl font-bold">{isEdit ? "Edit Offer" : "New Offer"}</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-secondary/50 border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold">Basic Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="titleAr" render={({ field }) => (
                  <FormItem><FormLabel>Title (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} placeholder="offer-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="rating" render={({ field }) => (
                  <FormItem><FormLabel>Rating (0-5)</FormLabel><FormControl><Input {...field} type="number" step="0.1" min="0" max="5" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="affiliateUrl" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Affiliate URL</FormLabel><FormControl><Input {...field} type="url" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Image URL</FormLabel><FormControl><Input {...field} type="url" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ctaText" render={({ field }) => (
                  <FormItem><FormLabel>CTA Text (EN)</FormLabel><FormControl><Input {...field} placeholder="Claim Bonus" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ctaTextAr" render={({ field }) => (
                  <FormItem><FormLabel>CTA Text (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel>
                  <Select value={field.value?.toString() ?? ""} onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories?.map((cat) => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="sortOrder" render={({ field }) => (
                  <FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="shortDescription" render={({ field }) => (
                  <FormItem><FormLabel>Short Description (EN)</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="shortDescriptionAr" render={({ field }) => (
                  <FormItem><FormLabel>Short Description (AR)</FormLabel><FormControl><Textarea {...field} rows={3} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="longDescription" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Long Description (EN)</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="longDescriptionAr" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Long Description (AR)</FormLabel><FormControl><Textarea {...field} rows={5} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div className="bg-secondary/50 border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold">SEO</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="seoTitle" render={({ field }) => (
                  <FormItem><FormLabel>SEO Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="seoTitleAr" render={({ field }) => (
                  <FormItem><FormLabel>SEO Title (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="seoDescription" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Meta Description (EN)</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="seoDescriptionAr" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Meta Description (AR)</FormLabel><FormControl><Textarea {...field} rows={2} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="keywords" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Keywords (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="faqSchema" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>FAQ Schema (JSON: [{"{"}question, answer{"}"}])</FormLabel><FormControl><Textarea {...field} rows={4} className="font-mono text-xs" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div className="bg-secondary/50 border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold">Visibility</h2>
              <div className="grid grid-cols-3 gap-4">
                {(["isActive", "isFeatured", "isTrending"] as const).map((name) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 capitalize cursor-pointer">{name.replace("is", "")}</FormLabel>
                    </FormItem>
                  )} />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={createOffer.isPending || updateOffer.isPending} className="font-bold">
                {createOffer.isPending || updateOffer.isPending ? "Saving..." : isEdit ? "Update Offer" : "Create Offer"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/offers">Cancel</Link>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
