"use client";

import { useState, useEffect, useRef } from "react";
import { useLeaveStore } from "@/stores/leave-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
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
  Users,
  Search,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WorkspacePage() {
  const { currentUser, employees } = useLeaveStore();
  const { channels, messages, addChannel, sendMessage } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<{ type: "channel" | "dm"; id: string }>({
    type: "channel",
    id: "chan-general",
  });

  const [inputValue, setInputValue] = useState("");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  
  // Modals state
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  
  const [isStartDmOpen, setIsStartDmOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active chat context calculations
  const activeChannel = activeTab.type === "channel"
    ? channels.find((c) => c.id === activeTab.id)
    : null;
    
  const activeDmEmployee = activeTab.type === "dm"
    ? employees.find((e) => e.id === activeTab.id)
    : null;

  // Filter messages for current chat
  const filteredMessages = messages.filter((m) => {
    if (activeTab.type === "channel") {
      return m.channelId === activeTab.id;
    } else {
      // DM: Match messages between currentUser and the selected colleague
      return (
        (m.senderId === currentUser?.id && m.receiverId === activeTab.id) ||
        (m.senderId === activeTab.id && m.receiverId === currentUser?.id)
      );
    }
  });

  // Track active DM user IDs to render in the sidebar
  const activeDmUserIds = Array.from(
    new Set(
      messages
        .filter((m) => m.receiverId && (m.senderId === currentUser?.id || m.receiverId === currentUser?.id))
        .map((m) => (m.senderId === currentUser?.id ? m.receiverId : m.senderId) as string)
    )
  );

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !currentUser) return;

    let content = inputValue;
    if (isBold) content = `**${content}**`;
    if (isItalic) content = `*${content}*`;

    sendMessage(
      content,
      currentUser.id,
      currentUser.name,
      currentUser.avatarInitials,
      activeTab.type === "channel" ? activeTab.id : undefined,
      activeTab.type === "dm" ? activeTab.id : undefined
    );

    setInputValue("");
    setIsBold(false);
    setIsItalic(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const channelId = addChannel(newChannelName, newChannelDesc);
    setActiveTab({ type: "channel", id: channelId });
    setNewChannelName("");
    setNewChannelDesc("");
    setIsCreateChannelOpen(false);
  };

  const handleStartDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    setActiveTab({ type: "dm", id: selectedEmployeeId });
    setIsStartDmOpen(false);
    setSelectedEmployeeId("");
  };

  // Colleagues excluding current logged-in user
  const colleagues = employees.filter((e) => e.id !== currentUser?.id);

  return (
    <div className="h-full w-full overflow-hidden bg-background text-foreground flex animate-in fade-in duration-500">
      {/* 1. LEFT SIDEBAR: Channels and Direct Messages */}
      <div className="w-[260px] bg-slate-50/80 dark:bg-card/40 border-r border-border flex flex-col shrink-0">
        {/* Workspace Header */}
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-white uppercase">ANSH Workspace</h3>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {currentUser?.name}
            </div>
          </div>
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {currentUser?.avatarInitials}
          </div>
        </div>

        {/* Categories Section */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* Channels Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Channels</span>
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                className="hover:text-slate-900 dark:hover:text-white text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                title="Create Channel"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-0.5">
              {channels.map((chan) => {
                const isActive = activeTab.type === "channel" && activeTab.id === chan.id;
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
                    <Hash className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-slate-500"}`} />
                    <span className="truncate">{chan.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* DMs Header */}
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
              {/* Force show seeded / active chat DMs */}
              {colleagues
                .filter((emp) => activeDmUserIds.includes(emp.id) || emp.role === "HR Manager")
                .map((emp) => {
                  const isActive = activeTab.type === "dm" && activeTab.id === emp.id;
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
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
                          emp.status === "Active" ? "bg-emerald-500" : emp.status === "On Leave" ? "bg-rose-500" : "bg-amber-500"
                        }`} />
                      </div>
                      <span className="truncate flex-1">{emp.name}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
        </div>
      </div>


      {/* 2. CHAT CONTAINER: Messages list and input box */}
      <div className="flex-1 bg-background flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-xs">
          <div className="min-w-0">
            {activeTab.type === "channel" ? (
              <div className="flex items-center gap-2">
                <Hash className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                <h4 className="font-extrabold text-sm text-foreground truncate">
                  {activeChannel?.name}
                </h4>
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

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-wallpaper">
          {filteredMessages.length === 0 ? (
            /* Starter greeting when channel/chat is clean */
            <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                {activeTab.type === "channel" ? <Hash className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
              </div>
              <div className="max-w-md">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Welcome to {activeTab.type === "channel" ? `#${activeChannel?.name}` : activeDmEmployee?.name}!
                </h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {activeTab.type === "channel"
                    ? `This is the start of the #${activeChannel?.name} channel. ${activeChannel?.description || "Collaborate and connect with your colleagues."}`
                    : `This is the very beginning of your direct message history with ${activeDmEmployee?.name}.`}
                </p>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isCurrentUser = msg.senderId === currentUser?.id;
              const msgDate = new Date(msg.sentAt);
              const formattedTime = msgDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <div key={msg.id} className="flex gap-4 items-start group hover:bg-slate-100/40 dark:hover:bg-slate-800/20 -mx-6 px-6 py-2.5 transition-all rounded-xl">
                  {/* Sender Avatar */}
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 shadow-xs border border-border">
                    {msg.avatarInitials}
                  </div>
                  {/* Sender details + content */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate hover:underline cursor-pointer">
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {formattedTime}
                      </span>
                    </div>
                    {/* Render message body content supporting basic bold/italic formatting mock */}
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

        {/* Input area */}
        <div className="p-6 pt-0 bg-background">
          <form onSubmit={handleSend} className="rounded-2xl border border-border bg-card overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsBold(!isBold)}
                className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${
                  isBold ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400"
                }`}
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsItalic(!isItalic)}
                className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${
                  isItalic ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-slate-400"
                }`}
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <div className="h-4 w-px bg-border mx-1" />
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-slate-400 cursor-pointer"
                title="Attach file"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-slate-400 cursor-pointer"
                title="Emoji"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-slate-400 cursor-pointer"
                title="Mention colleague"
              >
                <AtSign className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Input field */}
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
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
          <div className="text-[9px] text-muted-foreground mt-2 px-1">
            <strong>Return</strong> to send, <strong>Shift + Return</strong> to add a new line
          </div>
        </div>
      </div>

      {/* 3. DIALOGS/MODALS (Inline glassmorphic overlays) */}
      {/* Create Channel Modal */}
      {isCreateChannelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="crm-card max-w-md w-full bg-card border border-border text-card-foreground shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
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
            <form onSubmit={handleCreateChannel}>
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

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateChannelOpen(false)}
                    className="text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary text-xs font-bold uppercase tracking-wider h-10 px-6 cursor-pointer"
                  >
                    Create Channel
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Start DM Modal */}
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
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Select Coworker
                  </label>
                  <select
                    required
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="block w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground outline-none focus:border-primary/45 cursor-pointer"
                  >
                    <option value="" disabled className="text-muted-foreground bg-card">
                      Choose a coworker...
                    </option>
                    {colleagues.map((emp) => (
                      <option key={emp.id} value={emp.id} className="text-foreground bg-card">
                        {emp.name} ({emp.role} · {emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsStartDmOpen(false)}
                    className="text-xs font-bold uppercase tracking-wider h-10 border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedEmployeeId}
                    className="btn-primary text-xs font-bold uppercase tracking-wider h-10 px-6 cursor-pointer"
                  >
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
