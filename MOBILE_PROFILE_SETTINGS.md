# ANSH HR Mobile — Profile Settings Spec

**Handoff for Antigravity / mobile developers.**  
Technical spec for implementing the Profile Settings screen, editable personal fields, and read-only employment parameters on the React Native mobile client.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Profile Settings** (`/settings/profile` inside settings stack) |
| Read API | `GET /api/profile` (returns `{ profile: Employee, faceEnrolled: boolean }`) |
| Write API | `PATCH /api/profile` (personal field modifications) |
| Core Flow | View Summary ➜ Edit Personal Coordinates ➜ Read Professional Status |

---

## 1. Profile Field Specifications

The user profile split-mode separates self-editable parameters from corporate HR parameters (which are read-only for employees).

### 1.1 Editable Personal Fields (PATCH payload)
The following fields can be updated by the logged-in user:

| Field Name | Input Type | Validation Rules | Description |
|------------|------------|------------------|-------------|
| `name` | Text Input | Required, String | Triggers `avatarInitials` update on the backend. |
| `dateOfBirth` | Date Picker | Optional, `"YYYY-MM-DD"` | Employee date of birth. |
| `phoneNumber` | Phone Input | Optional, International format | Mobile phone contact. |
| `personalEmail` | Email Input | Optional, Valid email format | Primary personal contact email. |
| `emergencyContactName` | Text Input | Optional, String | Name of emergency contact person. |
| `emergencyContactPhone`| Phone Input | Optional, International format | Phone of emergency contact. |
| `bloodGroup` | Select Input | Optional, List matching blood types | e.g. A+, B-, O+, AB-. |

### 1.2 Read-Only Professional Parameters
These parameters are retrieved via `GET /api/profile` but must remain locked in the UI (read-only):

| Field Name | Visual Widget | Value Example |
|------------|---------------|---------------|
| `employeeCode` | Badge Card | `"ANSH-042"` |
| `designation` | Text Label | `"Senior Software Engineer"` |
| `department` | Text Label | `"Engineering"` |
| `branch` | Text Label | `"Main HQ"` |
| `reportingManager` | Text Label | `"Priya Nair"` |
| `reportingHR` | Text Label | `"Sunita Sen"` |
| `employmentType` | Badge Pill | `"Full-time"` |
| `workLocation` | Badge Pill | `"Hybrid"` |
| `joiningDate` | Text Label | `"2025-06-01"` |
| `role` | Text Label | `"Employee"` (or `Manager`, `HR Manager`, `Admin`) |
| `email` | Locked Input | `"login@company.com"` (Locked auth identifier) |

---

## 2. API Reference

All requests require user authorization: `Authorization: Bearer <ansh_auth_token>`.

### 2.1 Retrieve Employee Profile (`GET /api/profile`)
* **Response (200 OK):**
  ```json
  {
    "profile": {
      "id": "emp_123",
      "name": "Rahul Raj",
      "email": "rahul.raj@mycompany.com",
      "role": "Employee",
      "department": "Engineering",
      "avatarInitials": "RR",
      "phoneNumber": "+919999988888",
      "personalEmail": "rahul.raj.personal@gmail.com",
      "dateOfBirth": "1997-05-12",
      "emergencyContactName": "Aarav Raj",
      "emergencyContactPhone": "+919999977777",
      "bloodGroup": "O+",
      "employeeCode": "ANSH-042",
      "designation": "Senior Engineer",
      "employmentType": "Full-time",
      "workLocation": "Hybrid",
      "branch": "Main HQ",
      "reportingManager": "Priya Nair",
      "reportingHR": "Sunita Sen",
      "joiningDate": "2025-06-01"
    },
    "faceEnrolled": true,
    "hasFacePhotos": true,
    "facePhotos": ["url1", "url2", "url3"]
  }
  ```

### 2.2 Update Profile Info (`PATCH /api/profile`)
* **Request Body:** Contains any subset of the editable parameters.
  ```json
  {
    "name": "Rahul Kumar Raj",
    "phoneNumber": "+919999988888",
    "personalEmail": "new.personal@gmail.com",
    "dateOfBirth": "1997-05-12",
    "emergencyContactName": "Aarav Raj",
    "emergencyContactPhone": "+919999977777"
  }
  ```
* **Response (200 OK):** Returns `{ profile: Employee }` containing updated attributes.

---

## 3. UI Layout Recommendations

```
┌──────────────────────────────────────────┐
│  [RR] Rahul Kumar Raj                    │
│  Senior Engineer                         │
│  Branch: MAIN HQ • Code: ANSH-042        │
├──────────────────────────────────────────┤
│  📷 Face Biometrics        [ Enrolled > ]│
├──────────────────────────────────────────┤
│  📝 IDENTITY DETAILS                     │
│  Full Name                               │
│  [ Rahul Kumar Raj                     ] │
│                                          │
│  📝 CONTACT COORDINATES                  │
│  Phone Number                            │
│  [ +91 99999 88888                     ] │
│                                          │
│  🔒 PROFESSIONAL DETAILS (LOCKED)        │
│  Department: Engineering                 │
│  Reporting Manager: Priya Nair           │
└──────────────────────────────────────────┘
```

### UX Guidelines:
* **Facial Scan Row:** Place a high-priority row below the profile summary linking to `/settings/face-enroll` displaying the current enrollment state (`"Enrolled"` or `"Not Configured"`).
* **Locked Field Styles:** Set locked professional parameters to opacity `0.6` with lock icons or container backgrounds (e.g. `colors.border` matching `#e2e8f0` background) to convey that edits must be submitted through HR.
* **Save CTA:** Place a floating or footer-anchored action button labeled *"Save Profile Details"*.
