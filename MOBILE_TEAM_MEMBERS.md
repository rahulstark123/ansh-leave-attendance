# ANSH HR Mobile — Add / Edit Team Member Spec

**Handoff for Antigravity / mobile developers.**  
3-step wizard modals for adding and editing workspace team members, plus dropdown option creation.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Team Directory** (`/team`) |
| Modals | Add Member, Edit Member, Add New Option (nested) |
| Primary APIs | `GET/POST /api/employees`, `PATCH/DELETE /api/employees/[id]` |
| Dropdown APIs | `GET /api/settings`, `GET /api/settings/shift`, `GET /api/settings/designation` |
| Free plan limit | **3 team members** per workspace |
| Pro / Trial | Up to **100** team members |

Both Add and Edit use the **same 3-step wizard layout** with a horizontal stepper:

1. **Personal Info**
2. **Job Info**
3. **Emergency Info**

---

## 1. Who can do what

### Add Member button (UI)

Visible only when logged-in user role is one of:

- `Admin`
- `Owner`
- `Manager`
- `HR Manager`

### Edit member (API `PATCH`)

Allowed if any of:

| Actor | Can edit |
|-------|----------|
| **Self** | `name`, `phoneNumber`, `personalEmail`, `dateOfBirth`, `emergencyContactName`, `emergencyContactPhone`, `bloodGroup` only |
| **Admin / Owner / HR Manager** | All fields (except email — not changeable) |
| **Reporting Manager** of target | All HR fields (name match, case-insensitive) |
| **Reporting HR** of target | All HR fields (name match, case-insensitive) |

### Delete member (API `DELETE`)

Allowed if:

- `Admin` or `Owner`, **or**
- Logged-in user's name matches target's `reportingManager` or `reportingHR` (case-insensitive)

> Note: `HR Manager` role alone cannot delete unless they are the designated reporting HR for that employee.

---

## 2. Modal shell (shared layout)

Both Add and Edit modals share this structure:

```
┌──────────────────────────────────────────────────────┐
│  [Icon] ADD WORKSPACE MEMBER / EDIT MEMBER DETAILS  ✕│
├──────────────────────────────────────────────────────┤
│  (1) Personal Info ─── (2) Job Info ─── (3) Emergency│
│       [active]              [pending]        [pending]│
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Step content — scrollable max ~70vh]               │
│                                                      │
│  [Error banner if validation/API fails]              │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [ Cancel / Back ]          [ Next / Save / Add ]    │
└──────────────────────────────────────────────────────┘
```

### Stepper behavior

| State | Circle style |
|-------|--------------|
| Current step | Primary color, ring highlight |
| Completed step | Green circle with checkmark |
| Future step | Gray circle with step number |

Connector line between steps fills green as steps complete.

### Modal styling

- Full-screen overlay: `bg-black/60` + backdrop blur
- Card: `max-w-2xl`, rounded, shadow
- Labels: `10px` uppercase bold, slate-500
- Inputs: `rounded-2xl`, border, `text-xs`, focus primary border
- Footer buttons: 2-column grid — ghost Cancel/Back + primary Next/Save

---

## 3. Add Member Modal

### Header

- Icon: `UserCheck`
- Title: **Add Workspace Member**

### Step 1 — Personal Information

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | text | Yes | `name` |
| Work Email Address | email | Yes | Creates Supabase login; stored lowercase |
| Login Password | password | Yes | Min 6 characters |
| Confirm Password | password | Yes | Must match password |
| Phone Number | phone (intl) | No | Default country `IN`; E.164 format |
| Personal Email | email | No | Validated if provided |
| Date of Birth | date | No | `YYYY-MM-DD` |

**Helper text under passwords:**
> Share this password with the member so they can log in using their work email.

**Step 1 validation (`validateStep1(requirePassword: true)`):**

```ts
if (!name.trim()) return "Full Name is required.";
if (!email.trim()) return "Work Email is required.";
if (!emailRegex.test(email)) return "Please enter a valid work email address.";
if (personalEmail && !emailRegex.test(personalEmail)) return "Please enter a valid personal email address.";
if (!password) return "Login password is required.";
if (password.length < 6) return "Password must be at least 6 characters.";
if (password !== confirmPassword) return "Passwords do not match.";
```

