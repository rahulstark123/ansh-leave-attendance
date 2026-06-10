# ANSH HR Mobile — Team Space (Workspace) Spec

**Handoff for Antigravity / mobile developers.**  
Slack-like messaging: channels, direct messages, real-time updates.

---

## 0. Overview

| Item | Value |
|------|-------|
| Feature name | **Team Space** (web route: `/workspace`) |
| Plan | **Pro only** — gate with `GET /api/billing/status` → `hasProAccess` |
| APIs | `/api/workspace/channels`, `/api/workspace/messages` |
| Realtime | Supabase `postgres_changes` on `WorkspaceMessage` table |
| Employee list | `GET /api/employees` or `GET /api/dashboard` (for DM picker) |

---

## 1. Screen layout (mobile)

```
┌─────────────────────────────────────┐
│  Team Space                    [+]  │  ← header
├─────────────────────────────────────┤
│  CHANNELS                           │
│  # general                          │
│  # sales-leads          🔒          │
│  + Create channel                   │
├─────────────────────────────────────┤
│  DIRECT MESSAGES                    │
│  👤 Priya Sharma                    │
│  👤 Amit Patel                      │
│  + Start DM                         │
└─────────────────────────────────────┘
        ↓ tap channel or DM
┌─────────────────────────────────────┐
│  ←  # general                       │  ← chat header
├─────────────────────────────────────┤
│  [PS] Priya Sharma    9:02 AM       │
│       Hello team!                   │
│                                     │
│  [AR] You             9:05 AM       │
│       Good morning                  │
├─────────────────────────────────────┤
│  [B][I] Type a message...      [➤]  │  ← composer
└─────────────────────────────────────┘
```

**Navigation:** Stack inside Team Space tab, or dedicated `workspace/` routes.

---

## 2. Pro plan gate

Before showing Team Space:

```ts
const billing = await api("/api/billing/status");
if (!billing.hasProAccess) {
  showProUpgradeModal({
    moduleName: "Team Space",
    message: "Team Space messaging and channels are not included in your current plan.",
  });
  return;
}
```

Free/trial users during **14-day trial** have `hasProAccess: true` and can use Team Space.

---

## 3. Data models

### Channel
```ts
interface Channel {
  id: string;
  name: string;              // slug e.g. "general", "sales-leads"
  description: string;
  isPublic: boolean;
  createdById: string;
  memberIds: string[];       // private channel members only
  members: {
    id: string;
    name: string;
    avatarInitials: string;
  }[];
}
```

### Message
```ts
interface WorkspaceMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  avatarInitials: string;
  channelId?: string;        // set for channel messages
  receiverId?: string;       // set for DMs
  sentAt: string;            // ISO timestamp
}
```

### DM Partner
```ts
interface DmPartner {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarInitials: string;
  status: string;
}
```

### Database rules
- **Channel message:** `channelId` set, `receiverId` null
- **DM:** `channelId` null, `receiverId` set
- Channel names are **unique per workspace** (`name` + `wid`)
- Names are auto-slugified: `"Sales Leads"` → `"sales-leads"`

---

## 4. API reference

Base: `{API_BASE_URL}/api`  
Header: `Authorization: Bearer <token>`

---

### 4.1 List channels

```http
GET /api/workspace/channels
```

**Behavior:**
- Auto-creates `#general` channel if workspace has zero channels (first visit)
- Returns only channels the user **can access** (public + private where member/creator)

**Response:**
```json
{
  "channels": [
    {
      "id": "clx...",
      "name": "general",
      "description": "Company-wide announcements and updates",
      "isPublic": true,
      "createdById": "user-uuid",
      "memberIds": [],
      "members": []
    },
    {
      "id": "clx...",
      "name": "hr-private",
      "description": "HR team only",
      "isPublic": false,
      "createdById": "user-uuid",
      "memberIds": ["emp-1", "emp-2"],
      "members": [
        { "id": "emp-1", "name": "Priya", "avatarInitials": "PS" }
      ]
    }
  ]
}
```

---

### 4.2 Create channel

```http
POST /api/workspace/channels
Content-Type: application/json
```

**Body — Public channel:**
```json
{
  "name": "sales-leads",
  "description": "Sales pipeline discussion",
  "isPublic": true,
  "memberIds": []
}
```

**Body — Private channel:**
```json
{
  "name": "hr-private",
  "description": "HR team only",
  "isPublic": false,
  "memberIds": ["employee-id-1", "employee-id-2"]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Slugified server-side: lowercase, spaces→hyphens, `#` removed |
