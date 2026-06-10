# ANSH HR Mobile — Auth, Signup & Onboarding Spec

**Handoff document for Antigravity / mobile developers.**  
Build React Native screens that connect to the existing ANSH HR backend.

---

## 0. Environment (mobile app)

```env
EXPO_PUBLIC_API_BASE_URL=https://your-production-domain.com
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Deep link scheme (for Google OAuth):** `anshhr://auth/callback`

Add these redirect URLs in **Supabase Dashboard → Authentication → URL Configuration**:
- `anshhr://auth/callback`
- `exp://127.0.0.1:8081/--/auth/callback` (Expo dev)

---

## 1. Full auth flow (end-to-end)

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Signup    │────▶│  Supabase   │────▶│   Onboarding     │────▶│  Dashboard  │
│  or Login   │     │  Auth JWT   │     │  POST /onboard   │     │  Main App   │
└─────────────┘     └─────────────┘     └──────────────────┘     └─────────────┘
                           │
                           ▼
                    GET /api/auth/me
                    ├─ employee exists → Dashboard
                    └─ onboardingRequired → Onboarding
```

### Token storage (mobile)

| Key | Value | When set |
|-----|-------|----------|
| `ansh_auth_token` | Supabase `session.access_token` | After login/signup/OAuth |
| `ansh_auth_session` | `"true"` | After successful auth |

Use **expo-secure-store** (not AsyncStorage) for the token.

### Every API call header

```http
Authorization: Bearer <ansh_auth_token>
Content-Type: application/json
```

---

## 2. Signup screen

### Route
`AuthStack → SignupScreen`

### UI copy
- **Title:** "Create an account"
- **Subtitle:** "Join ANSH Workspace to manage your leaves and attendance."
- **Primary CTA:** "Create ANSH HR Account"
- **Footer link:** "Already have an account? Sign in"

### Fields

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| Full Name | text | Yes | "e.g. Priya Sharma" |
| Email Address | email | Yes | "alex@example.com" |
| Password | password + show/hide | Yes | "At least 6 characters" |
| Confirm Password | password + show/hide | Yes | "Repeat password" |

### Buttons
1. **Continue with Google** (OAuth)
2. Divider: "OR"
3. **Create ANSH HR Account** (email signup form)

### Client-side validation (before API call)

| Rule | Error message |
|------|---------------|
| Name empty | "Please enter your name." |
| Passwords don't match | "Passwords do not match. Please verify your passwords." |
| Length < 6 | "Password must be at least 6 characters long." |
| No uppercase | "Password must contain at least one uppercase letter." |
| No lowercase | "Password must contain at least one lowercase letter." |
| No number | "Password must contain at least one number." |
| No special char | "Password must contain at least one special character (e.g. !, @, #, $, %, etc.)." |

Special chars accepted: `!@#$%^&*(),.?":{}|<>`

### Supabase signup API

```ts
const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password: password,
  options: {
    data: {
      full_name: name.trim(),  // used to prefill onboarding
    },
  },
});
```

### On success
1. Save `data.session.access_token` → SecureStore `ansh_auth_token`
2. Save `ansh_auth_session` = `"true"`
3. Show success: "Account created successfully! Redirecting to onboarding..."
4. Navigate → **Onboarding** (always after signup)

### Google signup

```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "anshhr://auth/callback",
    skipBrowserRedirect: true,  // mobile: open in-app browser / WebBrowser
  },
});
```

After OAuth callback → exchange session → `GET /api/auth/me` → Onboarding or Dashboard.

Show loading overlay: "Connecting with Google — Securing connection to your workspace account..."

---

## 3. Login screen

### Route
`AuthStack → LoginScreen` (default unauthenticated entry)

### UI copy
- **Title:** "Welcome back"
- **Subtitle:** "Log in to your account to manage your leaves and attendance."
- **Primary CTA:** "Sign in to Workspace"
- **Link:** "Forgot Password?"
- **Footer:** "New to ANSH? Create an account"

### Fields