**Footer:** `Cancel` | `Next`

---

### Step 2 — Job Details

| Field | Type | Required | Source |
|-------|------|----------|--------|
| Employee ID / Code | text | No | e.g. `ANSH-085` |
| Joining Date | date | No | |
| Job Title / Designation | select + add new | No | `GET /api/settings/designation` |
| Employment Type | select + add new | Yes | Default: `Full-time` |
| Department | select + add new | Yes | Default: `Engineering` |
| System Role | select | Yes | Default: `Employee` |
| Roster Status | select + add new | Yes | Default: `Active` |
| Reporting Manager | select | No | Other employees (excludes self) |
| Reporting HR | select | No | Employees with role HR Manager / Admin / Owner |
| Work Location | select | Yes | Default: `Remote` |
| Roster Shift | select + add new | No | Filtered by selected branch |
| Office Branch | select + add new | No | From `GET /api/settings` → `branches` |

**Default dropdown values (hardcoded in web, use same on mobile):**

```ts
departments: ["Engineering", "Human Resources", "Product Design", "Data Analytics", "Executive"]
roles: ["Employee", "Manager", "HR Manager", "Admin", "Owner"]
statuses: ["Active", "On Leave", "Half-day", "Off"]
employmentTypes: ["Full-time", "Part-time", "Contract", "Intern"]
workLocations: ["Remote", "On-site", "Hybrid", "Out of Office"]
bloodGroups: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
```

**Shift filtering:** Show shifts where `shift.branchId === "All"` OR `shift.branchId === selectedBranchName`.

**Footer:** `Back` | `Next`

---

### Step 3 — Emergency Information

| Field | Type | Required |
|-------|------|----------|
| Emergency Contact Name | text | No |
| Emergency Contact Phone | tel | No |
| Blood Group | select | No |

**Footer:** `Back` | **Add Member** (primary, shows spinner "Adding..." while loading)

On success: close modal, reset form, refresh employee list.

---

### Add Member wireframe (Step 1)

```
┌─────────────────────────────────────────┐
│  👤 ADD WORKSPACE MEMBER              ✕ │
├─────────────────────────────────────────┤
│  ● Personal Info ─── 2 Job ─── 3 Emerg │
├─────────────────────────────────────────┤
│  PERSONAL INFORMATION                   │
│                                         │
│  Full Name *          Work Email *      │
│  [John Doe        ]   [john@co.com   ]  │
│                                         │
│  Login Password *     Confirm Password *│
│  [••••••••       ]   [••••••••       ]  │
│  Share this password with the member... │
│                                         │
│  Phone Number         Personal Email    │
│  [+91 ...         ]   [personal@...  ]  │
│                                         │
│  Date of Birth                          │
│  [2020-01-15      ]                     │
├─────────────────────────────────────────┤
│  [ Cancel ]              [ Next → ]     │
└─────────────────────────────────────────┘
```

---

## 4. Edit Member Modal

### Header

- Icon: `Pencil`
- Title: **Edit Member Details**

### Differences from Add

| Aspect | Add | Edit |
|--------|-----|------|
| Email field | Editable work email | **Read-only** (disabled gray input) |
| Password fields | Required | **Not shown** |
| Submit button | "Add Member" | "Save Details" |
| API | `POST /api/employees` | `PATCH /api/employees/{id}` |
| Pre-fill | Empty / defaults | Loaded from selected employee |

### Opening edit modal

When user taps Edit on a team card or detail drawer:

```ts
setSelectedEmp(emp);
setName(emp.name);
setEmail(emp.email);           // read-only in UI
setDepartment(emp.department);
setRole(emp.role);
setStatus(emp.status);
setEmployeeCode(emp.employeeCode || "");
setPhoneNumber(emp.phoneNumber || "");
setJoiningDate(emp.joiningDate || "");
setDesignation(emp.designation || "");
setEmploymentType(emp.employmentType || "Full-time");
setReportingManager(emp.reportingManager || "");
setReportingHR(emp.reportingHR || "");
setWorkLocation(emp.workLocation || "Remote");
setRosterShift(emp.rosterShift || "");
setBranch(emp.branch || "");
setPersonalEmail(emp.personalEmail || "");
setDateOfBirth(emp.dateOfBirth || "");
setEmergencyContactName(emp.emergencyContactName || "");
setEmergencyContactPhone(emp.emergencyContactPhone || "");
setBloodGroup(emp.bloodGroup || "");
setEditCurrentStep(1);
```

