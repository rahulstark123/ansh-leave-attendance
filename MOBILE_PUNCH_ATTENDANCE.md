# ANSH HR Mobile — Punch In / Punch Out Spec

**Handoff for Antigravity / mobile developers.**  
Attendance clock with face verification, GPS location, and punch history.

---

## 0. Overview

| Item | Value |
|------|-------|
| Primary screen | **Dashboard** punch card + **Attendance Logs** list |
| APIs | `/api/attendance/punch`, `/api/employee/face-verify`, `/api/employee/face-enroll` |
| Requirements | Face enrolled (3 photos) + camera + location permission |
| Free plan limit | **50 punch-ins per month** per workspace |
| Pro / Trial | Unlimited punch-ins |

---

## 1. Full punch flow (end-to-end)

```
User taps "Punch In" or "Punch Out"
        ↓
Is face enrolled? (faceEnrolled === true)
   NO → Show "Face Scan Required" → Go to Profile Face Setup
   YES ↓
Open Face Scan modal
   ├── Request camera permission
   ├── Request GPS location (background)
   ├── User taps "Capture & Verify"
   ├── POST /api/employee/face-verify { selfie: base64 }
   │      matched? → continue
   │      failed?  → retry
   ↓
POST /api/attendance/punch
   { action: "punch-in"|"punch-out", selfie, lat, lng }
        ↓
Update UI (timer, badge, history)
```

---

## 2. APIs

Base: `{API_BASE_URL}/api`  
Header: `Authorization: Bearer <token>`

---

### 2.1 Get punch state + history

```http
GET /api/attendance/punch
```

**Also available via** `GET /api/dashboard` → `currentPunchIn`, `punchHistory`, `faceEnrolled`

**Response:**
```json
{
  "currentPunchIn": "2026-06-10T09:02:15.000Z",
  "currentPunchInPhoto": "https://.../punches/user-id/...jpg",
  "currentPunchInLat": 19.076,
  "currentPunchInLng": 72.8777,
  "faceEnrolled": true,
  "punchHistory": [
    {
      "id": "clx...",
      "date": "2026-06-10",
      "punchIn": "09:02 AM",
      "punchOut": "06:12 PM",
      "duration": "9h 10m",
      "status": "On-time",
      "employeeId": "user-uuid",
      "punchInPhoto": "https://...",
      "punchOutPhoto": "https://...",
      "punchInLat": 19.076,
      "punchInLng": 72.8777,
      "punchOutLat": 19.077,
      "punchOutLng": 72.878
    }
  ]
}
```

**State rules:**
| Field | Meaning |
|-------|---------|
| `currentPunchIn` | ISO timestamp if currently punched in, else `null` |
| `punchOut: null` on latest record | Shift still active |
| `faceEnrolled` | `true` if 3 face photos + 128D embedding exist |

---

### 2.2 Punch in

```http
POST /api/attendance/punch
Content-Type: application/json
```