| Field | Type | Required |
|-------|------|----------|
| Email Address | email | Yes |
| Password | password + show/hide | Yes |

### Supabase login API

```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password: password,
});
```

### After login — critical routing logic

```ts
const token = data.session.access_token;
await SecureStore.setItemAsync("ansh_auth_token", token);

const res = await fetch(`${API_BASE}/api/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
});
const json = await res.json();

if (json.onboardingRequired) {
  // No Employee row in database yet
  navigate("Onboarding");
} else {
  // Employee profile exists
  navigate("MainTabs"); // Dashboard
}
```

### GET /api/auth/me responses

**Not onboarded:**
```json
{
  "onboardingRequired": true,
  "email": "user@example.com"
}
```

**Onboarded:**
```json
{
  "employee": {
    "id": "uuid-from-supabase",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "role": "Admin",
    "department": "Engineering",
    "avatarInitials": "PS",
    "status": "Active",
    "annualBalance": 15,
    "sickBalance": 8,
    "casualBalance": 6,
    "branch": "Main HQ",
    "wid": 2,
    ...
  }
}
```

### Google login
Same OAuth flow as signup. After callback, same `GET /api/auth/me` routing.

### Session check on app launch

```ts
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  // Verify with /api/auth/me and route to Dashboard or Onboarding
} else {
  // Show Login
}
```

Listen for token refresh:
```ts
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "TOKEN_REFRESHED" && session) {
    SecureStore.setItemAsync("ansh_auth_token", session.access_token);
  }
  if (event === "SIGNED_OUT") {
    SecureStore.deleteItemAsync("ansh_auth_token");
  }
});
```

---

## 4. Forgot password screen

### Route
`AuthStack → ForgotPasswordScreen`

### UI copy
- **Title:** "Forgot password?"
- **Subtitle:** "Enter your workspace email and we'll send a Supabase password reset link."

### Field
| Field | Type | Required |
|-------|------|----------|
| Email | email | Yes |

### API

```ts
await supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: "anshhr://auth/reset-password",  // deep link to mobile reset screen
});
```

### On success
"Password reset link sent! Open the email from Supabase, click the link, and you will be taken to the reset password screen."

### Reset password screen
User lands via deep link with recovery token. Use:
```ts
await supabase.auth.updateUser({ password: newPassword });
```
Then navigate to Login with message: "Password updated successfully. Sign in with your new password."

---

## 5. Onboarding wizard (3 steps)

### Route
`AuthStack → OnboardingScreen`  
**Only accessible when:** user has valid Supabase session AND `GET /api/auth/me` returns `onboardingRequired: true`.

### Guard on mount

```ts
// 1. Must have session
const { data: { session } } = await supabase.auth.getSession();
if (!session) → navigate to Login

// 2. Must NOT already be onboarded
const me = await GET /api/auth/me
if (me.employee) → navigate to Dashboard

// 3. Prefill name from Supabase metadata
const name = session.user.user_metadata?.full_name
           || session.user.user_metadata?.name
           || "";
```

### Visual style
- Dark background (`#0f172a` / slate-950)
- Emerald accent buttons (`#10b981`)
- Step progress indicator on left (tablet) or top (phone)
- Brand: "ANSH HR — Workspace Onboarding"

---

### STEP 1 — Personal Profile

**Title:** "Personal Profile"  
**Description:** "Verify your pre-filled name and select your department registry."

| Field | Type | Default | Options |
|-------|------|---------|---------|
| Full Name | text | Prefilled from signup | — |
| Department Registry | picker | `"Engineering"` | Engineering, Human Resources, Product Design, Data Analytics, Executive, Marketing |

**Validation:** Name required → "Please enter your name."

**Button:** "Next Step →"

---

### STEP 2 — Account Permission Role

**Title:** "Account Permission"  
**Description:** "Assign an account permission role to determine your workspace privileges."

| Role | Label | Description | Shows Step 3? |
|------|-------|-------------|---------------|
| `Employee` | Employee | View & log time | No — submit here |
| `HR Manager` | HR Manager | Approve leaves | Yes |
| `Admin` | Admin | Full permissions | Yes |
| `Owner` | Owner | Full access & billing | Yes |