| `description` | string | No | Default `""` |
| `isPublic` | boolean | No | Default `true` |
| `memberIds` | string[] | Private only | At least 1 member required for private; creator auto-included in access |

**Success:** `201` + `{ "channel": { ... } }`

**Errors:**
| Status | Error |
|--------|-------|
| 400 | `"Channel name is required"` |
| 400 | `"Private channels require at least one member"` |
| 400 | `"One or more selected members are invalid"` |
| 409 | `"A channel with this name already exists"` |

**Channel access rules:**
| Type | Who can see |
|------|-------------|
| Public (`isPublic: true`) | Everyone in workspace |
| Private (`isPublic: false`) | Creator + selected `memberIds` |

---

### 4.3 List channel messages

```http
GET /api/workspace/messages?channelId={channelId}
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-1",
      "content": "Hello team!",
      "senderId": "user-a",
      "senderName": "Priya Sharma",
      "avatarInitials": "PS",
      "channelId": "channel-1",
      "sentAt": "2026-06-10T09:02:00.000Z"
    }
  ]
}
```

Messages ordered **oldest first** (`sentAt asc`) — scroll to bottom on load.

**Errors:** `403` Forbidden (no access to private channel), `404` Channel not found

---

### 4.4 List DM messages

```http
GET /api/workspace/messages?receiverId={employeeId}
```

Returns all messages between **current user** and **receiverId** (bidirectional).

**Response:** Same shape as channel messages, but `receiverId` set instead of `channelId`.

**Errors:**
| Status | Error |
|--------|-------|
| 400 | `"Cannot DM yourself"` |
| 404 | `"Employee not found"` |

---

### 4.5 List DM partners (sidebar)

```http
GET /api/workspace/messages?listDmPartners=true
```

Returns employees you have **existing DM history** with (not all colleagues).

**Response:**
```json
{
  "partners": [
    {
      "id": "emp-2",
      "name": "Amit Patel",
      "role": "Employee",
      "department": "Engineering",
      "avatarInitials": "AP",
      "status": "Active"
    }
  ]
}
```

**Note:** Starting a DM with someone new does **not** require an API call — just open chat and send first message. Add them to local DM list after first send.

---

### 4.6 Send channel message

```http
POST /api/workspace/messages
Content-Type: application/json
```

```json
{
  "content": "Hello everyone!",
  "channelId": "channel-uuid"
}
```

**Rules:**
- `content` required, trimmed
- Provide **either** `channelId` **or** `receiverId`, not both
- User must have channel access

**Success:** `201`
```json
{
  "message": {
    "id": "msg-new",
    "content": "Hello everyone!",
    "senderId": "current-user-id",
    "senderName": "Rahul Raj",
    "avatarInitials": "RR",
    "channelId": "channel-uuid",
    "sentAt": "2026-06-10T09:15:00.000Z"
  }
}
```

---

### 4.7 Send DM

```http
POST /api/workspace/messages
Content-Type: application/json
```

```json
{
  "content": "Hey, are you free for a call?",
  "receiverId": "employee-uuid"
}
```

Same response shape with `receiverId` instead of `channelId`.

---

### 4.8 Get colleagues (for DM picker & private channel members)

```http
GET /api/employees
```

Or use employees from `GET /api/dashboard` → `employees` array.

Filter out current user for DM picker:
```ts
const colleagues = employees.filter(e => e.id !== currentUser.id);
```

---

## 5. User flows

### Flow A — Open Team Space (first time)

```
1. Check hasProAccess
2. GET /api/workspace/channels
   → Backend auto-creates #general if empty
3. GET /api/workspace/messages?listDmPartners=true
4. GET /api/employees (for DM picker)
5. Auto-select first channel (#general)
6. GET /api/workspace/messages?channelId={firstChannelId}
7. Subscribe Supabase realtime
```

---

### Flow B — Create public channel

```
1. Tap "+" next to Channels
2. Modal: name, description (optional), visibility = Public
3. POST /api/workspace/channels { name, description, isPublic: true }
4. On success → add to list, switch to new channel
```

**UI validation:**
- Name required
- Show slug preview: "Sales Leads" → `#sales-leads`

---

### Flow C — Create private channel

```
1. Tap "+" → Create Channel
2. Set visibility = Private
3. Show colleague checklist (from GET /api/employees)
4. Select ≥ 1 member (required)
5. POST /api/workspace/channels {
     name, description, isPublic: false, memberIds: [...]
   }
6. On success → open new channel
```

