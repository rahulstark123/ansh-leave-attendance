# ANSH HR Mobile — Attendance Settings Spec

**Handoff for Antigravity / mobile developers.**  
Technical integration blueprint for building the Attendance Rules, Shifts, and Job Designations configuration modules in the React Native mobile client.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Attendance Settings** (`/settings/attendance` inside settings stack) |
| Access | Authorized Roles: `Admin`, `Owner`, `HR Manager` only. |
| Configuration Tabs | **Attendance Rules**, **Work Shifts**, **Job Designations** |
| Base API | `GET/POST /api/settings` (contains `attendanceSettings`) |
| Sub-APIs | `.../settings/shift`, `.../settings/designation` |

> **Security Note:** Non-management roles (`Employee`, `Manager`) should not see these settings paths, and API endpoints will block updates with `403 Forbidden` if executed by unauthorized accounts.

---

## 1. Data Models & TypeScript Types

Add the following interfaces to `types/index.ts` to manage attendance configuration:

```typescript
export interface AttendanceSettings {
  shiftStartTime: string;      // Format: "hh:mm A" (e.g. "09:00 AM")
  gracePeriod: number;         // Grace time in minutes (e.g. 15)
  workingHours: number;        // Required work duration in hours (e.g. 9)
  requireFaceMatch: boolean;   // Enable/Disable AI Face Verification on punch-in
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;           // Format: "hh:mm A"
  endTime: string;             // Format: "hh:mm A"
  gracePeriod: number;         // Grace time in minutes
  workingHours: number;        // Required hours
  branchId: string;            // "All" or target branch ID
  wid: number;
  createdAt: string;
}

export interface Designation {
  id: string;
  name: string;
  wid: number;
  createdAt: string;
}
```

---

## 2. API Specifications

All requests require user authorization: `Authorization: Bearer <ansh_auth_token>`.

### 2.1 General Rules Settings
* **Retrieve Settings:** `GET /api/settings`
  * Returns the full workspace configuration including rules:
  ```json
  {
    "settings": {
      "attendanceSettings": {
        "shiftStartTime": "09:00 AM",
        "gracePeriod": 15,
        "workingHours": 9,
        "requireFaceMatch": false
      }
    }
  }
  ```
* **Update Rules:** `POST /api/settings`
  * Updates system rules.
  ```json
  {
    "attendanceSettings": {
      "shiftStartTime": "09:30 AM",
      "gracePeriod": 20,
      "workingHours": 8,
      "requireFaceMatch": true
    }
  }
  ```

### 2.2 Work Shifts (`/api/settings/shift`)
* **List Shifts:** `GET /api/settings/shift`
  * Response: `{ "shifts": Shift[] }`
* **Create Shift:** `POST /api/settings/shift`
  * Request Body:
    ```json
    {
      "name": "Night Shift",
      "startTime": "10:00 PM",
      "endTime": "07:00 AM",
      "gracePeriod": 15,
      "workingHours": 9,
      "branchId": "All"
    }
    ```
* **Edit Shift:** `PATCH /api/settings/shift`
  * Requires `"id"` in the request body alongside updated fields.
* **Delete Shift:** `DELETE /api/settings/shift?id=<id>`

### 2.3 Job Designations (`/api/settings/designation`)
* **List Designations:** `GET /api/settings/designation`
  * Response: `{ "designations": Designation[] }`
* **Create Designation:** `POST /api/settings/designation`
  * Request Body: `{ "name": "Senior DevOps Specialist" }`
* **Delete Designation:** `DELETE /api/settings/designation?id=<id>`

---

## 3. Zustand Settings Store Implementation

Create a file named `stores/attendance-settings-store.ts` to manage API transactions inside the mobile app:

```typescript
import { create } from "zustand";
import { api } from "../lib/api";
import { AttendanceSettings, Shift, Designation } from "../types";

interface AttendanceSettingsState {
  rules: AttendanceSettings;
  shifts: Shift[];
  designations: Designation[];
  loading: boolean;
  error: string | null;

  fetchAttendanceSettings: () => Promise<void>;
  updateRules: (rules: AttendanceSettings) => Promise<boolean>;
  
  // Work shift actions
  addShift: (data: Omit<Shift, "id" | "wid" | "createdAt">) => Promise<boolean>;
  editShift: (id: string, data: Partial<Shift>) => Promise<boolean>;
  deleteShift: (id: string) => Promise<boolean>;

  // Designation actions
  addDesignation: (name: string) => Promise<boolean>;
  deleteDesignation: (id: string) => Promise<boolean>;
}

export const useAttendanceSettingsStore = create<AttendanceSettingsState>((set, get) => ({
  rules: { shiftStartTime: "09:00 AM", gracePeriod: 15, workingHours: 9, requireFaceMatch: false },
  shifts: [],
  designations: [],
  loading: false,
  error: null,

  fetchAttendanceSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settingsRes = await api<{ settings: { attendanceSettings: AttendanceSettings } }>("/api/settings");
      const shiftsRes = await api<{ shifts: Shift[] }>("/api/settings/shift");
      const desRes = await api<{ designations: Designation[] }>("/api/settings/designation");

      set({
        rules: settingsRes.settings.attendanceSettings || get().rules,
        shifts: shiftsRes.shifts || [],
        designations: desRes.designations || [],
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to load attendance settings", loading: false });
    }
  },

  updateRules: async (rules) => {
    try {
      await api("/api/settings", {
        method: "POST",
        body: JSON.stringify({ attendanceSettings: rules })
      });
      set({ rules });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to update rules" });
      return false;
    }
  },

  addShift: async (data) => {
    try {
      const res = await api<{ shift: Shift }>("/api/settings/shift", {
        method: "POST",
        body: JSON.stringify(data)
      });
      set({ shifts: [res.shift, ...get().shifts] });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to add shift" });
      return false;
    }
  },

  editShift: async (id, data) => {
    try {
      const res = await api<{ shift: Shift }>("/api/settings/shift", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data })
      });
      set({ shifts: get().shifts.map((s) => s.id === id ? res.shift : s) });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to edit shift" });
      return false;
    }
  },

  deleteShift: async (id) => {
    try {
      await api(`/api/settings/shift?id=${id}`, { method: "DELETE" });
      set({ shifts: get().shifts.filter((s) => s.id !== id) });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to delete shift" });
      return false;
    }
  },

  addDesignation: async (name) => {
    try {
      const res = await api<{ designation: Designation }>("/api/settings/designation", {
        method: "POST",
        body: JSON.stringify({ name })
      });
      set({ designations: [...get().designations, res.designation] });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to add designation" });
      return false;
    }
  },

  deleteDesignation: async (id) => {
    try {
      await api(`/api/settings/designation?id=${id}`, { method: "DELETE" });
      set({ designations: get().designations.filter((d) => d.id !== id) });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to delete designation" });
      return false;
    }
  }
}));
```

---

## 4. UI & Layout Best Practices

1. **Top Segmented Navigation:**
   * Provide a clean tab switch bar at the top of the settings page: `General Rules`, `Shifts`, `Designations`.
2. **Face Enrollment Banner Notification:**
   * When enabling the `requireFaceMatch` toggle in General Rules, display a warning card stating: 
     > ⚠️ **Enabling Face Verification requires all employees to enroll a profile photo for matching. Make sure team members register their biometric templates under their Profile settings page.**
3. **Time Picker Components:**
   * Use an elegant native time picker (`@react-native-community/datetimepicker` or similar modal wrapper) to select shift start/end times, and convert them to the expected format (`hh:mm A`) before sending payloads to the API.
