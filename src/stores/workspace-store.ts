import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { queuedLocalStorage } from "@/lib/safe-storage";

export interface Channel {
  id: string;
  name: string;
  description: string;
}

export interface WorkspaceMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  avatarInitials: string;
  channelId?: string;    // If sent to a channel
  receiverId?: string;   // If sent to a DM
  sentAt: string;        // ISO timestamp
}

interface WorkspaceState {
  channels: Channel[];
  messages: WorkspaceMessage[];
  addChannel: (name: string, description?: string) => string;
  sendMessage: (
    content: string,
    senderId: string,
    senderName: string,
    initials: string,
    channelId?: string,
    receiverId?: string
  ) => void;
}

const defaultChannels: Channel[] = [
  { id: "chan-general", name: "general", description: "Company-wide announcements and updates" },
  { id: "chan-engineering", name: "engineering", description: "Technical discussions and code check-ins" },
  { id: "chan-design", name: "design", description: "Figma links, UI/UX feedback, and assets review" },
  { id: "chan-product", name: "product", description: "Product roadmap and planning discussions" },
];

const defaultMessages: WorkspaceMessage[] = [
  {
    id: "msg-1",
    content: "Welcome to ANSH Workspace! This is the start of the #general channel. Company-wide announcements and updates",
    senderId: "emp-1",
    senderName: "Rahul Raj",
    avatarInitials: "RR",
    channelId: "chan-general",
    sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "msg-2",
    content: "Hi everyone! Excited to use this space for our engineering updates.",
    senderId: "emp-2",
    senderName: "Priya Sharma",
    avatarInitials: "PS",
    channelId: "chan-general",
    sentAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      channels: defaultChannels,
      messages: defaultMessages,
      addChannel: (name, description = "") => {
        const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/#/g, "");
        const id = `chan-${Date.now()}`;
        const newChan: Channel = {
          id,
          name: cleanName,
          description,
        };
        set((state) => ({
          channels: [...state.channels, newChan],
        }));
        return id;
      },
      sendMessage: (content, senderId, senderName, initials, channelId, receiverId) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `msg-${Date.now()}`,
              content: content.trim(),
              senderId,
              senderName,
              avatarInitials: initials,
              channelId,
              receiverId,
              sentAt: new Date().toISOString(),
            },
          ],
        })),
    }),
    {
      name: "ansh-workspace-chat",
      version: 1,
      storage: createJSONStorage(() => queuedLocalStorage),
    }
  )
);