```json
{
  "action": "punch-in",
  "selfie": "data:image/jpeg;base64,/9j/4AAQ...",
  "lat": 19.076,
  "lng": 72.8777
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `action` | string | Yes | `"punch-in"` |
| `selfie` | string | Recommended | Base64 JPEG with or without `data:image/jpeg;base64,` prefix |
| `lat` | number | No | GPS latitude; server falls back to IP geolocation |
| `lng` | number | No | GPS longitude |

**Success response:**
```json
{
  "punchRecord": {
    "id": "clx...",
    "date": "2026-06-10",
    "punchIn": "09:02 AM",
    "punchOut": null,
    "duration": null,
    "status": "On-time",
    "punchInPhoto": "https://...",
    "punchInLat": 19.076,
    "punchInLng": 72.8777
  },
  "currentPunchIn": "2026-06-10T09:02:15.000Z",
  "currentPunchInPhoto": "https://...",
  "currentPunchInLat": 19.076,
  "currentPunchInLng": 72.8777,
  "status": "Active"
}
```

**Errors:**
| Status | Code / Error | Meaning |
|--------|--------------|---------|
| 400 | `"Already punched in"` | User already has active punch |
| 403 | `PUNCH_LIMIT_REACHED` | Free plan monthly limit (50) hit |
| 403 | `punchesUsed`, `punchesLimit` in body | Show upgrade prompt |

**Punch limit error body:**
```json
{
  "error": "Free plan allows 50 punch-ins per month. Upgrade to Pro for unlimited attendance.",
  "code": "PUNCH_LIMIT_REACHED",
  "punchesUsed": 50,
  "punchesLimit": 50
}
```

---

### 2.3 Punch out

```http
POST /api/attendance/punch
```

```json
{
  "action": "punch-out",
  "selfie": "data:image/jpeg;base64,...",
  "lat": 19.077,
  "lng": 72.878
}
```

**Success response:**
```json
{
  "punchRecord": {
    "id": "clx...",
    "date": "2026-06-10",
    "punchIn": "09:02 AM",
    "punchOut": "06:12 PM",
    "duration": "9h 10m",
    "status": "On-time",
    "punchOutPhoto": "https://...",
    "punchOutLat": 19.077,
    "punchOutLng": 72.878
  },
  "currentPunchIn": null
}
```

**Errors:**
| Status | Error |
|--------|-------|
| 400 | `"Not punched in"` |
| 400 | `"Invalid action"` |

---

### 2.4 Face verify (before punch)

```http
POST /api/employee/face-verify
Content-Type: application/json
```

```json
{
  "selfie": "data:image/jpeg;base64,..."
}
```

**Success:**
```json
{
  "matched": true,
  "distance": 0.42,
  "similarity": 0.89,
  "score": 89
}
```

**Failed match (200 but matched false):**
```json
{
  "matched": false,
  "distance": 0.72,
  "similarity": 0.45,
  "score": 45
}
```

**Errors:**
| Status | Error |
|--------|-------|
| 404 | `"Face embedding not found"` — user must enroll face first |
| 422 | `"No face detected in the photo..."` |
| 400 | `"Missing selfie image"` |

**UI on fail:** `"Face did not match (similarity 45%). Adjust lighting or distance and retry."`

---

### 2.5 Face enrollment (prerequisite)

User must enroll **before** first punch.

```http
POST /api/employee/face-enroll
Content-Type: multipart/form-data
```

| Field | Type | Required |
|-------|------|----------|
| `photo1` | file | Yes — Front face |
| `photo2` | file | Yes — Left profile |
| `photo3` | file | Yes — Right profile |
| `employeeId` | string | No — Admin/HR only for other employees |

Server computes 128D face embedding from photos.

**Success:**
```json
{
  "success": true,
  "message": "Facial sign-in enrolled successfully",
  "employee": {
    "id": "user-uuid",
    "faceEnrolled": true,
    "facePhotos": ["https://...", "https://...", "https://..."]
  }
}
```

**Enrollment check:**
```ts
faceEnrolled = facePhotos.length >= 3 && faceEmbedding.length === 128
```

**Delete enrollment:**
```http
DELETE /api/employee/face-enroll
DELETE /api/employee/face-enroll?employeeId={id}  // Admin/HR only
```

**Get enrollment status:**
```http
GET /api/employee/face-embedding
GET /api/profile  // includes face enrollment info
```

---

## 3. Punch status calculation (server-side)

Status is set at **punch-in** time based on shift settings:

| Status | When |
|--------|------|
| `On-time` | Punch in before shift start + grace period |
| `Late` | Punch in after grace period |

Default shift from system settings: `shiftStartTime` (e.g. `"09:00 AM"`) + `gracePeriod` minutes.

Other statuses (`WFH`, `Half-day`, `Regularized`, `Absent`) come from WFH approval or regularization — not from manual punch.

---

## 4. Dashboard punch card UI

### Wireframe

```
┌─────────────────────────────────────────────┐
│  🕐 ATTENDANCE PUNCH CLOCK    [Punched In]  │
│                                             │
│  09:45:32 AM              ┌──────────────┐  │
│  Tuesday, June 10, 2026   │ Shift Duration│  │
│                           │  02:43:17     │  │
│                           └──────────────┘  │
│                                             │
│              [ ☕ Punch Out ]               │
│                                             │
│  Last check-in today: 09:02 AM (Active)     │
└─────────────────────────────────────────────┘
```

### States

| State | Badge | Button | Timer |
|-------|-------|--------|-------|
| Not punched in | `Punched Out` (gray) | **Punch In** (teal primary) | Hidden |
| Punched in | `Punched In` (green pulse dot) | **Punch Out** (red/destructive) | Live `HH:MM:SS` |

### Live clock
- Show current time updating every second
- Show full date: `"Tuesday, June 10, 2026"`
- When punched in: live shift duration timer from `currentPunchIn`

### Punch In button
- Teal primary, icon: check-in
- Only visible when `currentPunchIn === null`

### Punch Out button
- Red/destructive style
- Only visible when `currentPunchIn !== null`

---

## 5. Face scan modal UI

### Wireframe

```
┌─────────────────────────────────┐
│  😊 Face Verification           │
│                                 │
│     ACTION REQUIRED             │
│     Verify Face to Punch In     │
│                                 │
│     ┌─────────────────┐         │
│     │                 │         │
│     │   [Camera feed] │         │
│     │   circular      │         │
│     │                 │         │
│     └─────────────────┘         │
│                                 │
│  📍 Location captured           │
│                                 │
│  [ 📷 Capture & Verify ]        │
└─────────────────────────────────┘
```

### Modal states

| Status | UI |
|--------|-----|
| `initializing` | Spinner — "Opening camera..." |
| `ready` | Live camera feed + dashed face guide ring |
| `verifying` | Overlay spinner — "Verifying face..." / "Getting your location..." |
| `matched` | Green overlay — "Verified!" → auto-close → call punch API |
| `failed` | Red overlay + error message + Retry / Cancel |
| `error` | Camera permission denied |

### Location status chip (during ready state)

| Status | Message |
|--------|---------|
| Acquired | "Location captured" (green) |
| Requesting | "Acquiring GPS location..." (blue) |
| Denied | "Location blocked — approximate IP location will be used" (amber) |
| Unavailable | "GPS unavailable — approximate IP location will be used" (gray) |

### Camera specs
- Front camera (`facingMode: "user"`)
- Resolution: 640×480
- Mirror preview horizontally
- Capture as JPEG base64 at 85% quality

### Location capture (mobile)
```ts
import * as Location from "expo-location";