Steps 1–3 fields are **identical** to Add (minus password fields in step 1).

**Step 1 validation:** Same as Add but **without** password checks.

**Footer on step 3:** `Back` | **Save Details** (spinner: "Saving...")

---

## 5. Add New Option Modal (nested)

Opened from any `CustomSelect` with **"Add New …"** action.

### Supported fields

| `addOptionField` | Modal title | Persistence |
|------------------|-------------|-------------|
| `designation` | Add New Designation | `POST /api/settings/designation` |
| `employmentType` | Add New Employment Type | Local list only (session) |
| `department` | Add New Department | Local list only |
| `role` | Add New System Role | Local list only |
| `status` | Add New Roster Status | Local list only |
| `workLocation` | Add New Work Location | Local list only |
| `rosterShift` | Add New Roster Shift | Local list only* |
| `branch` | Add New Office Branch | Local list only* |

\* For full persistence of shifts/branches, use `POST /api/settings/shift` or `POST /api/settings` with updated `branches` array (Admin/HR/Owner only). Web currently adds these locally in the team form for quick UX.

### Wireframe

```
┌─────────────────────────────────┐
│  ⊕ ADD NEW DEPARTMENT         ✕ │
├─────────────────────────────────┤
│  Name                           │
│  [Enter new option name      ]  │
├─────────────────────────────────┤
│  [ Cancel ]        [ Add ]      │
└─────────────────────────────────┘
```

### Create designation (API)

```http
POST /api/settings/designation
Content-Type: application/json
Authorization: Bearer <token>

{ "name": "Senior Product Designer" }
```

**Response:**
```json
{
  "designation": {
    "id": "clx...",
    "name": "Senior Product Designer",
    "wid": 1
  }
}
```

---

## 6. APIs

Base: `{API_BASE_URL}/api`  
Header: `Authorization: Bearer <token>`

---

### 6.1 List team members

```http
GET /api/employees
```

**Response:**
```json
{
  "employees": [
    {
      "id": "uuid-from-supabase",
      "name": "Priya Sharma",
      "email": "priya@company.com",
      "role": "Employee",
      "department": "Engineering",
      "avatarInitials": "PS",
      "status": "Active",
      "annualBalance": 15,
      "sickBalance": 8,
      "casualBalance": 6,
      "wid": 1,
      "employeeCode": "ANSH-042",
      "phoneNumber": "+919876543210",
      "joiningDate": "2024-03-01",
      "designation": "Software Engineer",
      "employmentType": "Full-time",
      "reportingManager": "Rahul Raj",
      "reportingHR": "Anita Verma",
      "workLocation": "Hybrid",
      "branch": "Main HQ",
      "rosterShift": "General Shift",
      "personalEmail": "priya.personal@gmail.com",
      "dateOfBirth": "1995-06-15",
      "emergencyContactName": "Raj Sharma",
      "emergencyContactPhone": "+919999888877",
      "bloodGroup": "B+",
      "facePhotos": [],
      "faceEmbedding": []
    }
  ]
}
```

**Mobile mapping for leave balance:**
```ts
leaveBalance: {
  Annual: emp.annualBalance,
  Sick: emp.sickBalance,
  Casual: emp.casualBalance,
}
```

Also available via `GET /api/dashboard` → `employees` array (same shape).

---

### 6.2 Add team member

```http
POST /api/employees
Content-Type: application/json
```

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "secure123",
  "department": "Engineering",
  "role": "Employee",
  "status": "Active",
  "employeeCode": "ANSH-100",
  "phoneNumber": "+919876543210",
  "joiningDate": "2026-06-10",
  "designation": "Software Engineer",
  "employmentType": "Full-time",
  "reportingManager": "Jane Manager",
  "reportingHR": "HR Person",
  "workLocation": "Hybrid",
  "branch": "Main HQ",
  "rosterShift": "General Shift",
  "personalEmail": "john.personal@gmail.com",
  "dateOfBirth": "1998-01-20",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+919988776655",
  "bloodGroup": "O+"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | |
