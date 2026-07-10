# ANSH HR Mobile — Leave Settings Spec

**Handoff for Antigravity / mobile developers.**  
Technical integration guide for implementing Leave & Holiday settings configuration on the React Native mobile app.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Leave Settings** (`/settings/leave` inside settings stack) |
| Access | Authorized Roles: `Admin`, `Owner`, `HR Manager` only. |
| Configuration Tabs | **Leave Limits**, **Custom Categories**, **Company Holidays**, **Policy Docs** |
| Base API | `GET/POST /api/settings` |
| Sub-APIs | `.../settings/leave-category`, `.../settings/holiday`, `.../settings/policy` |

> **Security Note:** Non-management roles (`Employee`, `Manager`) should not see these settings paths, and API endpoints will block updates with `403 Forbidden` if executed by unauthorized accounts.

---

## 1. Data Models & TypeScript Types

Add the following interfaces to `types/index.ts` to manage leave configuration:

```typescript
export interface LeaveSettings {
  annualLimit: number;
  sickLimit: number;
  casualLimit: number;
}

export interface CustomLeaveCategory {
  id: string;
  name: string;
  days: number;
  color: string;                  // e.g., 'purple', 'emerald', 'sky'
  allowRollover: boolean;
  description?: string;
  applicableGender: "All" | "Male" | "Female";
  accrualPolicy: "One-time" | "Monthly" | "Yearly";
  requiresProof: boolean;
  branchId: string;               // "All" or a specific branch ID/Name
  wid: number;
  createdAt: string;
}

export interface CompanyHoliday {
  id: string;
  name: string;
  date: string;                   // Format: "YYYY-MM-DD"
  type: "Gazetted" | "Restricted";
  branchId: string;               // "All" or a specific branch ID/Name
  wid: number;
  createdAt: string;
}

export interface PolicyDocument {
  id: string;
  name: string;
  uploadedAt: string;             // Format: "YYYY-MM-DD"
  size: string;                   // formatted size e.g. "1.2 MB"
  s3Key: string;                  // Cloudflare R2 identifier key
  wid: number;
  createdAt: string;
}
```

---

## 2. API Specifications

All requests require user authorization: `Authorization: Bearer <ansh_auth_token>`.

### 2.1 Leave Limits Settings
* **Retrieve Settings:** `GET /api/settings`
  * Returns the full workspace configuration:
  ```json
  {
    "settings": {
      "leaveSettings": {
        "annualLimit": 15,
        "sickLimit": 8,
        "casualLimit": 6
      },
      "branches": [...]
    }
  }
  ```
* **Update Limits:** `POST /api/settings`
  * Updates global base limits. **Important:** Setting these limits will trigger the backend to override/update all employees' baseline balances for these leave types.
  ```json
  {
    "leaveSettings": {
      "annualLimit": 18,
      "sickLimit": 10,
      "casualLimit": 8
    }
  }
  ```

### 2.2 Custom Leave Categories (`/api/settings/leave-category`)
* **List Categories:** `GET /api/settings/leave-category`
  * Response: `{ "leaveCategories": CustomLeaveCategory[] }`
* **Create Category:** `POST /api/settings/leave-category`
  * Request Body:
    ```json
    {
      "name": "Maternity Leave",
      "days": 90,
      "color": "pink",
      "allowRollover": false,
      "description": "State mandated paid leave for expecting mothers",
      "applicableGender": "Female",
      "accrualPolicy": "One-time",
      "requiresProof": true,
      "branchId": "All"
    }
    ```
* **Edit Category:** `PATCH /api/settings/leave-category`
  * Requires `"id"` in the request body alongside updated fields.
* **Delete Category:** `DELETE /api/settings/leave-category?id=<id>`

### 2.3 Company Holidays (`/api/settings/holiday`)
* **List Holidays:** `GET /api/settings/holiday`
  * Response: `{ "holidays": CompanyHoliday[] }`
