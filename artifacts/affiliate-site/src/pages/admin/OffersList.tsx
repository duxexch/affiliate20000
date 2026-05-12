import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { useSeo } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Star, TrendingUp } from "lucide-react";
import {
  useListOffers,
  useDeleteOffer,
  getListOffersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminOffersList() {
  useSeo({ title: "Manage Offers" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data: offersData, isLoading } = useListOffers({ page, limit: 20 });
  const deleteOffer = useDeleteOffer();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteOffer.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Offer deleted" });
          queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
        },
        onError: () => toast({ title: "Error deleting offer", variant: "destructive" }),
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Offers</h1>
            <p className="text-muted-foreground mt-1">{offersData?.total ?? 0} total offers</p>
          </div>
          <Button asChild>
            <Link href="/admin/offers/new">
              <Plus className="w-4 h-4 mr-2" /> Add Offer
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border/50 overflow-hidden bg-secondary/20">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-secondary/50">
              <tr>
                <th className="text-left p-4 font-semibold text-muted-foreground">Offer</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Category</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Rating</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Clicks</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-right p-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="p-4"><Skeleton className="h-5" /></td>
                      ))}
                    </tr>
                  ))
                : offersData?.offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={offer.imageUrl} alt={offer.title} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <div className="font-medium line-clamp-1 max-w-xs">{offer.title}</div>
                            <div className="text-xs text-muted-foreground">/offer/{offer.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{offer.category?.name ?? "—"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          <span>{offer.rating}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">{offer.clickCount.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={offer.isActive ? "default" : "secondary"} className="text-xs">
                            {offer.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {offer.isFeatured && <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Featured</Badge>}
                          {offer.isTrending && (
                            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                              <TrendingUp className="w-3 h-3 mr-1" />Trending
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/offers/edit/${offer.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(offer.id, offer.title)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {offersData && offersData.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">{page} / {offersData.totalPages}</span>
            <Button variant="outline" disabled={page >= offersData.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