| `email` | Yes | Unique; creates Supabase auth user |
| `password` | Yes | Min 6 chars |
| `department` | Yes | |
| `role` | Yes | |
| All others | No | Empty strings stored as `null` |

**Success:** `201` — `{ "employee": { ...full record } }`

**What happens server-side:**
1. Checks workspace team count vs plan limit
2. Creates Supabase Auth user (`email_confirm: true`)
3. Employee `id` = Supabase user UUID
4. Seeds leave balances from system settings (annual/sick/casual defaults)
5. Generates `avatarInitials` from name

**Errors:**

| Status | Code / Error | Action |
|--------|--------------|--------|
| 400 | `Missing required fields` | Show validation |
| 400 | `Password is required and must be at least 6 characters` | Step 1 |
| 400 | `Employee with this email already exists` | Step 1 |
| 403 | `TEAM_LIMIT_REACHED` | Show upgrade modal |
| 400 | Supabase error message | e.g. weak password |

**Team limit error:**
```json
{
  "error": "Free plan allows up to 3 team members. Upgrade to Pro to add more.",
  "code": "TEAM_LIMIT_REACHED"
}
```

---

### 6.3 Update team member

```http
PATCH /api/employees/{employeeId}
Content-Type: application/json
```

**Request body (send all edited fields):**
```json
{
  "name": "John Doe",
  "department": "Engineering",
  "role": "Employee",
  "status": "Active",
  "employeeCode": "ANSH-100",
  "phoneNumber": "+919876543210",
  "joiningDate": "2026-06-10",
  "designation": "Senior Software Engineer",
  "employmentType": "Full-time",
  "reportingManager": "Jane Manager",
  "reportingHR": "HR Person",
  "workLocation": "On-site",
  "branch": "Mumbai Office",
  "rosterShift": "Morning Shift",
  "personalEmail": "john.personal@gmail.com",
  "dateOfBirth": "1998-01-20",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+919988776655",
  "bloodGroup": "O+"
}
```

> **Email is NOT patchable.** Do not send `email` in PATCH body.

**HR-only extra fields** (Admin/HR editing others):
```json
{
  "annualBalance": 15,
  "sickBalance": 8,
  "casualBalance": 6
}
```

**Success:** `{ "employee": { ...updated } }`

**Errors:**

| Status | Error |
|--------|-------|
| 401 | Unauthorized |
| 403 | Forbidden (wrong role / cross-workspace) |
| 404 | Employee not found |
| 400 | No fields to update |

---

### 6.4 Delete team member

```http
DELETE /api/employees/{employeeId}
```

**Success:**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

**Delete confirmation UI (web):** User must type the employee's email exactly to enable Delete button.

---

### 6.5 Dropdown data APIs

#### Branches

```http
GET /api/settings
```

```json
{
  "settings": {
    "branches": [
      { "id": "branch-1", "name": "Main HQ", "address": "Mumbai, India" }
    ],
    "leaveSettings": { ... },
    "attendanceSettings": { ... }
  }
}
```

#### Shifts

```http
GET /api/settings/shift
```

```json
{
  "shifts": [
    {
      "id": "clx...",
      "name": "General Shift",
      "startTime": "09:00 AM",
      "endTime": "06:00 PM",
      "gracePeriod": 15,
      "workingHours": 9,
      "branchId": "All",
      "wid": 1
    }
  ]
}
```

#### Designations

```http
GET /api/settings/designation
```

```json
{
  "designations": [
    { "id": "clx...", "name": "Software Engineer", "wid": 1 }
  ]
}
```

**Load all dropdowns on Team screen mount** (parallel fetch):

```ts
const [settingsRes, shiftRes, designationRes] = await Promise.all([
  fetch("/api/settings"),
  fetch("/api/settings/shift"),
  fetch("/api/settings/designation"),
]);
```

---

## 7. CustomSelect component behavior

Each dropdown in the form uses a searchable select with:

