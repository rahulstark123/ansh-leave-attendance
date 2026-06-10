# ANSH HR — React Native Mobile App Guide

Complete blueprint for building a modern SaaS mobile app that connects to the existing ANSH HR web backend.

---

## 1. Overview

| Item | Value |
|------|-------|
| Product | ANSH HR — Leave, Attendance & Team Management |
| Backend | Existing Next.js API (`/api/*`) + Supabase Auth + PostgreSQL |
| Mobile stack | **React Native (Expo recommended)** + TypeScript |
| Auth | Supabase (`@supabase/supabase-js`) |
| API style | REST JSON with `Authorization: Bearer <token>` |

The mobile app reuses the **same APIs** as the web app. No separate backend is required.

---

## 2. Recommended Tech Stack

```
React Native (Expo SDK 52+)
├── TypeScript
├── Expo Router (file-based navigation)
├── @supabase/supabase-js (auth + realtime)
├── @tanstack/react-query (API caching)
├── zustand (global state — mirrors web stores)
├── react-native-reanimated + gesture-handler
├── expo-camera / expo-image-picker (face punch selfies)
├── expo-location (GPS punch-in)
├── expo-secure-store (token storage)
├── react-native-razorpay (Pro billing — Android/iOS)
└── nativewind or tamagui (Tailwind-like styling)
```

---

## 3. Environment Variables (Mobile)

