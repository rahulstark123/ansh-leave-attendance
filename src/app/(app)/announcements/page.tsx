"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/crm/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLeaveStore } from "@/stores/leave-store";
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Loader2,
  CalendarDays,
  Bell,
} from "lucide-react";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { AttachmentLinks } from "@/components/AttachmentLinks";
import { uploadAttachmentFiles } from "@/lib/storage/client-upload";

export default function AnnouncementsPage() {
  const { currentUser } = useLeaveStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createAttachments, setCreateAttachments] = useState<File[]>([]);
  const [editAttachments, setEditAttachments] = useState<File[]>([]);
  const [existingEditAttachments, setExistingEditAttachments] = useState<string[]>([]);

  const isManagement =
    currentUser?.role === "Admin" ||
    currentUser?.role === "Owner" ||
    currentUser?.role === "HR Manager";

  const fetchAnnouncements = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const url = "/api/announcements";
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      let attachments: string[] = [];
      if (createAttachments.length > 0) {
        attachments = await uploadAttachmentFiles(createAttachments, "announcements");
      }

      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, body, pinned, attachments }),
      });
      if (res.ok) {
        setTitle("");
        setBody("");
        setPinned(false);
        setCreateAttachments([]);
        setIsCreateOpen(false);
        fetchAnnouncements();
      }
    } catch (err) {
      console.error("Failed to create announcement:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncement || !title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      let newUrls: string[] = [];
      if (editAttachments.length > 0) {
        newUrls = await uploadAttachmentFiles(editAttachments, "announcements");
      }
      const attachments = [...existingEditAttachments, ...newUrls].slice(0, 3);

      const res = await fetch("/api/announcements", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedAnnouncement.id,
          title,
          body,
          pinned,
          attachments,
        }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        setSelectedAnnouncement(null);
        setEditAttachments([]);
        setExistingEditAttachments([]);
        fetchAnnouncements();
      }
    } catch (err) {
      console.error("Failed to edit announcement:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePin = async (ann: any) => {
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      await fetch("/api/announcements", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: ann.id, pinned: !ann.pinned }),
      });
      fetchAnnouncements();
    } catch (err) {
      console.error("Failed to toggle pin status:", err);
    }
  };



  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch(`/api/announcements?id=${selectedAnnouncement.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setIsDeleteOpen(false);
        setSelectedAnnouncement(null);
        fetchAnnouncements();
      }
    } catch (err) {
      console.error("Failed to delete announcement:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (ann: any) => {
    setSelectedAnnouncement(ann);
    setTitle(ann.title);
    setBody(ann.body);
    setPinned(ann.pinned);
    setExistingEditAttachments(Array.isArray(ann.attachments) ? ann.attachments : []);
    setEditAttachments([]);
    setIsEditOpen(true);
  };

  const openDeleteModal = (ann: any) => {
    setSelectedAnnouncement(ann);
    setIsDeleteOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Loading announcements bulletin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Communication Desk"
        title="Notice Board & Announcements"
        description="View corporate announcements, HR policy broadcasts, holiday calendars, and organization updates."
        toolbar={
          isManagement ? (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setTitle("");
                  setBody("");
                  setPinned(false);
                  setCreateAttachments([]);
                  setIsCreateOpen(true);
                }}
                className="btn-primary h-10 text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Post Announcement
              </Button>
            </div>
          ) : undefined
        }
      />

      {announcements.length === 0 ? (
        <Card className="crm-card py-16 text-center text-slate-400 text-xs">
          <Megaphone className="h-12 w-12 text-slate-350 mx-auto mb-4" />
          <p className="font-bold text-slate-700 dark:text-slate-300">No active announcements</p>
          <p className="text-slate-450 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Important organization updates and team notices posted by HR or Admins will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              className={`crm-card relative flex flex-col justify-between overflow-hidden border hover:shadow-lg transition-all duration-300 ${
                ann.pinned
                  ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5 shadow-md shadow-emerald-500/5"
                  : "border-border"
              }`}
            >
              {ann.pinned && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <Pin className="h-3 w-3 fill-current" />
                  Pinned
                </div>
              )}


              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white pr-16 line-clamp-1">
                        {ann.title}
                      </CardTitle>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        Posted by {ann.authorName}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 dark:text-slate-305 leading-relaxed whitespace-pre-wrap">
                    {ann.body}
                  </p>
                  <AttachmentLinks attachments={ann.attachments} label="Files" />
                </CardContent>
              </div>

              <div className="px-6 pb-5 pt-3.5 border-t border-border/30 flex items-center justify-between mt-auto">
                <span className="text-[9.5px] text-slate-400 font-bold flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(ann.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                {isManagement && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={ann.pinned ? "Unpin Announcement" : "Pin Announcement"}
                      onClick={() => togglePin(ann)}
                      className={`h-8 w-8 rounded-lg cursor-pointer ${
                        ann.pinned ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit Announcement"
                      onClick={() => openEditModal(ann)}
                      className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Permanently"
                      onClick={() => openDeleteModal(ann)}
                      className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md border border-border bg-card/95 backdrop-blur-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-primary" />
              Post New Announcement
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Broadcast a corporate bulletin to the entire workspace. Pinned notices stay at the top.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Announcement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Q3 Town Hall Strategic Update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Announcement Body
              </label>
              <textarea
                required
                rows={5}
                placeholder="Type your message description clearly here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 resize-none"
              />
            </div>

            <AttachmentPicker
              files={createAttachments}
              onChange={setCreateAttachments}
              disabled={submitting}
            />

            <div className="flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="pin-create"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary accent-primary h-4 w-4 cursor-pointer"
              />
              <label htmlFor="pin-create" className="text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer flex items-center gap-1">
                <Pin className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
                Pin to the top of Notice Board
              </label>
            </div>

            <DialogFooter className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-bold uppercase tracking-wider h-10 border border-border cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs font-bold uppercase tracking-wider h-10 px-6 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Posting...
                  </>
                ) : (
                  "Post Notice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT ANNOUNCEMENT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md border border-border bg-card/95 backdrop-blur-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="h-4.5 w-4.5 text-primary" />
              Edit Announcement
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Modify the existing announcement content.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Announcement Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Announcement Body
              </label>
              <textarea
                required
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 resize-none"
              />
            </div>

            {existingEditAttachments.length > 0 && (
              <AttachmentLinks attachments={existingEditAttachments} label="Current attachments" />
            )}

            {existingEditAttachments.length < 3 && (
              <AttachmentPicker
                files={editAttachments}
                onChange={setEditAttachments}
                disabled={submitting}
                maxFiles={3 - existingEditAttachments.length}
              />
            )}

            <div className="flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="pin-edit"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary accent-primary h-4 w-4 cursor-pointer"
              />
              <label htmlFor="pin-edit" className="text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer flex items-center gap-1">
                <Pin className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
                Pin to the top of Notice Board
              </label>
            </div>

            <DialogFooter className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="text-xs font-bold uppercase tracking-wider h-10 border border-border cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs font-bold uppercase tracking-wider h-10 px-6 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm border border-border bg-card/95 backdrop-blur-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Delete Announcement?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-800 dark:text-slate-200">"{selectedAnnouncement?.title}"</strong>? This action is irreversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="text-xs font-bold uppercase tracking-wider h-10 border border-border flex-1 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={handleDelete}
              className="bg-rose-500 hover:bg-rose-650 text-white text-xs font-bold uppercase tracking-wider h-10 flex-1 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
              ) : (
                "Delete Notice"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