const { status } = await Location.requestForegroundPermissionsAsync();
const loc = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
});
// loc.coords.latitude, loc.coords.longitude
```

---

## 6. Face not enrolled alert

If user taps punch but `faceEnrolled === false`:

```
┌─────────────────────────────────┐
│  ⚠ Face Scan Required           │
│                                 │
│  Biometric Setup Required       │
│  You must upload your face      │
│  images (Front, Left, Right)    │
│  before recording attendance.   │
│                                 │
│  [ Cancel ]  [ Go to Face Setup]│
└─────────────────────────────────┘
```

Navigate to **Settings → Profile → Face Enrollment**.

---

## 7. Face enrollment screen (Profile)

### 3-step capture wizard

| Step | Pose | Instruction |
|------|------|-------------|
| 1 | Front | Look straight at camera |
| 2 | Left | Turn head slightly left |
| 3 | Right | Turn head slightly right |

After 3 captures → upload via `POST /api/employee/face-enroll` (multipart).

**Mobile implementation:**
```ts
const formData = new FormData();
formData.append("photo1", { uri: frontUri, name: "front.jpg", type: "image/jpeg" });
formData.append("photo2", { uri: leftUri, name: "left.jpg", type: "image/jpeg" });
formData.append("photo3", { uri: rightUri, name: "right.jpg", type: "image/jpeg" });