Create `apps/mobile/.env` or `app.config.ts` extras:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-domain.com
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx   # only if in-app billing
```

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Base URL for all `/api/*` calls |
| `EXPO_PUBLIC_SUPABASE_URL` | Auth login, signup, OAuth, realtime |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase client key |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Pro checkout (optional on mobile) |

**Server-only (never ship in mobile):** `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, S3 keys.

---

## 4. Design System

### Brand

- **Product name:** ANSH HR
- **Tagline:** Leave, Attendance & Team Management
- **Primary color:** Teal/Emerald (`#0d9488` / `#14b8a6`)
- **Accent gradients:** `emerald → teal → sky`
- **Style:** Modern SaaS — rounded cards (16–24px), soft shadows, uppercase micro-labels, bold headings

### Color Tokens

```ts
export const colors = {
  primary: "#0d9488",
  primaryLight: "#14b8a6",
  primaryBg: "rgba(13, 148, 136, 0.08)",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  background: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  dark: {
    background: "#0f172a",
    card: "#1e293b",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    border: "#334155",
  },
};
```

### Typography

| Role | Size | Weight |
|------|------|--------|
| Screen title | 24–28px | 800 (extrabold) |
| Section label | 10–11px | 700, uppercase, tracking-wider |
| Body | 14px | 500–600 |
| Caption | 11–12px | 500, muted |

### Reusable Components

| Component | Usage |
|-----------|-------|
| `Screen` | Safe area + scroll + padding |
| `Card` | Elevated white/dark surface, `borderRadius: 16` |
| `Button` | Primary (teal fill), Outline, Ghost |
| `Badge` | Status pills: Pending (amber), Approved (green), Rejected (red) |
| `PageHeader` | Eyebrow + title + description + action button |
| `EmptyState` | Icon + title + subtitle + CTA |
| `TrialBanner` | Pro trial countdown strip |
| `ProGateModal` | Upgrade prompt for gated features |
| `Avatar` | Initials circle from `avatarInitials` |
| `StatCard` | Dashboard metric tiles |

### Dark Mode

Support system theme toggle. Web uses `dark:` classes — mirror with `useColorScheme()` + theme context.

---

## 5. App Navigation Architecture

```
RootNavigator
├── AuthStack (unauthenticated)
│   ├── Welcome / Splash
│   ├── Login
│   ├── Signup
│   ├── ForgotPassword
│   ├── ResetPassword
│   └── Onboarding (3-step wizard)
│
└── MainTabs (authenticated)
    ├── Tab: Home (Dashboard)
    ├── Tab: Leave
    ├── Tab: Attendance
    ├── Tab: Team
    └── Tab: More
        ├── Workspace (Pro) ── Stack
        ├── Reports (Pro) ── Stack
        ├── WFH ── Stack
        ├── Regularization ── Stack
        ├── Help / Support ── Stack
        └── Settings ── Stack
            ├── Profile
            ├── Company (Admin/HR)
            ├── Leave Settings (Pro)
            ├── Attendance Settings (Pro)
            └── Billing
```

### Role-based visibility

| Role | Extra access |
|------|--------------|
| Employee | Own data only |
| Manager | Team approvals, scoped reports |
| HR Manager / Admin / Owner | Full workspace, settings, billing |

---

## 6. Auth Flow (Step-by-Step)

### 6.1 Login Screen

**UI elements:**
- ANSH HR logo + tagline
- Email input
- Password input (show/hide toggle)
- "Sign In" primary button
- "Continue with Google" secondary button
- Links: Forgot password, Create account

**Logic:**
```ts
// 1. Supabase email login
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// 2. Store token securely
await SecureStore.setItemAsync("ansh_auth_token", data.session.access_token);

// 3. Check employee profile
const res = await fetch(`${API_BASE}/api/auth/me`, {
  headers: { Authorization: `Bearer ${data.session.access_token}` },
});
const json = await res.json();

// 4. Route
if (json.onboardingRequired) navigation.replace("Onboarding");
else navigation.replace("MainTabs");
```

**Google OAuth (mobile):**
```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "anshhr://auth/callback",  // deep link
    skipBrowserRedirect: true,
  },
});
// Handle deep link in app.json → expo-linking
```

### 6.2 Signup Screen

Same layout as login. `supabase.auth.signUp()` → always route to **Onboarding**.

### 6.3 Onboarding (3 steps)

Mirrors `src/app/onboarding/page.tsx`:

| Step | Fields |
|------|--------|
| 1 | Full name, Department |
| 2 | Role (Employee / Manager / HR Manager / Admin / Owner) |
| 3 | Company name, address, employee count *(Admin/HR/Owner only)* |

**API:**
```http
POST /api/auth/onboard
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Rahul Sharma",
  "department": "Engineering",
  "role": "Admin",
  "companyName": "ANSH Solutions",
  "companyAddress": "Mumbai, India",
  "employeeCount": "11-50"
}
```

**Response:** `{ employee: { id, name, role, wid, branch, ... } }`

New Admin/HR workspaces get a **14-day Pro trial** automatically.

### 6.4 Token Storage

| Web key | Mobile equivalent |
|---------|-------------------|
| `sessionStorage.ansh_auth_token` | `SecureStore` / `expo-secure-store` |
| `sessionStorage.ansh_auth_session` | Derived from valid Supabase session |

### 6.5 API Client Helper

```ts
// lib/api.ts
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync("ansh_auth_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    // logout + redirect to Login
    throw new AuthError();
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}
```

---

## 7. Screen Specifications

### Phase 1 — MVP (build first)

#### 7.1 Dashboard (`/dashboard`)

**API:** `GET /api/dashboard`

**UI sections:**
1. **Header** — Greeting + avatar + PRO/FREE badge
2. **Punch card** — Current status (In/Out), big Punch In/Out button
3. **Leave balances** — Annual / Sick / Casual chips
4. **Quick actions** — Apply Leave, WFH, View Team
5. **Team snapshot** — Who's in, on leave, absent (role-scoped)
6. **Trial banner** — if `isTrialActive`

**Punch flow:**
```
Tap Punch In
  → Request camera permission
  → Open FaceScan modal (selfie)
  → Request location permission
  → POST /api/attendance/punch { action: "in", photo: base64, lat, lng }
  → Refresh dashboard
```

**Key response fields:**
```json
{
  "currentUser": { "id", "name", "role", "branch", "annualBalance", "currentPunchIn", ... },
  "employees": [...],
  "leaves": [...],
  "punchHistory": [...],
  "faceEnrolled": true
}
```

---

#### 7.2 Leave — My Requests (`/leave`)

**APIs:**
- `GET /api/leaves` — list
- `POST /api/leaves` — create
- `PATCH /api/leaves` — edit pending
- `DELETE /api/leaves?id=` — delete pending

**UI:**
- FAB "Apply Leave"
- List with status badges
- Filter: All / Pending / Approved / Rejected
- Apply modal: type, dates, half-day toggle, reason

**POST body:**
```json
{
  "type": "Annual",
  "startDate": "2026-06-15",
  "endDate": "2026-06-17",
  "totalDays": 3,
  "halfDay": false,
  "reason": "Family function"
}
```

---

#### 7.3 Leave — Approvals (`/leave/approvals`)

**API:** `POST /api/leaves/status`
```json
{ "id": "leave-id", "status": "Approved" }
```

**UI:** Pending team requests with Approve / Reject buttons.  
**Roles:** Manager, HR Manager, Admin, Owner.

---

#### 7.4 Attendance Logs (`/attendance`)

**API:** `GET /api/attendance/punch`

**UI:**
- Monthly punch list
- Status chips: On-time, Late, WFH, Half-day, Regularized
- Tap row → detail (time, duration, selfie thumbnail, map pin)

---

#### 7.5 WFH (`/attendance/wfh`)

**APIs:**
- `GET /api/attendance/wfh`
- `POST /api/attendance/wfh`
- `PATCH /api/attendance/wfh`
- `POST /api/attendance/wfh/status` (approve/reject)

**POST body:**
```json
{
  "startDate": "2026-06-10",
  "endDate": "2026-06-12",
  "totalDays": 3,
  "halfDay": false,
  "reason": "Working from home"
}
```

**Branch validation:** Uses `resolveEmployeeBranch()` logic — requires office branch assignment or Main HQ fallback.

---

#### 7.6 Profile Settings (`/settings/profile`)

**APIs:**
- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/employee/face-enroll`
- `DELETE /api/employee/face-enroll`

**UI:** Personal info form, emergency contact, face enrollment camera flow.

---

### Phase 2 — Team & Communication

#### 7.7 Team Directory (`/team`)

**APIs:**
- `GET /api/employees`
- `POST /api/employees` *(Admin/HR — respects plan user limit)*
- `PATCH /api/employees/[id]`
- `DELETE /api/employees/[id]`

**UI:** Searchable employee list, profile drawer, add member form (Admin/HR).

---

#### 7.8 Team Space / Workspace (`/workspace`) — **Pro**

**APIs:**
- `GET /api/workspace/channels`
- `POST /api/workspace/channels`
- `GET /api/workspace/messages?channelId=`
- `POST /api/workspace/messages`
- `GET /api/workspace/messages?listDmPartners=true`

**Realtime:** Supabase `postgres_changes` on `WorkspaceMessage` table.

**UI:** Slack-like — channel list, message thread, DM list, compose bar.

---

#### 7.9 Regularization (`/attendance/regularization`)

**APIs:**
- `GET /api/attendance/regularization`
- `POST /api/attendance/regularization`
- `POST /api/attendance/regularization/status`

---

### Phase 3 — Admin & Billing

#### 7.10 Reports (`/reports`) — **Pro**

**API:** `GET /api/analytics`  
**Roles:** Manager, HR Manager, Admin, Owner.

**UI:** Charts — punctuality, leave trends, team attendance stats.

---

#### 7.11 Settings (Admin)

| Screen | API base |
|--------|----------|
| Company + Branches | `GET/POST /api/settings` |
| Leave categories | `/api/settings/leave-category` |
| Holidays | `/api/settings/holiday` |
| Shifts | `/api/settings/shift` |
| Policies | `/api/settings/policy` |

---

#### 7.12 Billing (`/settings/billing`)

**APIs:**
- `GET /api/billing/status`
- `GET /api/billing/fx`
- `POST /api/billing/checkout/order`
- `POST /api/billing/checkout/verify`
- `POST /api/billing/downgrade`

**Plan info from status:**
```json
{
  "plan": "free",
  "planName": "ANSH HR Pro Trial",
  "hasProAccess": true,
  "isTrialActive": true,
  "trialDaysRemaining": 9,
  "hasScheduledPro": false,
  "maxUsers": 100,
  "punchesUsedThisMonth": 12,
  "punchesLimit": null
}
```

**Pro purchase during trial:** Payment succeeds immediately; Pro billing **starts when trial ends** (`hasScheduledPro: true`).

---

#### 7.13 Help & Support (`/help`)

**APIs:**
- `GET /api/support/tickets`
- `POST /api/support/tickets`
- `PATCH /api/support/tickets/status`

---

## 8. Complete API Reference

Base: `{API_BASE_URL}/api`

### Auth
| Method | Endpoint | Body / Params |
|--------|----------|---------------|
| GET | `/auth/me` | — |
| POST | `/auth/onboard` | `{ name, department, role, companyName?, companyAddress?, employeeCount? }` |

### Core
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/dashboard` | Main app bootstrap data |
| GET | `/profile` | Current user profile |
| PATCH | `/profile` | Update profile fields |
| GET | `/employees` | Workspace employee list |
| POST | `/employees` | Create employee (plan limit enforced) |
| PATCH | `/employees/:id` | Update employee |
| DELETE | `/employees/:id` | Delete employee |

### Leave
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/leaves` | Role-scoped list |
| POST | `/leaves` | Apply leave |
| PATCH | `/leaves` | Edit pending |
| DELETE | `/leaves?id=` | Delete pending |
| POST | `/leaves/status` | Approve/reject |

### Attendance
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/attendance/punch` | Punch history |
| POST | `/attendance/punch` | Punch in/out + selfie + GPS |
| GET | `/attendance/regularization` | List requests |
| POST | `/attendance/regularization` | Submit |
| POST | `/attendance/regularization/status` | Approve/reject |
| GET | `/attendance/wfh` | List WFH requests |
| POST | `/attendance/wfh` | Apply WFH |
| PATCH | `/attendance/wfh` | Edit pending |
| POST | `/attendance/wfh/status` | Approve/reject |

### Face Recognition
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/employee/face-enroll` | Upload face photos (base64) |
| DELETE | `/employee/face-enroll` | Remove enrollment |
| POST | `/employee/face-verify` | Verify selfie at punch |
| GET | `/employee/face-embedding` | Get enrollment status |

### Workspace (Pro)
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/workspace/channels` | List channels |
| POST | `/workspace/channels` | Create channel |
| GET | `/workspace/messages` | `?channelId=` or `?listDmPartners=true` |
| POST | `/workspace/messages` | Send message |

### Settings
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/settings` | Branches, leave/attendance config |
| POST | `/settings` | Save settings (Admin/HR) |
| GET/POST/PATCH/DELETE | `/settings/shift` | Shift rosters |
| GET/POST/PATCH/DELETE | `/settings/leave-category` | Leave types |
| GET/POST/PATCH/DELETE | `/settings/holiday` | Holidays |
| GET/POST/PATCH/DELETE | `/settings/policy` | Policy docs |
| GET | `/settings/download-policy?id=` | Download PDF |
| GET/POST/DELETE | `/settings/designation` | Job titles |

### Billing
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/billing/status` | Plan, trial, usage |
| GET | `/billing/fx` | Regional pricing |
| POST | `/billing/checkout/order` | Create Razorpay order |
| POST | `/billing/checkout/verify` | Confirm payment |
| POST | `/billing/downgrade` | Downgrade to free |

### Other
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/analytics` | Reports data |
| GET/POST/DELETE | `/support/tickets` | Help desk |
| PATCH | `/support/tickets/status` | Update ticket |

---

## 9. Plan Gating (Free vs Pro)

| Feature | Free | Pro / Trial |
|---------|------|-------------|
| Punch in/out | 50/month | Unlimited |
| Team members | 3 max | 100 max |
| Team Space | ❌ | ✅ |
| Custom leave categories | ❌ | ✅ |
| Holiday calendar | ❌ | ✅ |
| Policy documents | ❌ | ✅ |
| Shift roster settings | ❌ | ✅ |
| Reports & analytics | ❌ | ✅ |

**Check plan on app launch:**
```ts
const plan = await api("/api/billing/status");
// plan.hasProAccess, plan.isTrialActive, plan.trialDaysRemaining
```

**Gate UI:**
```ts
if (!plan.hasProAccess && feature.requiresPro) {
  showProUpgradeModal(feature);
  return;
}
```

**Gated routes (match web):**
- `/workspace`
- `/reports`
- `/leave/holidays`
- `/leave/policies`
- `/settings/leave`
- `/settings/attendance`

---

## 10. State Management (Zustand Stores)

Mirror web stores from `src/stores/`:

| Store | Responsibility |
|-------|----------------|
| `authStore` | session, token, user, onboarding state |
| `planStore` | billing status, trial, upgrade modals |
| `leaveStore` | employees, leaves, punches, currentUser |
| `workspaceStore` | channels, messages, DMs |

**Bootstrap on login:**
```ts
await Promise.all([
  api("/api/dashboard"),      // → leaveStore
  api("/api/billing/status"), // → planStore
]);
```

---

## 11. Native Features Checklist

| Feature | Expo module | Used for |
|---------|-------------|----------|
| Camera | `expo-camera` | Punch selfie, face enroll |
| Location | `expo-location` | Punch GPS coordinates |
| Secure storage | `expo-secure-store` | Auth token |
| Deep linking | `expo-linking` | Google OAuth callback |
| Push notifications | `expo-notifications` | Leave approvals, punch reminders |
| File system | `expo-document-picker` | Policy downloads |
| Haptics | `expo-haptics` | Punch success feedback |

### Face punch payload example

```json
{
  "action": "in",
  "photo": "data:image/jpeg;base64,...",
  "lat": 19.076,
  "lng": 72.8777
}
```

---

## 12. Suggested Folder Structure

```
apps/mobile/
├── app/                          # Expo Router
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard
│   │   ├── leave.tsx
│   │   ├── attendance.tsx
│   │   ├── team.tsx
│   │   └── more.tsx
│   ├── leave/
│   │   ├── approvals.tsx
│   │   ├── holidays.tsx
│   │   └── policies.tsx
│   ├── attendance/
│   │   ├── wfh.tsx
│   │   └── regularization.tsx
│   ├── workspace/
│   │   └── index.tsx
│   ├── reports/
│   │   └── index.tsx
│   └── settings/
│       ├── profile.tsx
│       ├── company.tsx
│       ├── leave.tsx
│       ├── attendance.tsx
│       └── billing.tsx
├── components/
│   ├── ui/                       # Button, Card, Badge, Input...
│   ├── auth/
│   ├── attendance/               # FaceScanModal, PunchCard
│   ├── leave/
│   └── billing/                  # TrialBanner, ProGateModal
├── lib/
│   ├── api.ts
│   ├── supabase.ts
│   ├── branch-utils.ts           # copy from web
│   └── theme.ts
├── stores/
│   ├── auth-store.ts
│   ├── plan-store.ts
│   └── leave-store.ts
├── types/
│   └── index.ts                  # Employee, LeaveRequest, PunchRecord...
└── app.config.ts
```

---

## 13. Implementation Roadmap

### Sprint 1 — Foundation (Week 1–2)
- [ ] Expo project setup + theme tokens
- [ ] Supabase auth (login, signup, token storage)
- [ ] API client with Bearer auth
- [ ] Onboarding wizard
- [ ] Bottom tab navigation shell

### Sprint 2 — Core HR (Week 3–4)
- [ ] Dashboard + punch in/out (camera + GPS)
- [ ] Face enrollment flow
- [ ] Leave list + apply + approvals
- [ ] Attendance logs
- [ ] Profile settings

### Sprint 3 — Attendance+ (Week 5)
- [ ] WFH requests + approvals
- [ ] Regularization
- [ ] Trial banner + plan badge
- [ ] Pro gate modal

### Sprint 4 — Team (Week 6–7)
- [ ] Team directory
- [ ] Employee detail view
- [ ] Team Space messaging (Pro)
- [ ] Supabase realtime for messages

### Sprint 5 — Admin & Polish (Week 8+)
- [ ] Reports & analytics (Pro)
- [ ] Settings screens (company, leave, attendance)
- [ ] Billing + Razorpay checkout
- [ ] Help / support tickets
- [ ] Push notifications
- [ ] App Store / Play Store submission

---

## 14. Login Screen — Wireframe Spec

```
┌─────────────────────────────────┐
│                                 │
│         [ANSH HR Logo]          │
│    Leave & Attendance SaaS      │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Email                     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Password            [eye] │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Sign In    →         │  │  ← primary teal button
│  └───────────────────────────┘  │
│                                 │
│  ─────────── or ───────────     │
│                                 │
│  ┌───────────────────────────┐  │
│  │  G  Continue with Google  │  │
│  └───────────────────────────┘  │
│                                 │
│     Forgot password?            │
│     Create an account →         │
│                                 │
└─────────────────────────────────┘
```

---

## 15. Dashboard Screen — Wireframe Spec

```
┌─────────────────────────────────┐
│ ☰  Good morning, Rahul    [PRO] │
├─────────────────────────────────┤
│ ⭐ Pro trial · 9 days left      │  ← trial banner
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │  🕐 Not punched in          │ │
│ │                             │ │
│ │  [    Punch In    ]         │ │  ← large CTA
│ │  Face + location required   │ │
│ └─────────────────────────────┘ │
│                                 │
│  Leave Balance                  │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ 15   │ │  8   │ │  6   │    │
│  │Annual│ │ Sick │ │Casual│    │
│  └──────┘ └──────┘ └──────┘    │
│                                 │
│  Team Today                     │
│  ┌─────────────────────────────┐ │
│  │ 🟢 5 Present  🟡 2 Leave   │ │
│  │ 🔴 1 Absent               │ │
│  └─────────────────────────────┘ │
│                                 │
│  Recent Activity                │
│  • Leave approved — Jun 5       │
│  • Punched in — 9:02 AM         │
├─────────────────────────────────┤
│ 🏠  📅  🕐  👥  ⋯              │  ← bottom tabs
└─────────────────────────────────┘
```

---

## 16. Supabase Mobile Setup

1. Add redirect URL in Supabase dashboard:
   - `anshhr://auth/callback`
   - `exp://127.0.0.1:8081/--/auth/callback` (dev)

2. `app.config.ts`:
```ts
export default {
  scheme: "anshhr",
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};
```

3. Enable Realtime on `WorkspaceMessage` table in Supabase.

---

## 17. TypeScript Types (copy to mobile)

```ts
export type EmployeeRole = "Admin" | "HR Manager" | "Employee" | "Owner" | "Manager";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string;
  avatarInitials: string;
  status: "Active" | "On Leave" | "Half-day" | "Off";
  branch?: string;
  annualBalance: number;
  sickBalance: number;
  casualBalance: number;
  currentPunchIn?: string | null;
  wid?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  halfDay: boolean;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedAt: string;
}

export interface PunchRecord {
  id: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  duration: string | null;
  status: "On-time" | "Late" | "Half-day" | "Absent" | "WFH" | "Regularized";
  punchInPhoto?: string;
  punchInLat?: number;
  punchInLng?: number;
}

export interface PlanStatus {
  plan: string;
  planName: string;
  hasProAccess: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number | null;
  hasScheduledPro: boolean;
  scheduledProStartsAt: string | null;
  maxUsers: number;
  punchesUsedThisMonth: number;
  punchesLimit: number | null;
}
```

---

## 18. Quick Start Commands

```bash
# Create Expo app
npx create-expo-app@latest ansh-hr-mobile --template tabs

cd ansh-hr-mobile

# Install core deps
npx expo install @supabase/supabase-js expo-secure-store expo-camera expo-location
npm install zustand @tanstack/react-query

# Copy shared utils from web repo
# - src/lib/branch-utils.ts
# - types from src/stores/leave-store.ts

# Set env in .env
EXPO_PUBLIC_API_BASE_URL=https://your-production-url.com
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# Run
npx expo start
```

---

## 19. Notes for Production

1. **CORS:** Next.js API must allow mobile origins if calling from webview; native `fetch` has no CORS issue.
2. **Token refresh:** Listen to `supabase.auth.onAuthStateChange` and refresh `ansh_auth_token` on `TOKEN_REFRESHED`.
3. **Offline:** Cache dashboard + leave list with React Query `staleTime`; queue punch requests if offline (optional).
4. **App icons:** Use ANSH HR teal brand with house/clock motif.
5. **Deep links:** `anshhr://leave/approvals`, `anshhr://attendance/wfh` for push notification routing.

---

*This document is generated from the live ANSH HR web codebase. All API paths and behaviors match the production Next.js backend.*