**UI:** 4 selectable role cards in a 2×2 grid. Selected card = emerald border + highlight.

**Buttons:**
- "← Back"
- Employee → **"Complete Setup →"** (submits API)
- Admin/HR/Owner → **"Next: Company Setup →"** (go to Step 3)

---

### STEP 3 — Workspace Setup (Admin / HR Manager / Owner only)

**Title:** "Workspace Details"  
**Description:** "Set up company name, scale size, and address for your organization workspace."

| Field | Type | Required | Options / Placeholder |
|-------|------|----------|----------------------|
| Company Name | text | Yes | "e.g. ANSH Solutions" |
| Company Employee Size | picker | Yes | `1-10`, `11-50`, `51-200`, `200+` |
| Company Address | textarea | Yes | "e.g. 123 Business Park, Mumbai, India" |

**Validation:**
- Company name required → "Please enter your company name."
- Company address required → "Please enter your company address."

**Buttons:** "← Back" | **"Complete Workspace Setup →"**

---

### Onboarding submit API

```http
POST /api/auth/onboard
Authorization: Bearer <token>
Content-Type: application/json
```

**Body — Employee role (2 steps only):**
```json
{
  "name": "Priya Sharma",
  "department": "Engineering",
  "role": "Employee",
  "companyName": null,
  "companyAddress": null,
  "employeeCount": null
}
```

**Body — Admin / HR Manager / Owner (3 steps):**
```json
{
  "name": "Rahul Raj",
  "department": "Executive",
  "role": "Admin",
  "companyName": "ANSH Solutions",
  "companyAddress": "123 Business Park, Mumbai, India",
  "employeeCount": "11-50"
}
```

**Success response:**
```json
{
  "employee": {
    "id": "supabase-user-uuid",
    "name": "Rahul Raj",
    "email": "rahul@example.com",
    "role": "Admin",
    "department": "Executive",
    "avatarInitials": "RR",
    "status": "Active",
    "annualBalance": 15,
    "sickBalance": 8,
    "casualBalance": 6,
    "wid": 3,
    "branch": "Main HQ",
    "companyName": "ANSH Solutions",
    "companyAddress": "123 Business Park, Mumbai, India",
    "employeeCount": "11-50"
  }
}
```

**Error responses:**
| Status | Body | Show to user |
|--------|------|--------------|
| 401 | `{ "error": "Unauthorized" }` | "Your session has expired. Please log in again." |
| 400 | `{ "error": "Missing required fields" }` | "Failed to save profile." |
| 500 | `{ "error": "Internal Server Error" }` | "An unexpected error occurred. Please try again." |

### On onboarding success
1. Keep token in SecureStore
2. Bootstrap app data: `GET /api/dashboard`, `GET /api/billing/status`
3. Navigate → **Dashboard (Main Tabs)**

---

## 6. What the backend does on onboard (important for mobile UX)

| Role | Backend action |
|------|----------------|
| **Admin / HR Manager / Owner** | Creates **new Workspace** with **14-day Pro trial** |
| **Admin / HR Manager / Owner** | Assigns first office branch (`Main HQ` or first branch in settings) |
| **Employee** | Joins default workspace `wid: 1` (no new workspace created) |
| **All roles** | Creates `Employee` row linked to Supabase user `id` |
| **All roles** | Sets leave balances: Annual 15, Sick 8, Casual 6 |

After Admin onboarding, show a one-time welcome message:
> "Your workspace is ready! You have a 14-day Pro trial with full access to all features."

---

## 7. Screen wireframes (mobile)

