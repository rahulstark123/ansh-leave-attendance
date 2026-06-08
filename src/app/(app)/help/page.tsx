"use client";

import { useEffect, useState, useRef } from "react";
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
import {
  HelpCircle,
  Plus,
  Search,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  Eye,
  Filter,
  MoreVertical,
  Calendar,
  FileText,
  User,
  ShieldAlert,
  Camera,
  MapPin,
  Laptop,
  Trash2,
  MessagesSquare,
} from "lucide-react";

// Types
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
  status: "Open" | "In_Progress" | "Resolved";
  priority: "Low" | "Medium" | "High";
  createdAt: string;
  updatedAt: string;
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
    id: "workspace-chat",
    title: "Workspace Channels & Direct Messaging",
    description: "Connect and chat with team members in channels or private conversations.",
    icon: MessagesSquare,
    steps: [
      {
        title: "Open Team Space",
        description: "Select 'Team Space' in the main sidebar.",
      },
      {
        title: "Choose Channel or Chat",
        description: "Select a channel (like #general) or select an employee from the Direct Messages list.",
      },
      {
        title: "Send Messages",
        description: "Type your message in the bottom input field and press Enter or click Send.",
      },
      {
        title: "Create Topic Channels",
        description: "For group discussions, click the '+' sign next to Channels to create a public/private channel.",
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

  // Preview / Edit Status State (Admin panel)
  const [previewTicket, setPreviewTicket] = useState<SupportTicket | null>(null);
  const [adminStatus, setAdminStatus] = useState<"Open" | "In_Progress" | "Resolved">("Open");
  const [adminPriority, setAdminPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [updatingTicket, setUpdatingTicket] = useState(false);

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
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ category, subject, description, priority }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) => [data.ticket, ...prev]);
        setCreateOpen(false);
        setSubject("");
        setDescription("");
        setCategory("Leave Issue");
        setPriority("Medium");
      } else {
        const errData = await res.json();
        setFormError(errData.error || "Failed to submit ticket.");
      }
    } catch (err) {
      setFormError("Server error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTicketStatus = async () => {
    if (!previewTicket) return;
    setUpdatingTicket(true);
    try {
      const res = await fetch("/api/support/tickets/status", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: previewTicket.id,
          status: adminStatus,
          priority: adminPriority,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local ticket list
        setTickets((prev) =>
          prev.map((t) => (t.id === previewTicket.id ? data.ticket : t))
        );
        setPreviewTicket(data.ticket);
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    } finally {
      setUpdatingTicket(false);
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
                                    setAdminStatus(ticket.status);
                                    setAdminPriority(ticket.priority);
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                >
                  <option value="Leave Issue">Leave Issue</option>
                  <option value="Attendance Correction">Attendance Correction</option>
                  <option value="Profile Update">Profile Update</option>
                  <option value="IT Support">IT Support</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
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
                className="flex w-full rounded-xl border border-border bg-card dark:bg-slate-900 px-3.5 py-2.5 text-xs outline-none focus:border-primary/45 cursor-pointer text-slate-700 dark:text-slate-200 resize-none hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
              />
            </div>

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

      {/* PREVIEW TICKET DIALOG (WITH ADMIN STATUS UPDATE CONTROLS) */}
      <Dialog open={!!previewTicket} onOpenChange={() => setPreviewTicket(null)}>
        <DialogContent className="max-w-md border border-border bg-card/95 backdrop-blur-md dark:bg-slate-900/95 p-6 rounded-2xl">
          {previewTicket && (
            <>
              <DialogHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge className={`border-0 font-bold px-2 py-0.5 rounded-md text-[10px] ${getPriorityColor(previewTicket.priority)}`}>
                    {previewTicket.priority} Priority
                  </Badge>
                  <Badge className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(previewTicket.status)}`}>
                    {getStatusLabel(previewTicket.status)}
                  </Badge>
                </div>
                <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  {previewTicket.subject}
                </DialogTitle>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span>Category: <b>{previewTicket.category}</b></span>
                  <span>
                    Submitted: {new Date(previewTicket.createdAt).toLocaleString()}
                  </span>
                </div>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Employee Details
                  </h4>
                  <div className="rounded-xl border border-border bg-slate-50/30 dark:bg-slate-900/30 p-3 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {previewTicket.avatarInitials}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {previewTicket.employeeName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {previewTicket.employeeRole} • {previewTicket.employeeEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    Issue Description
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-border/60 p-4">
                    {previewTicket.description}
                  </p>
                </div>

                {/* Management Update Desk */}
                {isManagement && (
                  <div className="border-t border-border/40 pt-4 space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Administration Control Panel
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                          Update Status
                        </label>
                        <select
                          value={adminStatus}
                          onChange={(e) => setAdminStatus(e.target.value as any)}
                          className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="Open">Open</option>
                          <option value="In_Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                          Update Priority
                        </label>
                        <select
                          value={adminPriority}
                          onChange={(e) => setAdminPriority(e.target.value as any)}
                          className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      onClick={handleUpdateTicketStatus}
                      disabled={updatingTicket}
                      className="h-10 text-xs font-bold btn-primary w-full rounded-xl gap-2 mt-2"
                    >
                      {updatingTicket ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating Ticket...
                        </>
                      ) : (
                        "Update Ticket Config"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => setPreviewTicket(null)}
                  className="h-10 text-xs font-bold hover:bg-slate-100 w-full rounded-xl"
                >
                  Close Detail logs
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