**Validation:** If private and no members selected → "Select at least one member for a private channel."

---

### Flow D — Start new DM

```
1. Tap "+" next to Direct Messages
2. Picker: select coworker from colleagues list
3. No API call yet — just set activeChat = { type: "dm", id: employeeId }
4. GET /api/workspace/messages?receiverId={employeeId}
   → May return [] (empty thread)
5. User types message → POST with receiverId
6. Refresh GET ?listDmPartners=true (or add partner locally)
```

**There is no separate "create DM" endpoint.** DMs are created implicitly on first message.

---

### Flow E — Send message

```
1. User types in composer
2. Enter (without Shift) or tap Send
3. POST /api/workspace/messages
4. Append returned message to local list
5. Scroll to bottom
```

**Optional formatting (web supports):**
- Bold: wrap with `**text**`
- Italic: wrap with `*text*`
- Apply before POST if bold/italic toggles are on

---

## 6. Realtime (Supabase)

Subscribe to new messages for live updates:

```ts
import { supabase } from "@/lib/supabase";

const channel = supabase
  .channel("workspace-messages-realtime")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "WorkspaceMessage",
    },
    (payload) => {
      const newMsg = payload.new as {
        id: string;
        content: string;
        senderId: string;
        channelId: string | null;
        receiverId: string | null;
        sentAt: string;
        wid: number;
      };

      // Filter by current chat view
      if (activeChat.type === "channel" && newMsg.channelId === activeChat.id) {
        addMessageToUI(newMsg);
      }
      if (activeChat.type === "dm") {
        const isBetweenUs =
          (newMsg.senderId === me.id && newMsg.receiverId === activeChat.id) ||
          (newMsg.senderId === activeChat.id && newMsg.receiverId === me.id);
        if (isBetweenUs) addMessageToUI(newMsg);
      }

      // Refresh DM partners list if new DM received
      if (newMsg.receiverId === me.id) {
        fetchDmPartners();
      }
    }
  )
  .subscribe();

// Cleanup on unmount / chat change
return () => supabase.removeChannel(channel);
```

**Supabase setup required:**
- Enable Realtime on `WorkspaceMessage` table in Supabase dashboard
- Table must be in `public` schema

**Note:** Realtime payload does not include `senderName` / `avatarInitials` — look up from employees list or refetch message.

---

## 7. Channel list UI details

| Icon | Meaning |
|------|---------|
| `#` (Hash) | Public channel |
| `🔒` (Lock) | Private channel |

**Active item:** primary background tint + ring (emerald on web).

**Default channel:** `#general` — "Company-wide announcements and updates"

---

## 8. Chat UI details

### Message bubble layout (match web — left-aligned list, not bubbles)

```
[Avatar]  Sender Name    9:02 AM
          Message text here...
```

- Avatar: initials in rounded square
- Own messages: same layout (web does not use right-aligned bubbles)
- Empty state: "Welcome to #general! This is the start of the channel."
- Loading: spinner "Loading messages..."

### Composer
- Text input (multiline, max ~4 lines)
- **Send** button (disabled when empty)
- **Enter** = send, **Shift+Enter** = new line
- Optional toolbar: Bold, Italic (web has Paperclip, Emoji, @ as UI-only — not wired to API yet)

### Header
- Channel: `# channel-name` + description + "Private" badge if needed
- DM: avatar + name + role · department

---

## 9. React Native implementation

### Folder structure

```
app/workspace/
├── index.tsx           # Channel + DM list (sidebar on tablet, list on phone)
├── [chatType]/[id].tsx # Chat thread (channel or dm)
├── create-channel.tsx  # Modal / screen
└── start-dm.tsx        # Modal / screen

stores/
└── workspace-store.ts  # channels, messages, fetch/send actions

lib/
└── workspace-realtime.ts
```

### Workspace store (mirror web)

```ts
interface WorkspaceState {
  channels: Channel[];
  messages: WorkspaceMessage[];
  dmPartners: DmPartner[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;

  fetchChannels: () => Promise<void>;
  createChannel: (name, description, isPublic, memberIds) => Promise<Channel | null>;
  fetchMessages: (params: { channelId?: string; receiverId?: string }) => Promise<void>;
  fetchDmPartners: () => Promise<void>;
  sendMessage: (content, channelId?, receiverId?) => Promise<WorkspaceMessage | null>;
  addRealtimeMessage: (message: WorkspaceMessage) => void;
}
```

