import { AdminLayout } from "@/components/AdminLayout";
import { useSeo } from "@/hooks/use-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, MousePointer, Package, Tag, TrendingUp, Calendar } from "lucide-react";
import {
  useGetAnalyticsDashboard,
  useGetTopOffers,
  useGetClicksOverTime,
} from "@workspace/api-client-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  useSeo({ title: "Admin Dashboard" });
  const { data: stats, isLoading: statsLoading } = useGetAnalyticsDashboard();
  const { data: topOffers } = useGetTopOffers({ limit: 5, days: 30 });
  const { data: clicksOverTime } = useGetClicksOverTime({ days: 30 });

  const statCards = stats
    ? [
        { label: "Total Offers", value: stats.totalOffers, icon: Package, color: "text-blue-400" },
        { label: "Total Clicks", value: stats.totalClicks, icon: MousePointer, color: "text-primary" },
        { label: "Categories", value: stats.totalCategories, icon: Tag, color: "text-green-400" },
        { label: "Today", value: stats.clicksToday, icon: Calendar, color: "text-purple-400" },
        { label: "This Week", value: stats.clicksThisWeek, icon: TrendingUp, color: "text-orange-400" },
        { label: "This Month", value: stats.clicksThisMonth, icon: BarChart2, color: "text-red-400" },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your affiliate platform overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statsLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            : statCards.map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="bg-secondary/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <p className="text-3xl font-black">{value.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clicks chart */}
          <Card className="bg-secondary/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Clicks Over Time (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              {clicksOverTime && clicksOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={clicksOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No click data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top offers */}
          <Card className="bg-secondary/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Top Offers (30d)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topOffers && topOffers.length > 0 ? (
                topOffers.map((offer, i) => (
                  <div key={offer.offerId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <img src={offer.imageUrl} alt={offer.title} className="w-8 h-8 rounded object-cover shrink-0" />
                    <span className="flex-1 text-sm font-medium truncate">{offer.title}</span>
                    <span className="text-sm font-bold text-primary">{offer.totalClicks}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
