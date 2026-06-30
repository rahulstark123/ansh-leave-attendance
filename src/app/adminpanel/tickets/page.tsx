"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketReply {
  id: string;
  message: string;
  isAdmin: boolean;
  authorName: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  wid: number;
  workspaceName: string;
  employeeName: string;
  employeeEmail: string;
  employeeRole: string;
  avatarInitials: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  replies: TicketReply[];
}

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-amber-500/20 text-amber-400",
  In_Progress: "bg-blue-500/20 text-blue-400",
  Resolved: "bg-emerald-500/20 text-emerald-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "text-white/40",
  Medium: "text-amber-400",
  High: "text-red-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const loadTickets = () => {
    fetch("/api/adminpanel/tickets")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filtered = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      t.workspaceName.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/adminpanel/tickets/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadTickets();
      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status } : null));
      }
    }
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/adminpanel/tickets/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      const data = await res.json();
      if (res.ok) {
        const newReply = data.reply as TicketReply;
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                status: prev.status === "Open" ? "In_Progress" : prev.status,
                replies: [...prev.replies, newReply],
              }
            : null
        );
        setReplyText("");
        loadTickets();
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5a3ab6]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-white/10 px-8 py-6">
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="mt-1 text-sm text-white/50">All workspace support requests</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-white/10 px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets, workspaces, users..."
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#5a3ab6]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {filtered.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-white/40">
                No support tickets found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0a0c14]">
                  <tr className="border-b border-white/10 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    <th className="px-6 py-3">Workspace</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelected(ticket)}
                      className={cn(
                        "cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5",
                        selected?.id === ticket.id && "bg-[#5a3ab6]/10"
                      )}
                    >
                      <td className="px-6 py-3.5 text-white/70">{ticket.workspaceName}</td>
                      <td className="max-w-[200px] truncate px-4 py-3.5 font-medium text-white">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3.5 text-white/60">{ticket.employeeName}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            STATUS_COLORS[ticket.status] || "bg-white/10 text-white/60"
                          )}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className={cn("px-4 py-3.5 font-medium", PRIORITY_COLORS[ticket.priority])}>
                        {ticket.priority}
                      </td>
                      <td className="px-4 py-3.5 text-white/40">{formatDate(ticket.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selected && (
          <div className="flex w-[420px] shrink-0 flex-col border-l border-white/10 bg-[#0c0e18]">
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-xs text-white/40">{selected.workspaceName}</p>
                <h2 className="mt-0.5 truncate font-semibold text-white">{selected.subject}</h2>
                <p className="mt-1 text-xs text-white/50">
                  {selected.employeeName} · {selected.employeeEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-white/10 px-5 py-3">
              {(["Open", "In_Progress", "Resolved"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateStatus(selected.id, s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    selected.status === s
                      ? STATUS_COLORS[s]
                      : "bg-white/5 text-white/40 hover:bg-white/10"
                  )}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-4 overflow-auto px-5 py-4">
              <div className="rounded-lg bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                    {selected.avatarInitials}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{selected.employeeName}</p>
                    <p className="text-[10px] text-white/40">{formatDate(selected.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/70">{selected.description}</p>
              </div>

              {selected.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={cn(
                    "rounded-lg p-4",
                    reply.isAdmin ? "bg-[#5a3ab6]/20 border border-[#5a3ab6]/30" : "bg-white/5"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-white">{reply.authorName}</p>
                    <p className="text-[10px] text-white/40">{formatDate(reply.createdAt)}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-white/70">{reply.message}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#5a3ab6]"
              />
              <button
                type="button"
                onClick={sendReply}
                disabled={sending || !replyText.trim()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#5a3ab6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6b4ac7] disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