### Bootstrap on screen mount

```ts
useEffect(() => {
  if (!hasProAccess) return;
  Promise.all([
    fetchChannels(),
    fetchDmPartners(),
    fetchEmployees(), // from dashboard or /api/employees
  ]);
}, []);
```

### Active chat switch

```ts
function openChannel(channelId: string) {
  setActiveChat({ type: "channel", id: channelId });
  fetchMessages({ channelId });
}

function openDm(employeeId: string) {
  setActiveChat({ type: "dm", id: employeeId });
  fetchMessages({ receiverId: employeeId });
}
```

---

## 10. Create Channel screen spec

### Fields

| Field | UI | Required |
|-------|-----|----------|
| Channel Name | TextInput | Yes |
| Description | TextInput multiline | No |
| Visibility | Segmented: Public / Private | Yes (default Public) |
| Members | Checkbox list (Private only) | Yes if Private |

### Copy
- **Title:** "Create a Channel"
- **Public hint:** "Anyone in your workspace can see and join this channel."
- **Private hint:** "Only you and selected members can access this channel."
- **CTA:** "Create Channel"

### On success
Navigate to new channel chat, load messages (empty).

---

## 11. Start DM screen spec

### Fields

| Field | UI | Required |
|-------|-----|----------|
| Select Coworker | Searchable picker | Yes |

Data source: `GET /api/employees` minus current user.

### Copy
- **Title:** "Direct Message Colleague"
- **Placeholder:** "Choose a coworker..."
- **CTA:** "Start Chat"

### On submit
Navigate to DM chat screen — no API until first message sent.

---

## 12. Error handling

| Scenario | User message |
|----------|--------------|
| No Pro access | Show upgrade modal |
| 401 | Redirect to login |
| 403 on channel | "You don't have access to this channel" |
| 409 duplicate name | "A channel with this name already exists" |
| Empty message | Disable send button |
| Network error | "Failed to send message. Try again." |

---

## 13. Checklist for Antigravity

### Setup
- [ ] Pro gate via `/api/billing/status`
- [ ] Load channels + DM partners on mount
- [ ] Load employees for pickers

### Channels
- [ ] List channels with # / lock icons
- [ ] Auto-select first channel
- [ ] Create public channel modal
- [ ] Create private channel with member picker
- [ ] Handle 409 duplicate name

### DMs
- [ ] List existing DM partners (`listDmPartners=true`)
- [ ] Start DM picker (all colleagues)
- [ ] Load DM thread by `receiverId`
- [ ] First message creates DM implicitly

### Messages
- [ ] Load channel messages (`channelId`)
- [ ] Send channel message (POST)
- [ ] Send DM (POST with `receiverId`)
- [ ] Enter to send, scroll to bottom
- [ ] Optional bold/italic (`**` / `*`)

### Realtime
- [ ] Supabase subscription on `WorkspaceMessage` INSERT
- [ ] Filter by active channel/DM
- [ ] Dedupe by message `id`
- [ ] Refresh DM partners on incoming DM

---

## 14. Web source files (reference)

| Feature | File |
|---------|------|
| Team Space UI | `src/app/(app)/workspace/page.tsx` |
| Channels API | `src/app/api/workspace/channels/route.ts` |
| Messages API | `src/app/api/workspace/messages/route.ts` |
| Access helpers | `src/lib/workspace-access.ts` |
| Zustand store | `src/stores/workspace-store.ts` |
| Pro gating | `src/lib/billing/features.ts` (`team-space`) |
| Prisma models | `prisma/schema.prisma` → `WorkspaceChannel`, `ChannelMember`, `WorkspaceMessage` |

---

## 15. Quick API summary table

| Action | Method | Endpoint |
|--------|--------|----------|
| List channels | GET | `/api/workspace/channels` |
| Create channel | POST | `/api/workspace/channels` |
| Channel messages | GET | `/api/workspace/messages?channelId=` |
| DM messages | GET | `/api/workspace/messages?receiverId=` |
| DM partners list | GET | `/api/workspace/messages?listDmPartners=true` |
| Send channel msg | POST | `/api/workspace/messages` + `channelId` |
| Send DM | POST | `/api/workspace/messages` + `receiverId` |
| Colleagues list | GET | `/api/employees` |
| Plan check | GET | `/api/billing/status` |

---

*Connect to the same ANSH HR Next.js backend. No separate messaging server required.*
