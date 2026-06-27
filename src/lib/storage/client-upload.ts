import { prepareAttachment } from "@/lib/attachment-compress";

export type UploadFolder = "leaves" | "announcements";

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("ansh_auth_token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadAttachmentFile(
  file: File,
  folder: UploadFolder
): Promise<{ url: string; key: string }> {
  const prepared = await prepareAttachment(file);
  const formData = new FormData();
  formData.append("file", prepared);
  formData.append("folder", folder);

  const res = await fetch("/api/storage/upload", {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to upload attachment.");
  }

  return { url: data.url as string, key: data.key as string };
}

export async function uploadAttachmentFiles(
  files: File[],
  folder: UploadFolder
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const { url } = await uploadAttachmentFile(file, folder);
    urls.push(url);
  }
  return urls;
}
