"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLeaveStore } from "@/stores/leave-store";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { AttachmentLinks } from "@/components/AttachmentLinks";
import { uploadAttachmentFiles } from "@/lib/storage/client-upload";
import {
  HelpCircle,
  Plus,
  Search,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  Eye,
  MoreVertical,
  Calendar,
  FileText,
  User,
  Camera,
  MapPin,
  Laptop,
  Trash2,
  MessagesSquare,
  Send,
} from "lucide-react";

// Types
interface SupportTicketReply {
  id: string;
  message: string;
  attachments?: string[];
  isAdmin: boolean;
  authorName: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeRole: string;
  avatarInitials: string;
  category: string;
  subject: string;
  description: string;
  attachments?: string[];
  status: "Open" | "In_Progress" | "Resolved";
  priority: "Low" | "Medium" | "High";
  createdAt: string;
  updatedAt: string;
  replies?: SupportTicketReply[];
}

interface InteractiveGuide {
  id: string;
  title: string;
  description: string;
  icon: any;
  steps: {
    title: string;
    description: string;
  }[];
}

const INTERACTIVE_GUIDES: InteractiveGuide[] = [
  {
    id: "apply-leave",
    title: "How to Apply for Leaves",
    description: "Follow the standard procedure to request and schedule leaves.",
    icon: Calendar,
    steps: [
      {
        title: "Check Balances",
        description: "Navigate to the Leave Tracker to see your remaining Annual, Sick, and Casual leave days.",
      },
      {
        title: "Click 'Apply Leave'",
        description: "Click the primary button at the top-right to open the leave application dialog.",
      },
      {
        title: "Fill Request details",
        description: "Select the Leave Type, choose Start & End dates, toggle Half-Day if applicable, and state your reason clearly.",
      },
      {
        title: "Submit and Await Approval",
        description: "Click 'Submit'. Your reporting manager or HR will review and approve/reject your request.",
      },
    ],
  },
  {
    id: "selfie-punch",
    title: "Selfie Check-in & Location Verification",
    description: "Verify attendance daily using your camera and GPS.",
    icon: Camera,
    steps: [
      {
        title: "Open Attendance Dashboard",
        description: "Go to the Attendance tab in the sidebar navigation.",
      },
      {
        title: "Check Camera & GPS Access",
        description: "Ensure browser permissions for Camera and Location (GPS) are granted.",
      },
      {
        title: "Punch In with Selfie",
        description: "Click 'Punch In', let the system snap your selfie verification, and confirm your location.",
      },
      {
        title: "Punch Out at End of Shift",
        description: "When your workday concludes, click 'Punch Out' to record your checkout details.",
      },
    ],
  },
  {
    id: "attendance-regularization",
    title: "Regularizing Attendance Logs",
    description: "Request correction for missing punches or incorrect hours.",
    icon: MapPin,
    steps: [
      {
        title: "View Logs",
        description: "Navigate to Attendance -> Regularization.",
      },
      {
        title: "Click 'Request Regularization'",
        description: "Select the date of the incorrect log and specify the correct Check-in/out times.",
      },
      {
        title: "Add Justification",
        description: "Provide a valid reason (e.g., 'Forgot to punch in', 'Client meeting outside office').",
      },
      {
        title: "HR Approval",
        description: "Submit the request. Once approved by HR, your logs will update automatically.",
      },
    ],
  },
  {
    id: "wfh-guidelines",
    title: "Work From Home (WFH) Requests",
    description: "Submit remote work requests according to company branch policy.",
    icon: Laptop,
    steps: [
      {
        title: "Go to WFH Page",
        description: "Select 'Work From Home' under the Attendance sidebar options.",
      },
      {
        title: "Select WFH Dates",
        description: "Choose your start date and end date. Ensure it conforms to monthly hybrid allowance limits.",
      },
      {
        title: "State Reason & Submit",
        description: "Enter a brief note about your remote workspace arrangements and submit for manager approval.",
      },
    ],
  },

  {
    id: "face-enrollment",
    title: "Setting Up Face Enrollment",
    description: "Register your face photo to enable biometric selfie attendance check-in.",
    icon: User,
    steps: [
      {
        title: "Navigate to Profile Settings",
        description: "Go to Settings -> Profile Setting.",
      },
      {
        title: "Access Face Enrollment Panel",
        description: "Scroll down to find the Biometric Face Enrollment card.",
      },
      {
        title: "Register Photo",
        description: "Click 'Enroll Face', grant camera access, position your face clearly in the frame, and capture.",
      },
      {
        title: "Complete Setup",
        description: "Once verification completes, your face index is registered and enabled for selfie verification.",
      },
    ],
  },
  {
    id: "policies-holidays",
    title: "Viewing Holidays & Policies",
    description: "Check upcoming company holidays and policy files.",
    icon: FileText,
    steps: [
      {
        title: "Open Leave Policies",
        description: "Go to Leave Manager -> Leave Policies.",
      },
      {
        title: "Browse Policies",
        description: "Read parameters, balance rollovers, and conditions set for annual, sick, and casual leaves.",
      },
      {
        title: "View Roster Calendar",
        description: "Go to Leave Manager -> Holidays to review gazetted and restricted company holiday dates.",
      },
    ],
  },
];