### Signup
```
┌────────────────────────────┐
│      [ANSH HR Logo]        │
│    Create an account       │
│  Join ANSH Workspace...    │
│                            │
│  [ G  Continue with Google]│
│         ── OR ──             │
│  FULL NAME                 │
│  ┌──────────────────────┐  │
│  │ Priya Sharma         │  │
│  └──────────────────────┘  │
│  EMAIL ADDRESS             │
│  ┌──────────────────────┐  │
│  │ alex@example.com     │  │
│  └──────────────────────┘  │
│  PASSWORD            [eye] │
│  ┌──────────────────────┐  │
│  │ ••••••••             │  │
│  └──────────────────────┘  │
│  CONFIRM PASSWORD    [eye] │
│  ┌──────────────────────┐  │
│  │ ••••••••             │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ Create ANSH HR Acct  │  │
│  └──────────────────────┘  │
│  Already have an account?  │
│  Sign in                   │
└────────────────────────────┘
```

### Onboarding Step 1
```
┌────────────────────────────┐
│ ● Step 1  ○ Step 2  ○ 3   │
│                            │
│  Personal Profile          │
│  Verify your name and      │
│  select your department    │
│                            │
│  FULL NAME                 │
│  ┌──────────────────────┐  │
│  │ 👤 Priya Sharma      │  │
│  └──────────────────────┘  │
│  * Pre-filled from signup  │
│                            │
│  DEPARTMENT REGISTRY       │
│  ┌──────────────────────┐  │
│  │ 💼 Engineering    ▼  │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │    Next Step    →    │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### Onboarding Step 2
```
┌────────────────────────────┐
│ ✓ Step 1  ● Step 2  ○ 3   │
│                            │
│  Account Permission        │
│                            │
│  ┌─────────┐ ┌─────────┐  │
│  │Employee │ │HR Mgr   │  │
│  │View+log │ │Approvals│  │
│  └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐  │
│  │ Admin   │ │ Owner   │  │
│  │Full perm│ │+Billing │  │
│  └─────────┘ └─────────┘  │
│                            │
│  [← Back]  [Complete Setup]│
│            or [Next: Co. →]│
└────────────────────────────┘
```

### Onboarding Step 3 (Admin only)
```
┌────────────────────────────┐
│ ✓ Step 1  ✓ Step 2  ● 3   │
│                            │
│  🏢 Company Workspace      │
│                            │
│  COMPANY NAME              │
│  ┌──────────────────────┐  │
│  │ ANSH Solutions       │  │
│  └──────────────────────┘  │
│  EMPLOYEE SIZE             │
│  ┌──────────────────────┐  │
│  │ 11 - 50 employees ▼  │  │
│  └──────────────────────┘  │
│  COMPANY ADDRESS           │
│  ┌──────────────────────┐  │
│  │ 123 Business Park...   │  │
│  └──────────────────────┘  │
│                            │
│  [← Back] [Complete Setup] │
└────────────────────────────┘
```

---

## 8. Navigation structure (Expo Router)

```
app/
├── (auth)/
│   ├── _layout.tsx          # Stack, no tabs
│   ├── login.tsx
│   ├── signup.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   └── onboarding.tsx       # 3-step wizard (single file or step sub-routes)
├── (app)/
│   ├── _layout.tsx          # Tabs — requires auth + onboarded
│   └── (tabs)/
│       └── index.tsx        # Dashboard
└── _layout.tsx              # Root: auth guard
```

### Root auth guard logic

```ts
function RootNavigator() {
  const [state, setState] = useState<"loading" | "auth" | "onboarding" | "app">("loading");

  useEffect(() => {
    async function resolve() {
      const token = await SecureStore.getItemAsync("ansh_auth_token");
      if (!token) return setState("auth");

      const me = await api("/api/auth/me");
      if (me.onboardingRequired) return setState("onboarding");
      return setState("app");
    }
    resolve();
  }, []);

  if (state === "loading") return <SplashScreen />;
  if (state === "auth") return <AuthStack />;
  if (state === "onboarding") return <OnboardingScreen />;
  return <MainTabs />;
}
```

---

## 9. React Native code snippets (copy-paste ready)

### Supabase client

```ts
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### API helper

```ts
// lib/api.ts
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync("ansh_auth_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json as T;
}
```

### Signup handler

