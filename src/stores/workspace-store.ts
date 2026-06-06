import { create } from "zustand";

export interface Channel {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdById: string;
  memberIds: string[];
  members: { id: string; name: string; avatarInitials: string }[];
}

export interface WorkspaceMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  avatarInitials: string;
  channelId?: string;
  receiverId?: string;
  sentAt: string;
}

interface WorkspaceState {
  channels: Channel[];
  messages: WorkspaceMessage[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
  fetchChannels: () => Promise<void>;
  createChannel: (
    name: string,
    description: string,
    isPublic: boolean,
    memberIds: string[]
  ) => Promise<Channel | null>;
  fetchMessages: (params: { channelId?: string; receiverId?: string }) => Promise<void>;
  sendMessage: (
    content: string,
    senderId: string,
    senderName: string,
    initials: string,
    channelId?: string,
    receiverId?: string
  ) => Promise<boolean>;
  addRealtimeMessage: (message: WorkspaceMessage) => void;
}

function getHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("ansh_auth_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  channels: [],
  messages: [],
  loading: false,
  messagesLoading: false,
  error: null,

  fetchChannels: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/workspace/channels", { headers: getHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load channels");
      }
      const data = await res.json();
      set({ channels: data.channels || [], loading: false });
    } catch (err: unknown) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load channels",
      });
    }
  },

  createChannel: async (name, description, isPublic, memberIds) => {
    set({ error: null });
    try {
      const res = await fetch("/api/workspace/channels", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name, description, isPublic, memberIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create channel");
      }
      const channel = data.channel as Channel;
      set((state) => ({ channels: [...state.channels, channel] }));
      return channel;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to create channel" });
      return null;
    }
  },

  fetchMessages: async ({ channelId, receiverId }) => {
    set({ messagesLoading: true, error: null });
    try {
      const query = channelId
        ? `channelId=${encodeURIComponent(channelId)}`
        : receiverId
          ? `receiverId=${encodeURIComponent(receiverId)}`
          : null;
      if (!query) {
        set({ messages: [], messagesLoading: false });
        return;
      }

      const res = await fetch(`/api/workspace/messages?${query}`, { headers: getHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load messages");
      }
      const data = await res.json();
      set({ messages: data.messages || [], messagesLoading: false });
    } catch (err: unknown) {
      set({
        messagesLoading: false,
        error: err instanceof Error ? err.message : "Failed to load messages",
        messages: [],
      });
    }
  },

  sendMessage: async (content, senderId, senderName, initials, channelId, receiverId) => {
    try {
      const res = await fetch("/api/workspace/messages", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ content, channelId, receiverId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      const message = data.message as WorkspaceMessage;
      set((state) => ({
        messages: [...state.messages, message],
      }));
      return true;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to send message" });
      return false;
    }
  },

  addRealtimeMessage: (message) => {
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: [...state.messages, message],
      };
    });
  },
}));