- Label (uppercase small)
- Placeholder
- `required` asterisk where applicable
- Optional **"Add New …"** row at bottom → opens Add Option modal
- `description` subtext for manager/HR options (shows designation or role)
- `description` for branch (address) and shift (`09:00 AM - 06:00 PM`)

### Manager options

```ts
employees
  .filter(emp => emp.name !== currentName && emp.id !== selectedEmpId)
  .map(emp => ({ value: emp.name, label: emp.name, description: emp.designation || emp.role }))
```

### HR options

```ts
employees
  .filter(emp =>
    (emp.role === "HR Manager" || emp.role === "Admin" || emp.role === "Owner") &&
    emp.name !== currentName &&
    emp.id !== selectedEmpId
  )
```

---

## 8. React Native implementation

### Recommended packages

```
react-native-phone-number-input   — or libphonenumber-js
@react-native-community/datetimepicker — DOB / joining date
```

### Team screen entry point

```tsx
// Show Add Member FAB/button only for authorized roles
const canManageTeam = ["Admin", "Owner", "Manager", "HR Manager"].includes(currentUser.role);

{canManageTeam && (
  <Button onPress={() => { resetForm(); setAddModalOpen(true); }}>
    Add Member
  </Button>
)}
```

### Add member submit

```ts
async function handleAddMember(form: AddMemberForm) {
  const err = validateStep1(form, true);
  if (err) throw new Error(err);

  const res = await api("/api/employees", {
    method: "POST",
    body: JSON.stringify({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      department: form.department,
      role: form.role,
      status: form.status,
      employeeCode: form.employeeCode.trim(),
      phoneNumber: form.phoneNumber?.trim() || "",
      joiningDate: form.joiningDate,
      designation: form.designation.trim(),
      employmentType: form.employmentType,
      reportingManager: form.reportingManager.trim(),
      reportingHR: form.reportingHR.trim(),
      workLocation: form.workLocation,
      branch: form.branch,
      rosterShift: form.rosterShift,
      personalEmail: form.personalEmail.trim().toLowerCase(),
      dateOfBirth: form.dateOfBirth,
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
      bloodGroup: form.bloodGroup || null,
    }),
  });

  await refreshEmployees();
  return res.employee;
}
```

### Edit member submit

```ts
async function handleEditMember(employeeId: string, form: EditMemberForm) {
  const res = await api(`/api/employees/${employeeId}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: form.name.trim(),
      department: form.department,
      role: form.role,
      status: form.status,
      employeeCode: form.employeeCode.trim(),
      phoneNumber: form.phoneNumber?.trim() || "",
      joiningDate: form.joiningDate,
      designation: form.designation.trim(),
      employmentType: form.employmentType,
      reportingManager: form.reportingManager.trim(),
      reportingHR: form.reportingHR.trim(),
      workLocation: form.workLocation,
      branch: form.branch,
      rosterShift: form.rosterShift,
      personalEmail: form.personalEmail.trim().toLowerCase(),
      dateOfBirth: form.dateOfBirth,
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
      bloodGroup: form.bloodGroup || null,
    }),
  });

  await refreshEmployees();
  return res.employee;
}
```

### Wizard navigation state

```ts
type WizardStep = 1 | 2 | 3;

const [step, setStep] = useState<WizardStep>(1);

// Step 1 → validate → setStep(2)
// Step 2 → setStep(3)  (no extra validation on web)
// Step 3 → submit API
```

### Self-edit mode (Profile)

If current user edits their own profile via PATCH, **hide Step 2 job fields** or disable them — API will ignore those fields anyway. Show only:

- Step 1: name, phone, personal email, DOB (email read-only)
- Step 3: emergency contact + blood group

---

## 9. TypeScript types

```ts
export type EmployeeRole = "Admin" | "HR Manager" | "Employee" | "Owner" | "Manager";
export type EmployeeStatus = "Active" | "On Leave" | "Half-day" | "Off";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string;
  avatarInitials: string;
  status: EmployeeStatus;
  annualBalance: number;
  sickBalance: number;
  casualBalance: number;
  employeeCode?: string | null;
  phoneNumber?: string | null;
  joiningDate?: string | null;
  designation?: string | null;
  employmentType?: string | null;
  reportingManager?: string | null;
  reportingHR?: string | null;
  workLocation?: string | null;
  branch?: string | null;
  rosterShift?: string | null;
  personalEmail?: string | null;
  dateOfBirth?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bloodGroup?: string | null;
}