* **Create Holiday:** `POST /api/settings/holiday`
  * Request Body:
    ```json
    {
      "name": "Independence Day",
      "date": "2026-08-15",
      "type": "Gazetted",
      "branchId": "All"
    }
    ```
* **Edit Holiday:** `PATCH /api/settings/holiday` (requires `id`)
* **Delete Holiday:** `DELETE /api/settings/holiday?id=<id>`

### 2.4 Policy Documents (`/api/settings/policy`)
* **List Policies:** `GET /api/settings/policy`
  * Response: `{ "policyDocuments": PolicyDocument[] }`
* **Upload Policy Document:** `POST /api/settings/policy`
  * Requires `multipart/form-data` payload containing:
    * `file`: (Binary PDF/image blob)
    * `documentName`: String representing the display file title
* **Rename Policy Display Name:** `PATCH /api/settings/policy`
  * Request Body: `{ "id": "<id>", "name": "New Document Name" }`
* **Delete Policy Document:** `DELETE /api/settings/policy?id=<id>`
  * Cleans up the record from database and deletes the physical file from Cloudflare R2 bucket.

---

## 3. Zustand Settings Store Implementation

Create a file named `stores/leave-settings-store.ts` to manage API transactions inside the mobile app:

```typescript
import { create } from "zustand";
import { api } from "../lib/api";
import { LeaveSettings, CustomLeaveCategory, CompanyHoliday, PolicyDocument } from "../types";

interface LeaveSettingsState {
  limits: LeaveSettings;
  categories: CustomLeaveCategory[];
  holidays: CompanyHoliday[];
  policies: PolicyDocument[];
  loading: boolean;
  error: string | null;

  fetchLeaveSettings: () => Promise<void>;
  updateLimits: (limits: LeaveSettings) => Promise<boolean>;
  
  // Custom categories actions
  addCategory: (data: Omit<CustomLeaveCategory, "id" | "wid" | "createdAt">) => Promise<boolean>;
  editCategory: (id: string, data: Partial<CustomLeaveCategory>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Holiday actions
  addHoliday: (data: Omit<CompanyHoliday, "id" | "wid" | "createdAt">) => Promise<boolean>;
  editHoliday: (id: string, data: Partial<CompanyHoliday>) => Promise<boolean>;
  deleteHoliday: (id: string) => Promise<boolean>;

  // Policy document actions
  renamePolicy: (id: string, newName: string) => Promise<boolean>;
  deletePolicy: (id: string) => Promise<boolean>;
}

export const useLeaveSettingsStore = create<LeaveSettingsState>((set, get) => ({
  limits: { annualLimit: 15, sickLimit: 8, casualLimit: 6 },
  categories: [],
  holidays: [],
  policies: [],
  loading: false,
  error: null,

  fetchLeaveSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settingsRes = await api<{ settings: { leaveSettings: LeaveSettings } }>("/api/settings");
      const catsRes = await api<{ leaveCategories: CustomLeaveCategory[] }>("/api/settings/leave-category");
      const holsRes = await api<{ holidays: CompanyHoliday[] }>("/api/settings/holiday");
      const polsRes = await api<{ policyDocuments: PolicyDocument[] }>("/api/settings/policy");

      set({
        limits: settingsRes.settings.leaveSettings || get().limits,
        categories: catsRes.leaveCategories || [],
        holidays: holsRes.holidays || [],
        policies: polsRes.policyDocuments || [],
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to load leave settings", loading: false });
    }
  },

  updateLimits: async (limits) => {
    try {
      await api("/api/settings", {
        method: "POST",
        body: JSON.stringify({ leaveSettings: limits })
      });
      set({ limits });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to update limits" });
      return false;
    }
  },

  addCategory: async (data) => {
    try {
      const res = await api<{ leaveCategory: CustomLeaveCategory }>("/api/settings/leave-category", {
        method: "POST",
        body: JSON.stringify(data)
      });
      set({ categories: [res.leaveCategory, ...get().categories] });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to add category" });
      return false;
    }
  },

  editCategory: async (id, data) => {
    try {
      const res = await api<{ leaveCategory: CustomLeaveCategory }>("/api/settings/leave-category", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data })
      });
      set({
        categories: get().categories.map((c) => c.id === id ? res.leaveCategory : c)
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to edit category" });
      return false;
    }
  },

  deleteCategory: async (id) => {
    try {
      await api(`/api/settings/leave-category?id=${id}`, { method: "DELETE" });
      set({ categories: get().categories.filter((c) => c.id !== id) });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to delete category" });
      return false;
    }
  },

  addHoliday: async (data) => {
    try {
      const res = await api<{ holiday: CompanyHoliday }>("/api/settings/holiday", {
        method: "POST",
        body: JSON.stringify(data)
      });
      set({ holidays: [res.holiday, ...get().holidays] });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to add holiday" });
      return false;
    }
  },

  editHoliday: async (id, data) => {
    try {
      const res = await api<{ holiday: CompanyHoliday }>("/api/settings/holiday", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data })
      });
      set({ holidays: get().holidays.map((h) => h.id === id ? res.holiday : h) });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to edit holiday" });
      return false;
    }
  },

  deleteHoliday: async (id) => {
    try {
      await api(`/api/settings/holiday?id=${id}`, { method: "DELETE" });
      set({ holidays: get().holidays.filter((h) => h.id !== id) });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to delete holiday" });
      return false;
    }
  },

  renamePolicy: async (id, newName) => {
    try {
      const res = await api<{ policyDocuments: PolicyDocument[] }>("/api/settings/policy", {
        method: "PATCH",
        body: JSON.stringify({ id, name: newName })
      });
      set({ policies: res.policyDocuments });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to rename policy" });
      return false;
    }
  },

  deletePolicy: async (id) => {
    try {
      const res = await api<{ policyDocuments: PolicyDocument[] }>(`/api/settings/policy?id=${id}`, {
        method: "DELETE"
      });
      set({ policies: res.policyDocuments });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to delete policy" });
      return false;
    }
  }
}));
```

