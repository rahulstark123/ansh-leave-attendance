# ANSH HR Mobile — Delete Account Spec

**Handoff for Antigravity / mobile developers.**  
Technical spec for implementing the Account Deletion Request screen on the React Native mobile client.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Delete Account** (`/settings/delete-account` inside settings stack) |
| Compliance | Mandatory for Apple App Store (Guideline 5.1.1) and Google Play Store policies. |
| Method | Email-based manual request (processed within 7 business days). |
| Contact Email | `support@anshapps.com` |
| Email Subject | `Account Deletion Request` |

---

## 1. Compliance & Business Logic

Because accounts contain critical organizational data (leaves, punches, branches), account deletions are verified and processed manually by the operations team. 

The mobile application must provide a dedicated interface to initiate this request to comply with app store guidelines.

### Deletion Consequences (Must be displayed in UI):
* Your account will be permanently deleted.
* Your profile information will be removed.
* Your authentication credentials will be deleted.
* Any active subscription will be cancelled and revoked.
* Any personal data associated with your account will be removed from our systems.

---

## 2. Mobile UI Screen Design

The design should match the application's clean SaaS aesthetic but use a cautionary **rose/red theme** to signify a destructive action.

```
┌──────────────────────────────────────────┐
│ ✕ DELETE ACCOUNT                         │
├──────────────────────────────────────────┤
│ ⚠️ Danger Zone                           │
│                                          │
│ Request permanent deletion of your       │
│ account and associated personal data.    │
│                                          │
│ [ Consequences List ]                    │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ [Mail Icon] Send Deletion Email      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Deletion requests are processed within   │
│ 7 business days of receipt.              │
└──────────────────────────────────────────┘
```

---

## 3. React Native / Expo Implementation

Implement the email drafting feature using Expo's `Sharing` / `Linking` or `expo-mail-composer` to automatically populate the deletion request from the user's logged-in profile:

### 3.1 Expo MailComposer Code Snippet

Ensure you install the module first: `npx expo install expo-mail-composer`

```typescript
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from "react-native";
import * as MailComposer from "expo-mail-composer";
import * as Linking from "expo-linking";
import { useAuthStore } from "../../stores/auth-store";

export default function DeleteAccountScreen() {
  const { user } = useAuthStore(); // Retrieves logged-in user details

  const handleRequestDeletion = async () => {
    const recipient = "support@anshapps.com";
    const subject = `Account Deletion Request - ${user?.name || "User"}`;
    const body = `Hello Support Team,\n\nI am requesting the permanent deletion of my ANSH HR account and all associated data.\n\nRegistered Email: ${user?.email || "N/A"}\nEmployee ID: ${user?.id || "N/A"}\nWorkspace ID: ${user?.wid || "N/A"}\n\nRegards,\n${user?.name || "User"}`;

    // 1. Verify if MailComposer is available on device (Native iOS/Android Mail App configuration)
    const isAvailable = await MailComposer.isAvailableAsync();

    if (isAvailable) {
      try {
        await MailComposer.composeAsync({
          recipients: [recipient],
          subject: subject,
          body: body,
        });
      } catch (error) {
        fallbackMailto(recipient, subject, body);
      }
    } else {
      // 2. Fallback to mailto linking if no native email composer is configured
      fallbackMailto(recipient, subject, body);
    }
  };

  const fallbackMailto = (to: string, sub: string, content: string) => {
    const url = `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(content)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            "Request Account Deletion",
            "No email applications found. Please send an email manually from your registered address to support@anshapps.com with subject: 'Account Deletion Request'."
          );
        }
      })
      .catch(() => {
        Alert.alert("Error", "Failed to launch mail client.");
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Delete Account</Text>
        <Text style={styles.warning}>
          This action is permanent and cannot be undone. Please read the consequences carefully:
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>• Your account and credentials will be deleted.</Text>
          <Text style={styles.listItem}>• Your personal files and profile will be wiped.</Text>
          <Text style={styles.listItem}>• Any active workspace subscription will be revoked.</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRequestDeletion}>
          <Text style={styles.btnText}>Initiate Deletion Request</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Verification and manual data erasure is completed within 7 business days of request submission.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20, justifyContent: "center" },
  card: { backgroundColor: "#ffffff", padding: 24, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  header: { fontSize: 18, fontWeight: "800", color: "#ef4444", textTransform: "uppercase", marginBottom: 12 },
  warning: { fontSize: 13, color: "#64748b", lineHeight: 18, marginBottom: 20 },
  list: { marginBottom: 30 },
  listItem: { fontSize: 12, color: "#475569", lineHeight: 22, fontWeight: "500" },
  button: { backgroundColor: "#ef4444", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#ffffff", fontWeight: "bold", fontSize: 13, textTransform: "uppercase" },
  footerText: { fontSize: 10, color: "#94a3b8", textAlign: "center", marginTop: 15, lineHeight: 14 }
});
```
