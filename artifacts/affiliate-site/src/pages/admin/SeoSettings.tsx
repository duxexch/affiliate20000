import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/AdminLayout";
import { useSeo } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useGetSeoSettings, useUpdateSeoSettings, getGetSeoSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  siteTitle: z.string().optional(),
  siteTitleAr: z.string().optional(),
  siteDescription: z.string().optional(),
  siteDescriptionAr: z.string().optional(),
  keywords: z.string().optional(),
  robotsTxt: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  googleSearchConsoleId: z.string().optional(),
  ogImage: z.string().optional(),
  allowIndexing: z.boolean(),
});
type SeoForm = z.infer<typeof schema>;

export default function AdminSeoSettings() {
  useSeo({ title: "SEO Settings" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSeoSettings();
  const updateSettings = useUpdateSeoSettings();

  const form = useForm<SeoForm>({
    resolver: zodResolver(schema),
    defaultValues: { allowIndexing: true },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        siteTitle: settings.siteTitle ?? "",
        siteTitleAr: settings.siteTitleAr ?? "",
        siteDescription: settings.siteDescription ?? "",
        siteDescriptionAr: settings.siteDescriptionAr ?? "",
        keywords: settings.keywords ?? "",
        robotsTxt: settings.robotsTxt ?? "",
        googleAnalyticsId: settings.googleAnalyticsId ?? "",
        googleSearchConsoleId: settings.googleSearchConsoleId ?? "",
        ogImage: settings.ogImage ?? "",
        allowIndexing: settings.allowIndexing,
      });
    }
  }, [settings]);

  const onSubmit = (data: SeoForm) => {
    updateSettings.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "SEO settings saved" });
          queryClient.invalidateQueries({ queryKey: getGetSeoSettingsQueryKey() });
        },
        onError: () => toast({ title: "Error saving settings", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return <AdminLayout><div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">SEO Settings</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-secondary/50 border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold">Homepage SEO</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="siteTitle" render={({ field }) => (
                  <FormItem><FormLabel>Site Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="siteTitleAr" render={({ field }) => (
                  <FormItem><FormLabel>Site Title (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="siteDescription" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Meta Description (EN)</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="siteDescriptionAr" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Meta Description (AR)</FormLabel><FormControl><Textarea {...field} rows={3} dir="rtl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="keywords" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Keywords</FormLabel><FormControl><Input {...field} placeholder="keyword1, keyword2, keyword3" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ogImage" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>OG Image URL</FormLabel><FormControl><Input {...field} type="url" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div className="bg-secondary/50 border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold">Indexing & Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="googleAnalyticsId" render={({ field }) => (
                  <FormItem><FormLabel>Google Analytics ID</FormLabel><FormControl><Input {...field} placeholder="G-XXXXXXXXXX" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="googleSearchConsoleId" render={({ field }) => (
                  <FormItem><FormLabel>Search Console ID</FormLabel><FormControl><Input {...field} placeholder="verification-code" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="allowIndexing" render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div>
                    <FormLabel className="!mt-0">Allow Search Engine Indexing</FormLabel>
                    <FormDescription className="text-xs">When off, robots.txt will block all crawlers</FormDescription>
                  </div>
                </FormItem>
              )} />
            </div>

            <div className="bg-secondary/50 border border-border/50 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold">Robots.txt</h2>
              <FormField control={form.control} name="robotsTxt" render={({ field }) => (
                <FormItem>
                  <FormControl><Textarea {...field} rows={8} className="font-mono text-xs" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Button type="submit" disabled={updateSettings.isPending} className="font-bold">
              {updateSettings.isPending ? "Saving..." : "Save SEO Settings"}
            </Button>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