```ts
async function handleSignup(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name.trim() } },
  });
  if (error) throw error;

  if (data.session?.access_token) {
    await SecureStore.setItemAsync("ansh_auth_token", data.session.access_token);
  }
  router.replace("/onboarding");
}
```

### Login handler

```ts
async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;

  const token = data.session!.access_token;
  await SecureStore.setItemAsync("ansh_auth_token", token);

  const me = await api<{ onboardingRequired?: boolean; employee?: object }>("/api/auth/me");
  router.replace(me.onboardingRequired ? "/onboarding" : "/(tabs)");
}
```

### Onboarding submit

```ts
async function submitOnboarding(form: OnboardingForm) {
  const isManagerOrAdmin = ["Admin", "HR Manager", "Owner"].includes(form.role);

  await api("/api/auth/onboard", {
    method: "POST",
    body: JSON.stringify({
      name: form.name.trim(),
      department: form.department,
      role: form.role,
      companyName: isManagerOrAdmin ? form.companyName?.trim() : null,
      companyAddress: isManagerOrAdmin ? form.companyAddress?.trim() : null,
      employeeCount: isManagerOrAdmin ? form.employeeCount : null,
    }),
  });

  router.replace("/(tabs)");
}
```

---

## 10. TypeScript types

```ts
export type EmployeeRole = "Employee" | "HR Manager" | "Admin" | "Owner" | "Manager";

export interface OnboardingForm {
  name: string;
  department: string;
  role: EmployeeRole;
  companyName?: string;
  companyAddress?: string;
  employeeCount?: "1-10" | "11-50" | "51-200" | "200+";
}

export interface AuthMeResponse {
  onboardingRequired?: boolean;
  email?: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    role: EmployeeRole;
    department: string;
    avatarInitials: string;
    branch?: string;
    wid: number;
    annualBalance: number;
    sickBalance: number;
    casualBalance: number;
  };
}
```

---

## 11. Checklist for Antigravity

### Signup
- [ ] Full name, email, password, confirm password fields
- [ ] Password rules validation (6+ chars, upper, lower, number, special)
- [ ] Google OAuth button with loading overlay
- [ ] `supabase.auth.signUp` with `full_name` metadata
- [ ] Save token → navigate to Onboarding

### Login
- [ ] Email + password with show/hide toggle
- [ ] Forgot password link
- [ ] Google OAuth
- [ ] `GET /api/auth/me` after login to decide route
- [ ] Token refresh listener

### Onboarding
- [ ] Session guard (redirect if no token)
- [ ] Skip if already onboarded (`employee` exists in `/api/auth/me`)
- [ ] Prefill name from `user_metadata.full_name`
- [ ] Step 1: name + department picker
- [ ] Step 2: role selector (4 cards)
- [ ] Step 3: company fields (Admin/HR/Owner only)
- [ ] `POST /api/auth/onboard` on final submit
- [ ] Navigate to Dashboard on success

### Post-onboarding
- [ ] Call `GET /api/dashboard` to load app state
- [ ] Call `GET /api/billing/status` for trial/plan badge
- [ ] Show trial welcome if `isTrialActive === true`

---

## 12. Related web source files (reference)

| Feature | Web file |
|---------|----------|
| Signup UI | `src/app/signup/page.tsx` |
| Login UI | `src/app/login/page.tsx` |
| Onboarding UI | `src/app/onboarding/page.tsx` |
| Onboard API | `src/app/api/auth/onboard/route.ts` |
| Auth check API | `src/app/api/auth/me/route.ts` |
| Google OAuth complete | `src/app/auth/complete/page.tsx` |
| OAuth callback | `src/app/auth/callback/route.ts` |
| Forgot password | `src/app/forgot-password/page.tsx` |
| Supabase client | `src/lib/supabase/client.ts` |
| Workspace trial creation | `src/lib/billing/workspace-billing.ts` |

---

*Backend base URL: use the deployed ANSH HR Next.js app. All auth is Supabase; all profile data is Prisma/PostgreSQL via `/api/auth/onboard`.*