await fetch(`${API_BASE}/api/employee/face-enroll`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

---

## 8. Attendance logs screen

Route: **Attendance tab** (`/attendance`)

### Stats row (top)
| Card | Value |
|------|-------|
| Total Days | Count in time range |
| Late Arrivals | `status === "Late"` count |
| On-time Rate | % on-time + WFH + regularized |

### Filters
**Time range:** Today, This Week, This Month, Last 3 Months, All Time  
**Status:** All, On-time, Late, Regularized, Half-day, WFH

### Table columns
| Column | Field |
|--------|-------|
| Work Date | `date` |
| Punch In | `punchIn` + selfie eye icon |
| Punch Out | `punchOut` or "Active..." pulse |
| Duration | `duration` |
| Status | badge by `status` |
| Location | map pin → opens map modal |
| Remarks | optional |

### Status badge colors
| Status | Color |
|--------|-------|
| On-time | Green |
| Late | Amber |
| Half-day | Blue |
| WFH | Indigo |
| Regularized | Sky blue |
| Absent | Red |

### Selfie audit
Tap eye icon → show punch selfie image (check-in or check-out photo URL).

### Location map
Tap map pin → show punch-in/out coordinates on map (use `punchInLat/Lng` or `punchOutLat/Lng`).

---

## 9. React Native implementation

### Expo modules needed
```
expo-camera          — face scan preview + capture
expo-location        — GPS coordinates
expo-image-picker    — face enrollment photos (alternative)
expo-file-system     — read image as base64
```

### Punch store actions

```ts
interface PunchState {
  currentPunchIn: string | null;
  currentPunchInPhoto: string | null;
  currentPunchInLat: number | null;
  currentPunchInLng: number | null;
  punchHistory: PunchRecord[];
  faceEnrolled: boolean;

  fetchPunchData: () => Promise<void>;
  punchIn: (selfie: string, lat?: number | null, lng?: number | null) => Promise<void>;
  punchOut: (selfie: string, lat?: number | null, lng?: number | null) => Promise<void>;
  verifyFace: (selfie: string) => Promise<{ matched: boolean; similarity?: number }>;
}
```

### Complete punch-in handler

```ts
async function handlePunchIn() {
  if (!faceEnrolled) {
    showFaceRequiredAlert();
    return;
  }

  const result = await openFaceScanModal("punch-in");
  if (!result) return; // cancelled or failed

  const { selfieBase64, lat, lng } = result;

  try {
    const data = await api("/api/attendance/punch", {
      method: "POST",
      body: JSON.stringify({
        action: "punch-in",
        selfie: selfieBase64,
        lat,
        lng,
      }),
    });

    setCurrentPunchIn(data.currentPunchIn);
    prependPunchRecord(data.punchRecord);
    showSuccess("Punched in successfully!");
  } catch (err) {
    if (err.code === "PUNCH_LIMIT_REACHED") {
      showUpgradeModal(err.message);
    } else {
      showError(err.message);
    }
  }
}
```

### Face scan flow (mobile)

```ts
async function runFaceScan(): Promise<{
  selfieBase64: string;
  lat: number | null;
  lng: number | null;
} | null> {
  // 1. Camera permission
  const { granted } = await Camera.requestCameraPermissionsAsync();
  if (!granted) return null;

  // 2. Location permission (parallel)
  let lat: number | null = null;
  let lng: number | null = null;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === "granted") {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    lat = loc.coords.latitude;
    lng = loc.coords.longitude;
  }

  // 3. Capture photo from camera
  const photo = await cameraRef.current.takePictureAsync({
    base64: true,
    quality: 0.85,
  });
  const selfieBase64 = `data:image/jpeg;base64,${photo.base64}`;

  // 4. Verify face
  const verify = await api("/api/employee/face-verify", {
    method: "POST",
    body: JSON.stringify({ selfie: selfieBase64 }),
  });

  if (!verify.matched) {
    throw new Error(`Face did not match (${Math.round((verify.similarity ?? 0) * 100)}%)`);
  }

  return { selfieBase64, lat, lng };
}
```

### Live shift timer

```ts
useEffect(() => {
  if (!currentPunchIn) return;

  const interval = setInterval(() => {
    const diff = Date.now() - new Date(currentPunchIn).getTime();
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    setTimer(
      `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    );
  }, 1000);

  return () => clearInterval(interval);
}, [currentPunchIn]);
```

---

## 10. Plan limits UI

Show on dashboard if Free plan:

```
Punch-ins this month: 42 / 50
[Upgrade for unlimited]
```

From `GET /api/billing/status`:
```json
{
  "punchesUsedThisMonth": 42,
  "punchesLimit": 50,
  "hasProAccess": false
}
```

If `punchesLimit === null` → Pro/Trial → hide counter.

---

## 11. Screen map (mobile)

```
Dashboard Tab
└── Punch Card (main CTA)
    ├── FaceScanModal
    ├── FaceRequiredAlert → Profile Face Setup
    └── Punch limit upgrade modal

