"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Loader2,
  CalendarDays,
  Clock,
  HelpCircle,
  Megaphone,
  User,
  ArrowRight,
  Filter,
} from "lucide-react";

interface ActivityItem {
  id: string;
  category: "leaves" | "attendance" | "wfh" | "regularization" | "ticket" | "announcement" | "member";
  action: string;
  title: string;
  description: string;
  actorName: string;
  timestamp: string;
  link: string;
}

export default function ActivityFeedPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const offset = (page - 1) * limit;
      const res = await fetch(`/api/activity?filter=${filter}&limit=${limit}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activity || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to load activity feed:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case "leaves":
        return {
          icon: CalendarDays,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          label: "Leaves",
        };
      case "wfh":
        return {
          icon: CalendarDays,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
          label: "WFH",
        };
      case "attendance":
        return {
          icon: Clock,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          label: "Attendance",
        };
      case "regularization":
        return {
          icon: Clock,
          color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
          label: "Punch Adjustment",
        };
      case "ticket":
        return {
          icon: HelpCircle,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          label: "Support Ticket",
        };
      case "announcement":
        return {
          icon: Megaphone,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          label: "Announcement",
        };
      default:
        return {
          icon: User,
          color: "text-slate-500 bg-slate-500/10 border-slate-550/20",
          label: "Team Directory",
        };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return past.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return "Recently";
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Activity Feed"
        title="Workspace Activity Logs"
        description="A normalized real-time log of check-in times, leave request changes, raised support tickets, and team directory events."
      />

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 items-center border-b border-border pb-4 select-none">
        <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider mr-2">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>
        {[
          { key: "all", label: "All Activity" },
          { key: "leaves", label: "Leaves & WFH" },
          { key: "attendance", label: "Punches & Corrections" },
          { key: "support", label: "Support tickets" },
          { key: "announcements", label: "Notices" },
          { key: "team", label: "Teammates" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filter === tab.key
                ? "bg-primary text-primary-foreground shadow-sm font-black"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Filtering activity stream...
            </p>
          </div>
        </div>
      ) : activities.length === 0 ? (
        <Card className="crm-card py-16 text-center text-slate-400 text-xs">
          <Activity className="h-12 w-12 text-slate-350 mx-auto mb-4" />
          <p className="font-bold text-slate-700 dark:text-slate-300">No events logged yet</p>
          <p className="text-slate-450 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Events matching this filter will appear as team members check in, apply for leaves, or post notices.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {activities.map((act) => {
              const meta = getCategoryMeta(act.category);
              const Icon = meta.icon;

              return (
                <div
                  key={act.id}
                  onClick={() => router.push(act.link)}
                  className="flex gap-4 items-center p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Category icon indicator */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                          {act.title}
                        </span>
                        <Badge className="bg-slate-100 hover:bg-slate-100 dark:bg-slate-900 text-[9px] text-slate-500 font-bold border border-slate-250 dark:border-slate-800">
                          {meta.label}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-350 shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              );
            })}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-6">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Page {page} of {totalPages} ({totalCount} items)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-xs font-bold uppercase tracking-wider h-10 border-border cursor-pointer"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs font-bold uppercase tracking-wider h-10 border-border cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