export default function HelpPage() {
  const { currentUser } = useLeaveStore();
  const [activeTab, setActiveTab] = useState<"guides" | "tickets">("guides");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Create Ticket Form State
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState("Leave Issue");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createAttachments, setCreateAttachments] = useState<File[]>([]);

  // Preview / chat state
  const [previewTicket, setPreviewTicket] = useState<SupportTicket | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "chat">("info");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  // Delete Ticket State
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

  // Guide Walkthrough Modal State
  const [activeGuide, setActiveGuide] = useState<InteractiveGuide | null>(null);

  const isManagement =
    currentUser?.role === "Admin" ||
    currentUser?.role === "Owner" ||
    currentUser?.role === "HR Manager" ||
    currentUser?.role === "Manager";

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("ansh_auth_token") : null;
    const impersonateId = typeof window !== "undefined" ? sessionStorage.getItem("ansh_impersonate_user_id") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(impersonateId ? { "X-Impersonate-User": impersonateId } : {}),
    };
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!subject.trim() || !description.trim()) {
      setFormError("Please fill out both the subject and description.");
      return;
    }

    setSubmitting(true);
    try {
      let attachments: string[] = [];
      if (createAttachments.length > 0) {
        attachments = await uploadAttachmentFiles(createAttachments, "support");
      }

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          attachments,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) => [
          { ...data.ticket, replies: data.ticket.replies || [], attachments: data.ticket.attachments || [] },
          ...prev,
        ]);
        setCreateOpen(false);
        setSubject("");
        setDescription("");
        setCategory("Leave Issue");
        setPriority("Medium");
        setCreateAttachments([]);
      } else {
        const errData = await res.json();
        setFormError(errData.error || "Failed to submit ticket.");
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Server error. Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!previewTicket) return;
    if (!replyMessage.trim() && replyAttachments.length === 0) return;
    setReplyError("");
    setSendingReply(true);
    try {
      let attachments: string[] = [];
      if (replyAttachments.length > 0) {
        attachments = await uploadAttachmentFiles(replyAttachments, "support");
      }

      const res = await fetch("/api/support/tickets/reply", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ticketId: previewTicket.id,
          message: replyMessage.trim(),
          attachments,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReplyError(data.error || "Failed to send message.");
        return;
      }

      const nextReplies = [...(previewTicket.replies || []), data.reply];
      const updatedTicket = { ...previewTicket, replies: nextReplies };
      setPreviewTicket(updatedTicket);
      setTickets((prev) =>
        prev.map((t) => (t.id === previewTicket.id ? updatedTicket : t))
      );
      setReplyMessage("");
      setReplyAttachments([]);
    } catch (err) {
      setReplyError(
        err instanceof Error ? err.message : "Server error. Please try again."
      );
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    setDeletingTicket(true);
    try {
      const res = await fetch(`/api/support/tickets?id=${ticketToDelete.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
        setTicketToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
    } finally {
      setDeletingTicket(false);
    }
  };

  // Filter & Search Logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.employeeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === "All" || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "High":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      case "Medium":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Resolved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "In_Progress":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    }
  };

  const getStatusLabel = (s: string) => {
    if (s === "In_Progress") return "In Progress";
    return s;
  };

  // Metrics
  const totalOpen = tickets.filter((t) => t.status === "Open").length;
  const totalInProgress = tickets.filter((t) => t.status === "In_Progress").length;
  const totalResolved = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Help Center Support"
        title="Support & Guides Desk"
        description="Access tutorial logs and guides, or raise and track support tickets with our administration department."
        action={
          activeTab === "tickets"
            ? {
                label: "Create Ticket",
                icon: Plus,
                onClick: () => setCreateOpen(true),
              }
            : undefined
        }
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab("guides")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all outline-none cursor-pointer ${
            activeTab === "guides"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Interactive Guides
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all outline-none cursor-pointer ${
            activeTab === "tickets"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Support Ticket Desk
          {tickets.filter((t) => t.status !== "Resolved").length > 0 && (
            <Badge className="ml-1 bg-primary text-primary-foreground font-extrabold text-[10px] px-1.5 py-0.5 rounded-full">
              {tickets.filter((t) => t.status !== "Resolved").length}
            </Badge>
          )}
        </button>
      </div>

      {activeTab === "guides" ? (
        /* GUIDES SECTION */
        <div className="grid gap-6 md:grid-cols-2">
          {INTERACTIVE_GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card
                key={guide.id}
                onClick={() => setActiveGuide(guide)}
                className="crm-card cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-start gap-4 pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-850 dark:text-white">
                      {guide.title}
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {guide.description}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-primary hover:gap-1.5 transition-all mt-4">
                    Launch Interactive Guide →
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TICKETS SECTION */
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card className="crm-card border-l-4 border-l-amber-500 bg-amber-500/5">
              <CardContent className="p-4 flex flex-col items-start gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Open Tickets
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {loading ? "-" : totalOpen}
                </span>
              </CardContent>
            </Card>

            <Card className="crm-card border-l-4 border-l-sky-500 bg-sky-500/5">
              <CardContent className="p-4 flex flex-col items-start gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  In Progress
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {loading ? "-" : totalInProgress}
                </span>
              </CardContent>
            </Card>

            <Card className="crm-card border-l-4 border-l-emerald-500 bg-emerald-500/5">
              <CardContent className="p-4 flex flex-col items-start gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Resolved
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {loading ? "-" : totalResolved}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Filters and List */}
          <Card className="crm-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-10 items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 gap-2 cursor-pointer select-none outline-none">
                      <span>Category: {categoryFilter}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card shadow-xl border border-border p-1 space-y-0.5 select-none z-[100] w-48">
                      {["All", "Leave Issue", "Attendance Correction", "Profile Update", "IT Support", "Other"].map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setCategoryFilter(option)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer outline-none ${
                            categoryFilter === option
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-slate-650 hover:bg-slate-150/50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Priority Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-10 items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 gap-2 cursor-pointer select-none outline-none">
                      <span>Priority: {priorityFilter}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card shadow-xl border border-border p-1 space-y-0.5 select-none z-[100] w-36">
                      {["All", "Low", "Medium", "High"].map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setPriorityFilter(option)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer outline-none ${
                            priorityFilter === option
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-slate-650 hover:bg-slate-150/50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Status Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-10 items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 gap-2 cursor-pointer select-none outline-none">
                      <span>Status: {getStatusLabel(statusFilter)}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card shadow-xl border border-border p-1 space-y-0.5 select-none z-[100] w-40">
                      {["All", "Open", "In_Progress", "Resolved"].map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setStatusFilter(option)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer outline-none ${
                            statusFilter === option
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-slate-650 hover:bg-slate-150/50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {getStatusLabel(option)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-xs text-slate-400">Loading support logs...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <AlertCircle className="h-10 w-10 text-slate-350 mb-4" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No tickets found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try refining your search or filters, or create a new ticket.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {isManagement && <th className="px-6 py-4">Employee</th>}
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Priority</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Submitted Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="border-b border-border/30 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          {isManagement && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                                  {ticket.avatarInitials}
                                </span>
                                <div>
                                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                                    {ticket.employeeName}
                                  </p>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    {ticket.employeeRole}
                                  </p>
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900 dark:text-white block max-w-xs truncate">
                              {ticket.subject}
                            </span>
                            <span className="text-[10px] text-slate-400 block max-w-xs truncate">
                              {ticket.description}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{ticket.category}</td>
                          <td className="px-6 py-4">
                            <Badge className={`border-0 font-bold px-2 py-0.5 rounded-md text-[10px] ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-450 dark:text-slate-400">
                            {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white outline-none cursor-pointer">
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32 bg-card p-1 space-y-0.5 select-none z-[100]">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setPreviewTicket(ticket);
                                    setDetailTab("info");
                                    setReplyMessage("");
                                    setReplyAttachments([]);
                                    setReplyError("");
                                  }}
                                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-650 hover:bg-slate-100 cursor-pointer outline-none font-semibold"
                                >
                                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border/40 my-0.5" />
                                <DropdownMenuItem
                                  onClick={() => setTicketToDelete(ticket)}
                                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer outline-none font-bold"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                  Delete Ticket
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CREATE TICKET DIALOG */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateAttachments([]);
            setFormError("");
          }
        }}
      >
        <DialogContent className="max-w-md border border-border bg-card/95 backdrop-blur-md dark:bg-slate-900/95 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Create Support Ticket
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Submit a details report regarding support issues. Our administration team will review this shortly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 mt-2">
            {formError && (
              <div className="rounded-xl bg-rose-500/10 p-3 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-11 w-full appearance-none items-center rounded-xl border border-border bg-card dark:bg-slate-900 px-3 py-2 pr-9 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  >
                    <option value="Leave Issue">Leave Issue</option>
                    <option value="Attendance Correction">Attendance Correction</option>
                    <option value="Profile Update">Profile Update</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "Low" | "Medium" | "High")}
                    className="flex h-11 w-full appearance-none items-center rounded-xl border border-border bg-card dark:bg-slate-900 px-3 py-2 pr-9 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Subject
              </label>
              <Input
                placeholder="Brief summary of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 border-border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Description
              </label>
              <textarea
                placeholder="Describe your issue in details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="flex w-full rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2.5 text-xs outline-none focus:border-primary/45 text-slate-700 dark:text-slate-200 resize-none hover:bg-slate-50/50 dark:hover:bg-slate-800/20 break-words"
              />
            </div>

            <AttachmentPicker
              files={createAttachments}
              onChange={setCreateAttachments}
              disabled={submitting}
            />

            <DialogFooter className="pt-2 border-t border-border/40 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                className="h-10 text-xs font-bold hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 text-xs font-bold btn-primary rounded-xl shrink-0 gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Ticket"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PREVIEW TICKET DIALOG */}
      <Dialog
        open={!!previewTicket}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewTicket(null);
            setDetailTab("info");
            setReplyMessage("");
            setReplyAttachments([]);
            setReplyError("");
          }
        }}
      >
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[min(90vh,640px)] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden border border-border bg-card/95 backdrop-blur-md dark:bg-slate-900/95 p-0 rounded-2xl gap-0">
          {previewTicket && (
            <>
              <DialogHeader className="shrink-0 px-6 pt-6 pb-3 pr-12">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge className={`border-0 font-bold px-2 py-0.5 rounded-md text-[10px] ${getPriorityColor(previewTicket.priority)}`}>
                    {previewTicket.priority} Priority
                  </Badge>
                  <Badge className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(previewTicket.status)}`}>
                    {getStatusLabel(previewTicket.status)}
                  </Badge>
                </div>
                <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white leading-snug break-words [overflow-wrap:anywhere] line-clamp-2 pr-2">
                  {previewTicket.subject}
                </DialogTitle>
              </DialogHeader>

              {/* Detail tabs */}
              <div className="shrink-0 flex border-b border-border/60 px-2">
                <button
                  type="button"
                  onClick={() => setDetailTab("info")}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all outline-none cursor-pointer ${
                    detailTab === "info"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Ticket Info
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("chat")}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all outline-none cursor-pointer ${
                    detailTab === "chat"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
                  Chat
                  {(previewTicket.replies || []).length > 0 && (
                    <Badge className="ml-0.5 bg-primary/15 text-primary border-0 font-extrabold text-[9px] px-1.5 py-0 rounded-full">
                      {(previewTicket.replies || []).length}
                    </Badge>
                  )}
                </button>
              </div>

              {detailTab === "info" ? (
                <div className="min-h-0 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span className="min-w-0 truncate">
                      Category:{" "}
                      <b className="text-slate-600 dark:text-slate-300">{previewTicket.category}</b>
                    </span>
                    <span className="shrink-0">
                      Submitted: {new Date(previewTicket.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Employee Details
                    </h4>
                    <div className="rounded-xl border border-border bg-slate-50/30 dark:bg-slate-900/30 p-3 flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {previewTicket.avatarInitials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {previewTicket.employeeName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {previewTicket.employeeRole} • {previewTicket.employeeEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Issue Description
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-border/60 p-4 max-h-40 overflow-y-auto">
                      {previewTicket.description}
                    </p>
                  </div>

                  <AttachmentLinks attachments={previewTicket.attachments} label="Ticket attachments" />

                  <p className="text-[10px] text-slate-400">
                    Status and priority are managed by ANSH Support only.
                  </p>
                </div>
              ) : (
                <div className="min-h-0 flex flex-col overflow-hidden px-6 py-4 gap-3">
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-2 rounded-xl border border-border/60 bg-slate-50/30 dark:bg-slate-900/20 p-3">
                    {(previewTicket.replies || []).length === 0 ? (
                      <div className="flex h-full min-h-[10rem] flex-col items-center justify-center text-center px-4">
                        <MessagesSquare className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-[11px] text-slate-400">
                          No messages yet. ANSH Support will reply here.
                        </p>
                      </div>
                    ) : (
                      (previewTicket.replies || []).map((reply) => (
                        <div
                          key={reply.id}
                          className={`min-w-0 max-w-full rounded-xl border p-3 text-xs leading-relaxed ${
                            reply.isAdmin
                              ? "border-primary/30 bg-primary/5 text-slate-700 dark:text-slate-300"
                              : "ml-2 sm:ml-4 border-border/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="mb-1 flex items-start justify-between gap-2 min-w-0">
                            <span className="font-bold text-[10px] truncate min-w-0">
                              {reply.isAdmin ? "ANSH Support" : reply.authorName}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                              {new Date(reply.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">
                            {reply.message}
                          </p>
                          {!!reply.attachments?.length && (
                            <div className="mt-2 min-w-0">
                              <AttachmentLinks attachments={reply.attachments} label="Attachments" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {previewTicket.employeeId === currentUser?.id &&
                  (previewTicket.status === "Open" ||
                    previewTicket.status === "In_Progress") ? (
                    <div className="shrink-0 space-y-2 border-t border-border/40 pt-3">
                      {replyError && (
                        <div className="rounded-xl bg-rose-500/10 p-2.5 border border-rose-500/20 text-rose-500 text-[11px] font-semibold break-words">
                          {replyError}
                        </div>
                      )}
                      <AttachmentPicker
                        files={replyAttachments}
                        onChange={setReplyAttachments}
                        disabled={sendingReply}
                        maxFiles={3}
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <Input
                          placeholder="Type your message to support..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void handleSendReply();
                            }
                          }}
                          className="h-10 min-w-0 flex-1 border-border rounded-xl text-xs"
                          disabled={sendingReply}
                        />
                        <Button
                          type="button"
                          onClick={() => void handleSendReply()}
                          disabled={
                            sendingReply ||
                            (!replyMessage.trim() && replyAttachments.length === 0)
                          }
                          className="h-10 w-10 shrink-0 p-0 btn-primary rounded-xl"
                          aria-label="Send message"
                        >
                          {sendingReply ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : previewTicket.status === "Resolved" ? (
                    <p className="shrink-0 text-[11px] text-slate-400 text-center py-1">
                      This ticket is resolved. Chat is closed.
                    </p>
                  ) : (
                    <p className="shrink-0 text-[11px] text-slate-400 text-center py-1">
                      Only the ticket creator can send messages.
                    </p>
                  )}
                </div>
              )}

              <DialogFooter className="shrink-0 px-6 py-3 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPreviewTicket(null);
                    setDetailTab("info");
                    setReplyMessage("");
                    setReplyAttachments([]);
                    setReplyError("");
                  }}
                  className="h-10 text-xs font-bold hover:bg-slate-100 w-full rounded-xl"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* WALKTHROUGH GUIDE MODAL */}
      <Dialog open={!!activeGuide} onOpenChange={() => setActiveGuide(null)}>
        <DialogContent className="max-w-md border border-border bg-card/95 backdrop-blur-md dark:bg-slate-900/95 p-6 rounded-2xl">
          {activeGuide && (
            <>
              <DialogHeader className="border-b border-border/40 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                  <activeGuide.icon className="h-5 w-5" />
                </div>
                <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                  {activeGuide.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-1">
                  Walkthrough checklist to successfully execute this action.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3.5 space-y-6">
                  {activeGuide.steps.map((step, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-3.5 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary font-bold text-white text-[11px] ring-4 ring-white dark:ring-slate-950">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {step.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => setActiveGuide(null)}
                  className="h-10 text-xs font-bold hover:bg-slate-100 w-full rounded-xl"
                >
                  Got it, Thanks!
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!ticketToDelete} onOpenChange={() => setTicketToDelete(null)}>
        <DialogContent className="max-w-sm border border-border bg-card/95 backdrop-blur-md dark:bg-slate-900/95 p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 mb-2">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Delete Support Ticket?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {ticketToDelete && (
              <div className="text-xs text-slate-550 dark:text-slate-355 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-border/60">
                <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">
                  {ticketToDelete.subject}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Category: {ticketToDelete.category}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTicketToDelete(null)}
              className="h-10 text-xs font-bold hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteTicket}
              disabled={deletingTicket}
              className="h-10 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shrink-0 gap-2"
            >
              {deletingTicket ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