Attendance Tab
└── Attendance Logs
    ├── Stats cards
    ├── Filters (time + status)
    ├── Punch history list
    ├── SelfieViewer modal
    └── LocationMap modal

Settings → Profile
└── Face Enrollment (3-step wizard)
```

---

## 12. TypeScript types

```ts
export interface PunchRecord {
  id: string;
  date: string;           // "YYYY-MM-DD"
  punchIn: string;        // "09:02 AM"
  punchOut: string | null;
  duration: string | null; // "9h 10m"
  status: "On-time" | "Late" | "Half-day" | "Absent" | "WFH" | "Regularized";
  employeeId?: string;
  punchInPhoto?: string | null;
  punchOutPhoto?: string | null;
  punchInLat?: number | null;
  punchInLng?: number | null;
  punchOutLat?: number | null;
  punchOutLng?: number | null;
}

export interface PunchInResponse {
  punchRecord: PunchRecord;
  currentPunchIn: string;
  currentPunchInPhoto: string | null;
  currentPunchInLat: number | null;
  currentPunchInLng: number | null;
  status: string;
}

export interface PunchOutResponse {
  punchRecord: PunchRecord;
  currentPunchIn: null;
}

export interface FaceVerifyResponse {
  matched: boolean;
  distance: number | null;
  similarity: number | null;
  score: number;
  error?: string;
}
```

---

## 13. Checklist for Antigravity

### Prerequisites
- [ ] Check `faceEnrolled` on dashboard load
- [ ] Face enrollment screen (3 photos → multipart upload)
- [ ] Camera + location permissions

### Dashboard punch card
- [ ] Live clock (HH:MM:SS)
- [ ] Punched In / Punched Out badge
- [ ] Live shift duration timer when punched in
- [ ] Punch In button (when not punched in)
- [ ] Punch Out button (when punched in)
- [ ] Last check-in summary line

### Face scan modal
- [ ] Camera preview (front, mirrored, circular frame)
- [ ] GPS capture in background
- [ ] Location status chip
- [ ] Capture & Verify button
- [ ] POST face-verify before punch
- [ ] Retry on failure
- [ ] Face-not-enrolled alert with link to setup

### Punch API
- [ ] POST punch-in with selfie + lat/lng
- [ ] POST punch-out with selfie + lat/lng
- [ ] Handle `PUNCH_LIMIT_REACHED` → upgrade modal
- [ ] Handle `Already punched in` / `Not punched in`

### Attendance logs
- [ ] GET punch history
- [ ] Time + status filters
- [ ] Status badges
- [ ] Selfie viewer (eye icon)
- [ ] Location map (pin icon)
- [ ] Stats: total days, late count, on-time %

### Billing
- [ ] Show punch usage counter on Free plan
- [ ] Hide counter on Pro/Trial

---

## 14. Web source files (reference)

| Feature | File |
|---------|------|
| Dashboard punch card | `src/app/(app)/dashboard/page.tsx` |
| Face scan modal | `src/components/attendance/FaceScanDialog.tsx` |
| Face enrollment | `src/components/attendance/FaceEnrollment.tsx` |
| Attendance logs | `src/app/(app)/attendance/page.tsx` |
| Punch API | `src/app/api/attendance/punch/route.ts` |
| Face verify API | `src/app/api/employee/face-verify/route.ts` |
| Face enroll API | `src/app/api/employee/face-enroll/route.ts` |
| Punch status logic | `src/lib/punch-utils.ts` |
| Punch limit check | `src/lib/billing/workspace-access.ts` |
| Punch store | `src/stores/leave-store.ts` |

---

*Selfie images stored in S3. Face matching runs server-side. Mobile only needs camera capture + API calls.*