---

## 4. Policy Document Upload Implementation (Multipart Form)

To upload PDF files directly from React Native to the policies storage endpoint:

```typescript
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import { useLeaveSettingsStore } from "./leave-settings-store";

async function selectAndUploadPolicy(displayName: string): Promise<boolean> {
  try {
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) return false;
    
    const file = pickerResult.assets[0];

    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/pdf",
    } as any);
    formData.append("documentName", displayName);

    const token = await SecureStore.getItemAsync("ansh_auth_token");
    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${API_BASE}/api/settings/policy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }

    const data = await response.json();
    // Update local state directly with returned policy documents list
    useLeaveSettingsStore.setState({ policies: data.policyDocuments });
    return true;
  } catch (error: any) {
    console.error("Policy upload error:", error);
    alert(error.message || "Failed to upload policy document");
    return false;
  }
}
```

---

## 5. UI & Layout Best Practices

1. **Dashboard / Settings Hub:**
   * Keep settings grouped in a clean grid list. Only reveal the "Leave Config" row if the active user's role satisfies `isManagement` (Admin/HR Manager/Owner).
2. **Configuration Stepper or Tab-bar:**
   * Use an elegant segmented tab bar (e.g. `Limits`, `Custom Categories`, `Holidays`, `Policies`) at the top of the Leave Settings screen.
3. **Color Badges:**
   * Use the `CustomLeaveCategory.color` value to style categories. You can map strings (like `'purple'`, `'indigo'`, `'emerald'`) to specific hex code values matching the theme palette.
4. **File Downloads:**
   * Provide download buttons for PDF policies using `Linking.openURL(url)` or downloading to device storage using `expo-file-system`.
