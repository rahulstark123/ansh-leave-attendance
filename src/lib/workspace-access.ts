import { prisma } from "@/lib/db";

type EmployeeLike = { id: string; wid?: number | null };

export async function ensureDefaultChannel(employee: EmployeeLike) {
  const wid = employee.wid ?? 1;
  const count = await prisma.workspaceChannel.count({ where: { wid } });
  if (count > 0) return;

  await prisma.workspaceChannel.create({
    data: {
      name: "general",
      description: "Company-wide announcements and updates",
      isPublic: true,
      createdById: employee.id,
      wid,
    },
  });
}

export async function canAccessChannel(
  employeeId: string,
  channel: { isPublic: boolean; createdById: string; members?: { employeeId: string }[] }
): Promise<boolean> {
  if (channel.isPublic) return true;
  if (channel.createdById === employeeId) return true;
  return channel.members?.some((m) => m.employeeId === employeeId) ?? false;
}

export function formatChannel(channel: {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdById: string;
  members?: { employeeId: string; employee?: { id: string; name: string; avatarInitials: string } }[];
}) {
  return {
    id: channel.id,
    name: channel.name,
    description: channel.description,
    isPublic: channel.isPublic,
    createdById: channel.createdById,
    memberIds: channel.members?.map((m) => m.employeeId) ?? [],
    members:
      channel.members?.map((m) => ({
        id: m.employee?.id ?? m.employeeId,
        name: m.employee?.name ?? "",
        avatarInitials: m.employee?.avatarInitials ?? "",
      })) ?? [],
  };
}

export function formatMessage(msg: {
  id: string;
  content: string;
  senderId: string;
  channelId: string | null;
  receiverId: string | null;
  sentAt: Date;
  sender: { name: string; avatarInitials: string };
}) {
  return {
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    senderName: msg.sender.name,
    avatarInitials: msg.sender.avatarInitials,
    channelId: msg.channelId ?? undefined,
    receiverId: msg.receiverId ?? undefined,
    sentAt: msg.sentAt.toISOString(),
  };
}
