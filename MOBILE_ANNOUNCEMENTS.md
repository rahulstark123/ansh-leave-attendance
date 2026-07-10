# ANSH HR Mobile — Notice Board & Announcements Spec

**Handoff for Antigravity / mobile developers.**  
Technical blueprint for implementing the organization Notice Board & Announcements module on React Native.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Notice Board** (`/announcements`) |
| Modals | Post Announcement, Edit Announcement, Delete Confirmation |
| Primary APIs | `GET/POST /api/announcements`, `PATCH/DELETE /api/announcements` |
| Attachment API | `POST /api/storage/upload` |
| Security | Read: All members of workspace. Write/Edit/Delete: `Admin`, `Owner`, `HR Manager` |

---

## 1. Database Model & Type Definitions

The mobile app should represent announcements with the following TypeScript interfaces.

### Announcement Interface
```typescript
export interface Announcement {
  id: string;
  title: string;
  body: string;
  attachments: string[]; // URLs stored in R2 storage
  pinned: boolean;       // Pinned notices rank at the top
  archived: boolean;     // Soft-deleted/archived indicator
  wid: number;           // Workspace ID scoping
  authorId: string;      // ID of the employee who posted it
  authorName: string;    // Display name of the author
  createdAt: string;     // ISO Date String
  updatedAt: string;     // ISO Date String
}
```

---

## 2. API Specifications

All requests require the `Authorization` header with the user's Supabase JWT token:
`Authorization: Bearer <ansh_auth_token>`

### 2.1 Fetch Announcements
* **Endpoint:** `GET /api/announcements`
* **Method:** `GET`
* **Query Params:** None
* **Description:** Retrieves all active (non-archived) announcements for the user's workspace, sorted first by `pinned` (descending) then by `createdAt` (descending).
* **Response (200 OK):**
  ```json
  {
    "announcements": [
      {
        "id": "clxb93j...",
        "title": "Q3 Strategy Town Hall",
        "body": "Hi team, please find details for our upcoming Q3 Town Hall meeting...",
        "attachments": ["https://storage.anshapps.com/announcements/..."],
        "pinned": true,
        "archived": false,
        "wid": 1,
        "authorId": "emp_123",
        "authorName": "Rohan Sharma",
        "createdAt": "2026-07-09T18:00:00.000Z",
        "updatedAt": "2026-07-09T18:00:00.000Z"
      }
    ]
  }
  ```

### 2.2 Post Announcement
* **Endpoint:** `POST /api/announcements`
* **Method:** `POST`
* **Roles Allowed:** `Admin`, `Owner`, `HR Manager`
* **Request Body:**
  ```json
  {
    "title": "System Maintenance Window",
    "body": "The staging server will be down for maintenance from 10 PM to 12 AM tonight.",
    "pinned": true,
    "attachments": ["https://storage.anshapps.com/announcements/file.pdf"] // Optional (max 3 urls)
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "announcement": {
      "id": "clx...",
      "title": "System Maintenance Window",
      ...
    }
  }
  ```

### 2.3 Edit Announcement
* **Endpoint:** `PATCH /api/announcements`
* **Method:** `PATCH`
* **Roles Allowed:** `Admin`, `Owner`, `HR Manager`
* **Request Body:**
  ```json
  {
    "id": "clx...", // Required
    "title": "Updated Title", // Optional
    "body": "Updated Body",   // Optional
    "pinned": false,          // Optional
    "archived": false,        // Optional
    "attachments": ["url1"]   // Optional (max 3 urls)
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "announcement": {
      "id": "clx...",
      "title": "Updated Title",
      ...
    }
  }
  ```

### 2.4 Delete Announcement
* **Endpoint:** `DELETE /api/announcements?id=<id>`
* **Method:** `DELETE`
* **Roles Allowed:** `Admin`, `Owner`, `HR Manager`
* **Response (200 OK):**
  ```json
  {
    "success": true
  }
  ```

### 2.5 Attachment File Upload
* **Endpoint:** `POST /api/storage/upload`
* **Method:** `POST`
* **Headers:** 
  * `Authorization: Bearer <token>`
  * *Do not set `Content-Type` manually (let the browser/native fetch boundary format it for `multipart/form-data`)*
* **Body:** `FormData` containing:
  * `file`: Binary file blob
  * `folder`: `"announcements"` (literal string)