export interface AddMemberPayload {
  name: string;
  email: string;
  password: string;
  department: string;
  role: string;
  status: string;
  employeeCode?: string;
  phoneNumber?: string;
  joiningDate?: string;
  designation?: string;
  employmentType?: string;
  reportingManager?: string;
  reportingHR?: string;
  workLocation?: string;
  branch?: string;
  rosterShift?: string;
  personalEmail?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string | null;
}

export interface EditMemberPayload extends Omit<AddMemberPayload, "email" | "password"> {}
```

---

## 10. Plan limits UI

On Team screen header (Free plan):

```
Team members: 2 / 3
[Upgrade to add more]
```

From `GET /api/billing/status`:
```json
{
  "teamCount": 2,
  "maxUsers": 3,
  "hasProAccess": false
}
```

If `maxUsers` is `100` or `hasProAccess` is true → hide or show "Unlimited".

Block Add Member when at limit; handle `TEAM_LIMIT_REACHED` from API as fallback.

---

## 11. Error handling

| Scenario | User message |
|----------|--------------|
| Validation fail step 1 | Inline red banner in modal |
| Duplicate email | `"Employee with this email already exists"` |
| Team limit | Upgrade modal with Pro CTA |
| Forbidden edit | `"You are not authorized to edit this employee"` |
| Network error | `"Failed to add/update employee. Please try again."` |

Show errors in rose/red banner at top of modal content:

```
┌─────────────────────────────────────┐
│ ⚠ Passwords do not match.           │
└─────────────────────────────────────┘
```

---

## 12. Screen map (mobile)

```
Team Tab
├── Search bar
├── Filters (All / My Team, status chips)
├── Member cards list
│   ├── Tap card → Detail drawer
│   └── Edit icon → Edit Member modal (3-step)
├── Add Member button → Add modal (3-step)
│   └── CustomSelect "Add New" → Add Option modal
└── Delete (from detail) → Confirm email modal
```

---

## 13. Checklist for Antigravity

### Data loading
- [ ] `GET /api/employees` on Team tab mount
- [ ] Parallel load: settings (branches), shifts, designations
- [ ] Build manager/HR dropdowns from employee list

### Add Member modal
- [ ] 3-step stepper UI
- [ ] Step 1: name, email, password, confirm, phone, personal email, DOB
- [ ] Step 1 validation before Next
- [ ] Step 2: all job fields + CustomSelects
- [ ] Step 3: emergency contact + blood group
- [ ] `POST /api/employees` on final submit
- [ ] Handle `TEAM_LIMIT_REACHED`
- [ ] Refresh list on success

### Edit Member modal
- [ ] Pre-fill all fields from selected employee
- [ ] Email read-only in step 1
- [ ] No password fields
- [ ] `PATCH /api/employees/{id}` on save
- [ ] Respect self-edit field restrictions

### Add Option modal
- [ ] Designation → `POST /api/settings/designation`
- [ ] Other fields → local list append (match web behavior)

### Permissions
- [ ] Hide Add for non Admin/Owner/Manager/HR Manager
- [ ] Hide Edit/Delete based on role rules

### UX
- [ ] Loading spinners on submit
- [ ] Error banner in modal
- [ ] Reset form on close
- [ ] Phone input with country code (default IN)

---

## 14. Web source files (reference)

| Feature | File |
|---------|------|
| Team page + all modals | `src/app/(app)/team/page.tsx` |
| Add employee API | `src/app/api/employees/route.ts` |
| Edit/delete API | `src/app/api/employees/[id]/route.ts` |
| Designations API | `src/app/api/settings/designation/route.ts` |
| Shifts API | `src/app/api/settings/shift/route.ts` |
| Branches (settings) | `src/app/api/settings/route.ts` |
| Employee type | `src/stores/leave-store.ts` |
| Custom select | `src/components/ui/custom-select.tsx` |

---

*New members receive a Supabase account immediately (`email_confirm: true`). Share the temporary password securely; they can change it later via Supabase password reset if enabled.*
