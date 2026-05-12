import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/AdminLayout";
import { useSeo } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  nameAr: z.string().optional(),
  slug: z.string().min(1, "Slug required"),
  description: z.string().optional(),
  icon: z.string().optional(),
});
type CategoryForm = z.infer<typeof schema>;

export default function AdminCategories() {
  useSeo({ title: "Manage Categories" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [editId, setEditId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<CategoryForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", nameAr: "", slug: "", description: "", icon: "" },
  });

  const openNew = () => {
    setEditId(null);
    form.reset({ name: "", nameAr: "", slug: "", description: "", icon: "" });
    setOpen(true);
  };

  const openEdit = (cat: NonNullable<typeof categories>[0]) => {
    setEditId(cat.id);
    form.reset({ name: cat.name, nameAr: cat.nameAr ?? "", slug: cat.slug, description: cat.description ?? "", icon: cat.icon ?? "" });
    setOpen(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });

  const onSubmit = (data: CategoryForm) => {
    if (editId) {
      updateCategory.mutate(
        { id: editId, data },
        {
          onSuccess: () => { toast({ title: "Updated" }); setOpen(false); invalidate(); },
          onError: () => toast({ title: "Error", variant: "destructive" }),
        }
      );
    } else {
      createCategory.mutate(
        { data },
        {
          onSuccess: () => { toast({ title: "Created" }); setOpen(false); invalidate(); },
          onError: () => toast({ title: "Error", variant: "destructive" }),
        }
      );
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => { toast({ title: "Deleted" }); invalidate(); },
        onError: () => toast({ title: "Error", variant: "destructive" }),
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Categories</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Category" : "New Category"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="nameAr" render={({ field }) => (
                      <FormItem><FormLabel>Name (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="slug" render={({ field }) => (
                      <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="icon" render={({ field }) => (
                      <FormItem><FormLabel>Icon (emoji)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createCategory.isPending || updateCategory.isPending}>
                    {editId ? "Update" : "Create"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            : categories?.map((cat) => (
                <div key={cat.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <span className="text-3xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{cat.name}</div>
                    <div className="text-sm text-muted-foreground">{cat.nameAr}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cat.offerCount} offers · /{cat.slug}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(cat.id, cat.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </AdminLayout>
  );
}