* **Constraints:**
  * File size must be under **2 MB**
  * Allowed content types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`
* **Response (200 OK):**
  ```json
  {
    "url": "https://storage.anshapps.com/announcements/1/emp_123/172054992_document.pdf",
    "key": "announcements/1/emp_123/172054992_document.pdf"
  }
  ```

---

## 3. Frontend & Mobile UX Flow

The mobile Notice Board should be integrated under a sub-page or main route within the Tab Navigation. Below is the proposed layout structure.

### 3.1 Notice Board Main Screen Layout
```
┌────────────────────────────────────────────────────────┐
│  [Megaphone Icon] NOTICE BOARD                     [+] │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📌 Pinned Announcement                           │  │
│  │ Q3 STRATEGIC UPDATE                              │  │
│  │ By Rohan Sharma • 09 Jul 2026                    │  │
│  │ Hi team, here is our roadmap update...           │  │
│  │ 📁 Q3_Roadmap.pdf                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  LATEST NOTICES                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Office Holiday Announcement                      │  │
│  │ By Priya Nair • 08 Jul 2026                      │  │
│  │ The office will remain closed on July 15th...    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

#### Key Styling Guide (Aesthetic Match):
* **Colors:** Pinned cards should have a subtle tint matching primary background (`rgba(13, 148, 136, 0.05)` or emerald green glow) with a bold border-left in Emerald Green (`#10b981`). Regular cards use standard white/dark card tokens.
* **Badges:** Use a small golden or emerald pin icon with a "Pinned" uppercase micro-label for pinned announcements.
* **Author Info:** Display initials or custom avatar using the `<Avatar>` UI component with author's name and human-friendly time (e.g. "2 hours ago" or "09 Jul 2026").
* **Attachments:** Display as horizontal badges or list rows with paperclip icons. Clicking them should open the file URL using React Native's `Linking` or `expo-sharing` / `expo-file-system`.

---

## 4. React Native State Management

Create an announcements store utilizing **Zustand** to match the existing codebase architecture:

### Zustand Store (`stores/announcement-store.ts`)
```typescript
import { create } from "zustand";
import { api } from "../lib/api";
import { Announcement } from "../types";

interface AnnouncementState {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  fetchAnnouncements: () => Promise<void>;
  createAnnouncement: (title: string, body: string, pinned: boolean, attachments: string[]) => Promise<boolean>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<boolean>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
}

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
  announcements: [],
  loading: false,
  error: null,

  fetchAnnouncements: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api<{ announcements: Announcement[] }>("/api/announcements");
      set({ announcements: data.announcements, loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to load announcements", loading: false });
    }
  },

  createAnnouncement: async (title, body, pinned, attachments) => {
    try {
      await api("/api/announcements", {
        method: "POST",
        body: JSON.stringify({ title, body, pinned, attachments }),
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to create announcement" });
      return false;
    }
  },

  updateAnnouncement: async (id, updates) => {
    try {
      await api("/api/announcements", {
        method: "PATCH",
        body: JSON.stringify({ id, ...updates }),
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to update announcement" });
      return false;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      await api(`/api/announcements?id=${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to delete announcement" });
      return false;
    }
  },
}));
```

---

## 5. Mobile File Upload Implementation

To support uploading attachments from React Native, use `expo-document-picker` or `expo-image-picker` to select files, and upload them sequentially.

### React Native File Upload Code Snippet
```typescript
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";

async function uploadDocumentToNoticeBoard(): Promise<string | null> {
  try {
    // 1. Pick the document
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const fileAsset = result.assets[0];

    // Check size limit (2 MB = 2,097,152 bytes)
    if (fileAsset.size && fileAsset.size > 2097152) {
      alert("File size must be under 2MB");
      return null;
    }

    // 2. Prepare Form Data
    const formData = new FormData();
    // In React Native, the file object requires uri, name, and type
    formData.append("file", {
      uri: fileAsset.uri,
      name: fileAsset.name,
      type: fileAsset.mimeType || "application/octet-stream",
    } as any);
    
    formData.append("folder", "announcements");

    // 3. Perform Fetch Request
    const token = await SecureStore.getItemAsync("ansh_auth_token");
    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${API_BASE}/api/storage/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Important: Do not set Content-Type header in multipart uploads
      },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Upload failed");
    }

    const data = await response.json();
    return data.url; // Returns the public object URL from Cloudflare R2
  } catch (error: any) {
    console.error("Attachment upload error:", error);
    alert(error.message || "Failed to upload file");
    return null;
  }
}
```
