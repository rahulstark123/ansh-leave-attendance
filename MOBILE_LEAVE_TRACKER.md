# ANSH HR Mobile — Leave Tracker Spec

**Handoff for Antigravity / mobile developers.**  
Technical spec for implementing the Leave Tracker Screen, Balance Cards, and Timeline History Filters in the React Native mobile client.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **My Leaves** (`/leave/tracker` inside main tabs/drawer) |
| Core features | Balance Cards (custom colors), Apply Leave Modal, Timeline Filter, Request Log |
| Base API | `GET/POST/PATCH/DELETE /api/leaves` |
| Support APIs | `GET /api/settings/holiday`, `GET /api/settings/leave-category` |

---

## 1. Data Structures & Balance Calculations

The leave tracker retrieves data from the backend to calculate available balances:

### 1.1 Standard & Custom Leave Balance Calculation
* **Standard Balance:** Read directly from `employee.leaveBalance: { Annual, Sick, Casual }`.
* **Custom Balance:** For any custom leave category, calculate the remaining balance client-side:
  $$\text{Available Balance} = \text{Category Days} - \sum \text{Approved Leave Request Days}$$
  *Filter custom categories by matching `branchId === "All"` or `branchId === currentUser.branch`.*

### 1.2 Leave Balance Card Layout (Mobile CSS/Theme)
Balance Cards should be stylized based on the category color (`purple`, `emerald`, `indigo`, `pink`, `slate`, `amber`, `sky`):

```
┌─────────────────────────────────┐
│ [Border Left: Emerald (4px)]    │
│ Annual Leave                    │
│ 12 days                         │
└─────────────────────────────────┘
```
* **Styling Recommendation:** Use `borderLeftWidth: 4`, setting the color to the category's theme color (e.g., `#10b981` for emerald).

---

## 2. Timeline Filtering Specs

The timeline filter is implemented client-side. The user filters their historical leave requests based on the date they applied (`appliedAt`).

### 2.1 Timeline Options & Filtering Logic
* **Today:** `appliedAt` must match the current day.
* **This Week:** `appliedAt` falls between the preceding Sunday and upcoming Saturday.
* **This Month:** `appliedAt` falls between day 1 and the last day of the current month.
* **Last 3 Months:** `appliedAt` is greater than or equal to 3 months prior to today.
* **All Time:** Shows all applications (no date constraints).

### 2.2 Date Range Filter Code Snippet
Use this helper function to filter logs inside React Native:

```typescript
export const isDateWithinTimelineRange = (dateInput: string | Date, range: string): boolean => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (range) {
    case "Today":
      return d.getTime() === today.getTime();

    case "This Week": {
      const day = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return d >= startOfWeek && d <= endOfWeek;
    }

    case "This Month": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return d >= startOfMonth && d <= endOfMonth;
    }

    case "Last 3 Months": {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      return d >= threeMonthsAgo && d <= today;
    }

    default: // "All Time"
      return true;
  }
};
```

---

## 3. API Reference

All requests require `Authorization: Bearer <ansh_auth_token>`.

### 3.1 Fetch Leave Applications (`GET /api/leaves`)
* Retrieves all leaves. The backend returns leaves scoped by role:
  * **Employees:** Their own requests only.
  * **Managers / HR:** Requests of employees reporting to them.
  * **Admins / Owners:** All requests in the workspace.
* **Response Payload (200 OK):**
  ```json
  {
    "leaves": [
      {
        "id": "clx_leave123",
        "employeeId": "emp_123",
        "employeeName": "Rahul Singh",
        "employeeRole": "Employee",
        "avatarInitials": "RS",
        "type": "Annual",
        "startDate": "2026-07-15",
        "endDate": "2026-07-18",
        "totalDays": 3,
        "halfDay": false,
        "reason": "Family vacation",
        "attachments": ["https://storage.anshapps.com/leaves/..."],
        "status": "Pending",
        "appliedAt": "2026-07-10T00:00:00.000Z"
      }
    ]
  }
  ```

### 3.2 Apply for Leave (`POST /api/leaves`)
* **Request Payload:**
  ```json
  {
    "type": "Casual",
    "startDate": "2026-07-12",
    "endDate": "2026-07-12",
    "totalDays": 1,
    "halfDay": false,
    "reason": "Personal urgent work",
    "attachments": [] // Optional array (max 3 R2 urls)
  }
  ```

### 3.3 Edit Pending Request (`PATCH /api/leaves`)
* *Only allowed if the request status is still `"Pending"`.*
* **Payload:** `{ "id": "clx_leave123", "reason": "New reason details", ... }`

### 3.4 Delete Pending Request (`DELETE /api/leaves?id=<id>`)
* *Only allowed if the request status is still `"Pending"`.*

---

## 4. Mobile UX & List View

### 4.1 Request Log Card Component
Render list logs on mobile using card components representing each application's details:

```
┌──────────────────────────────────────────────┐
│ Annual Leave                    [ PENDING ]  │
│ 15 Jul - 18 Jul (3 Days)                     │
│ Reason: Family vacation                      │
│ Applied on: 10 Jul 2026                      │
└──────────────────────────────────────────────┘
```

#### Styling Tokens:
* **Status Badges:** 
  * `Pending`: Amber background (`rgba(245, 158, 11, 0.08)`), text Amber (`#f59e0b`).
  * `Approved`: Emerald background (`rgba(16, 185, 129, 0.08)`), text Emerald (`#10b981`).
  * `Rejected`: Rose background (`rgba(239, 68, 68, 0.08)`), text Rose (`#ef4444`).
* **Pull-to-Refresh:** Implement standard React Native `RefreshControl` tied to `fetchLeaves` on the ScrollView.
