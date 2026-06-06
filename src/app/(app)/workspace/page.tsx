"use client";

import { useState, useEffect, useRef } from "react";
import { useLeaveStore } from "@/stores/leave-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { supabase } from "@/lib/supabase/client";
import {
  Hash,
  Plus,
  Send,
  Bold,
  Italic,
  Paperclip,
  Smile,
  AtSign,
  Info,
  X,
  Lock,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";

type DmPartner = {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarInitials: string;
  status: string;
};

export default function WorkspacePage() {
  const { currentUser, employees, initialize: initLeaveStore } = useLeaveStore();
  const {
    channels,
    messages,
    loading,
    messagesLoading,
    error,
    fetchChannels,
    createChannel,
    fetchMessages,
    sendMessage,
    addRealtimeMessage,
  } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<{ type: "channel" | "dm"; id: string } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [dmPartners, setDmPartners] = useState<DmPartner[]>([]);

  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [isChannelPublic, setIsChannelPublic] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [channelFormError, setChannelFormError] = useState<string | null>(null);

  const [isStartDmOpen, setIsStartDmOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel =
    activeTab?.type === "channel" ? channels.find((c) => c.id === activeTab.id) : null;

  const activeDmEmployee =
    activeTab?.type === "dm"
      ? employees.find((e) => e.id === activeTab.id) ||
        dmPartners.find((e) => e.id === activeTab.id)
      : null;

  useEffect(() => {
    initLeaveStore();
    fetchChannels();
    fetchDmPartners();
  }, [initLeaveStore, fetchChannels]);

  useEffect(() => {
    if (channels.length > 0 && !activeTab) {
      setActiveTab({ type: "channel", id: channels[0].id });
    }
  }, [channels, activeTab]);

  useEffect(() => {
    if (!activeTab) return;
    if (activeTab.type === "channel") {
      fetchMessages({ channelId: activeTab.id });
    } else {
      fetchMessages({ receiverId: activeTab.id });
    }
  }, [activeTab, fetchMessages]);

  const fetchDmPartners = async () => {
    try {
      const token = sessionStorage.getItem("ansh_auth_token");
      const res = await fetch("/api/workspace/messages?listDmPartners=true", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setDmPartners(data.partners || []);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("workspace-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "WorkspaceMessage",
        },
        (payload) => {
          const newMsg = payload.new as {
            id: string;
            content: string;
            senderId: string;
            channelId: string | null;
            receiverId: string | null;
            sentAt: string;
          };

          // Only add to state if this message belongs to the current chat view
          let isRelevant = false;
          if (activeTab?.type === "channel" && newMsg.channelId === activeTab.id) {
            isRelevant = true;
          } else if (activeTab?.type === "dm") {
            const isDmBetweenUs =
              (newMsg.senderId === currentUser.id && newMsg.receiverId === activeTab.id) ||
              (newMsg.senderId === activeTab.id && newMsg.receiverId === currentUser.id);
            if (isDmBetweenUs) {
              isRelevant = true;
            }
          }

          if (isRelevant) {
            // Find the sender details in the loaded employees list
            const sender = employees.find((e) => e.id === newMsg.senderId);
            
            addRealtimeMessage({
              id: newMsg.id,
              content: newMsg.content,
              senderId: newMsg.senderId,
              senderName: sender ? sender.name : (newMsg.senderId === currentUser.id ? currentUser.name : "Co-worker"),
              avatarInitials: sender ? sender.avatarInitials : (newMsg.senderId === currentUser.id ? currentUser.avatarInitials : "CW"),
              channelId: newMsg.channelId || undefined,
              receiverId: newMsg.receiverId || undefined,
              sentAt: newMsg.sentAt,
            });
          }
          
          // If a new DM message arrived for us, trigger listing partner refresh
          if (newMsg.receiverId === currentUser.id && activeTab?.id !== newMsg.senderId) {
            fetchDmPartners();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, currentUser, employees, addRealtimeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !currentUser || !activeTab) return;

    let content = inputValue;
    if (isBold) content = `**${content}**`;
    if (isItalic) content = `*${content}*`;

    const ok = await sendMessage(
      content,
      currentUser.id,
      currentUser.name,
      currentUser.avatarInitials,
      activeTab.type === "channel" ? activeTab.id : undefined,
      activeTab.type === "dm" ? activeTab.id : undefined
    );

    if (ok) {
      setInputValue("");
      setIsBold(false);
      setIsItalic(false);
      if (activeTab.type === "dm") fetchDmPartners();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChannelForm = () => {
    setNewChannelName("");
    setNewChannelDesc("");
    setIsChannelPublic(true);
    setSelectedMemberIds([]);
    setChannelFormError(null);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    if (!isChannelPublic && selectedMemberIds.length === 0) {
      setChannelFormError("Select at least one member for a private channel.");
      return;
    }

    setCreatingChannel(true);
    setChannelFormError(null);

    const channel = await createChannel(
      newChannelName,
      newChannelDesc,
      isChannelPublic,
      selectedMemberIds
    );

    setCreatingChannel(false);

    if (channel) {
      setActiveTab({ type: "channel", id: channel.id });
      resetChannelForm();
      setIsCreateChannelOpen(false);
    } else {
      setChannelFormError(useWorkspaceStore.getState().error || "Could not create channel.");
    }
  };

  const toggleMember = (employeeId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleStartDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    const emp = colleagues.find((c) => c.id === selectedEmployeeId);
    if (emp && !dmPartners.some((p) => p.id === emp.id)) {
      setDmPartners((prev) => [
        ...prev,
        {
          id: emp.id,
          name: emp.name,
          role: emp.role,
          department: emp.department,
          avatarInitials: emp.avatarInitials,
          status: emp.status,
        },
      ]);
    }

    setActiveTab({ type: "dm", id: selectedEmployeeId });
    setIsStartDmOpen(false);
    setSelectedEmployeeId("");
  };

  const colleagues = employees.filter((e) => e.id !== currentUser?.id);

  return (
    <div className="h-full w-full overflow-hidden bg-background text-foreground flex animate-in fade-in duration-500">
      <div className="w-[260px] bg-slate-50/80 dark:bg-card/40 border-r border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-white uppercase">
              ANSH Workspace
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {currentUser?.name}
            </div>
          </div>
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {currentUser?.avatarInitials}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Channels</span>
              <button
                onClick={() => {
                  resetChannelForm();
                  setIsCreateChannelOpen(true);
                }}
                className="hover:text-slate-900 dark:hover:text-white text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                title="Create Channel"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading channels...
              </div>
            ) : (
              <nav className="space-y-0.5">
                {channels.map((chan) => {
                  const isActive = activeTab?.type === "channel" && activeTab.id === chan.id;
                  return (
                    <button
                      key={chan.id}
                      onClick={() => setActiveTab({ type: "channel", id: chan.id })}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      {chan.isPublic ? (
                        <Hash className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-slate-500"}`} />
                      ) : (
                        <Lock className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-slate-500"}`} />
                      )}
                      <span className="truncate">{chan.name}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Direct Messages</span>
              <button
                onClick={() => setIsStartDmOpen(true)}
                className="hover:text-slate-900 dark:hover:text-white text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                title="Start DM"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-0.5">
              {dmPartners.map((emp) => {
                const isActive = activeTab?.type === "dm" && activeTab.id === emp.id;
                return (
                  <button
                    key={emp.id}
                    onClick={() => setActiveTab({ type: "dm", id: emp.id })}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                        {emp.avatarInitials}
                      </div>
                    </div>
                    <span className="truncate flex-1">{emp.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-background flex flex-col min-w-0">
        {!activeTab ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            {loading ? "Loading workspace..." : "Select or create a channel to start chatting."}
          </div>
        ) : (
          <>
            <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-xs">
              <div className="min-w-0">
                {activeTab.type === "channel" ? (
                  <div className="flex items-center gap-2">
                    {activeChannel?.isPublic ? (
                      <Hash className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <h4 className="font-extrabold text-sm text-foreground truncate">
                      {activeChannel?.name}
                    </h4>
                    {!activeChannel?.isPublic && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Private
                      </span>
                    )}
                    {activeChannel?.description && (
                      <span className="hidden sm:inline text-xs text-muted-foreground truncate border-l border-border pl-2">
                        {activeChannel.description}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="h-6.5 w-6.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                      {activeDmEmployee?.avatarInitials}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground truncate leading-none">
                        {activeDmEmployee?.name}
                      </h4>
                      <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                        {activeDmEmployee?.role} · {activeDmEmployee?.department}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                <Info className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-wallpaper">
              {messagesLoading ? (
                <div className="h-full flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                    {activeTab.type === "channel" ? (
                      <Hash className="h-8 w-8" />
                    ) : (
                      <MessageSquare className="h-8 w-8" />
                    )}
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Welcome to{" "}
                      {activeTab.type === "channel"
                        ? `#${activeChannel?.name}`
                        : activeDmEmployee?.name}
                      !
                    </h2>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {activeTab.type === "channel"
                        ? `This is the start of #${activeChannel?.name}. ${activeChannel?.description || "Collaborate with your team."}`
                        : `Start your direct message thread with ${activeDmEmployee?.name}.`}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const formattedTime = new Date(msg.sentAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });

                  return (
                    <div
                      key={msg.id}
                      className="flex gap-4 items-start group hover:bg-slate-100/40 dark:hover:bg-slate-800/20 -mx-6 px-6 py-2.5 transition-all rounded-xl"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 shadow-xs border border-border">
                        {msg.avatarInitials}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {formattedTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                          {msg.content.startsWith("**") && msg.content.endsWith("**") ? (
                            <strong>{msg.content.slice(2, -2)}</strong>
                          ) : msg.content.startsWith("*") && msg.content.endsWith("*") ? (
                            <em>{msg.content.slice(1, -1)}</em>
                          ) : (
                            msg.content
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 pt-0 bg-background">
              {error && (
                <p className="text-xs text-rose-500 mb-2 px-1">{error}</p>
              )}
              <form
                onSubmit={handleSend}
                className="rounded-2xl border border-border bg-card overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
              >
                <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
                  <button
                    type="button"
                    onClick={() => setIsBold(!isBold)}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      isBold ? "text-primary bg-primary/10" : "text-slate-400"
                    }`}
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsItalic(!isItalic)}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      isItalic ? "text-primary bg-primary/10" : "text-slate-400"
                    }`}
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <button type="button" className="p-1.5 rounded-lg text-slate-400 cursor-pointer">
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="p-1.5 rounded-lg text-slate-400 cursor-pointer">
                    <Smile className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="p-1.5 rounded-lg text-slate-400 cursor-pointer">
                    <AtSign className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 p-3">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      activeTab.type === "channel"
                        ? `Message #${activeChannel?.name || "channel"}`
                        : `Message ${activeDmEmployee?.name || "colleague"}`
                    }
                    rows={1}
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder-muted-foreground resize-none py-1 h-8 max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      inputValue.trim()
                        ? "bg-primary text-primary-foreground hover:scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {isCreateChannelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-md w-full bg-card border border-border text-card-foreground shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                <Hash className="h-4.5 w-4.5 text-primary" />
                Create a Channel
              </h3>
              <button
                onClick={() => setIsCreateChannelOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateChannel} className="overflow-y-auto">
              <CardContent className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. sales-leads"
                    className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Description <span className="text-[9px] text-muted-foreground/60">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    placeholder="What is this channel about?"
                    className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Visibility
                  </label>
                  <div className="flex rounded-2xl border border-border p-1 bg-slate-50 dark:bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChannelPublic(true);
                        setSelectedMemberIds([]);
                        setChannelFormError(null);
                      }}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isChannelPublic
                          ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChannelPublic(false)}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        !isChannelPublic
                          ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Private
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    {isChannelPublic
                      ? "Anyone in your workspace can see and join this channel."
                      : "Only you and selected members can access this channel."}
                  </p>
                </div>

                {!isChannelPublic && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Add Members <span className="text-rose-500">*</span>
                    </label>
                    <div className="max-h-40 overflow-y-auto rounded-2xl border border-border divide-y divide-border">
                      {colleagues.length === 0 ? (
                        <p className="p-4 text-xs text-muted-foreground">No colleagues available.</p>
                      ) : (
                        colleagues.map((emp) => {
                          const checked = selectedMemberIds.includes(emp.id);
                          return (
                            <label
                              key={emp.id}
                              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleMember(emp.id)}
                                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                              />
                              <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {emp.avatarInitials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block text-xs font-bold text-foreground truncate">
                                  {emp.name}
                                </span>
                                <span className="block text-[10px] text-muted-foreground truncate">
                                  {emp.role} · {emp.department}
                                </span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {selectedMemberIds.length > 0 && (
                      <p className="text-[10px] text-primary font-bold mt-2">
                        {selectedMemberIds.length} member{selectedMemberIds.length > 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                )}

                {channelFormError && (
                  <p className="text-xs text-rose-500 font-semibold">{channelFormError}</p>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateChannelOpen(false)}
                    className="text-xs font-bold uppercase tracking-wider h-10 border border-border cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creatingChannel}
                    className="btn-primary text-xs font-bold uppercase tracking-wider h-10 px-6 cursor-pointer"
                  >
                    {creatingChannel ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Creating...
                      </>
                    ) : (
                      "Create Channel"
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {isStartDmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-md w-full bg-card border border-border text-card-foreground shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
                Direct Message Colleague
              </h3>
              <button
                onClick={() => setIsStartDmOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleStartDm}>
              <CardContent className="p-6 space-y-5">
                <CustomSelect
                  label="Select Coworker *"
                  value={selectedEmployeeId}
                  onChange={setSelectedEmployeeId}
                  placeholder="Choose a coworker..."
                  required
                  options={colleagues.map((emp) => ({
                    value: emp.id,
                    label: emp.name,
                    description: `${emp.role} · ${emp.department}`,
                  }))}
                />
                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsStartDmOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedEmployeeId} className="btn-primary">
                    Start Chat
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
