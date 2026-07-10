# ANSH HR Mobile — Signup Terms & Privacy Spec

**Handoff for Antigravity / mobile developers.**  
Technical blueprint for adding Terms & Conditions and Privacy Policy checkboxes to the Sign Up/Create Account flow.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Sign Up / Create Account** (`/app/(auth)/signup.tsx`) |
| DB Columns | `Employee.acceptedTerms` (Boolean), `Employee.acceptedPrivacy` (Boolean) |
| Validation | Block signup execution if consent checkboxes are unchecked. |
| External URLs | Terms: `https://anshapps.com/terms` <br> Privacy: `https://anshapps.com/privacy` |

---

## 1. Compliance & Business Logic

To comply with App Store privacy mandates (e.g. GDPR, CCPA, and App Store Review Guideline 5.1.1), users must explicitly consent to the Terms of Service and Privacy Policy before creating an account.

### Rules:
* The user **must check** the consent checkbox(es).
* If the user attempts to click "Create ANSH HR Account" without checking the boxes, trigger a warning modal or validation error.
* Terms and Privacy labels must contain clickable text links that launch the respective policies in an in-app browser or native web browser.

---

## 2. Mobile UI Layout

Position the terms checkbox row directly above the "Create ANSH HR Account" button:

```
[  ] I agree to the Terms of Service and Privacy Policy.

┌────────────────────────────────────────────────────────┐
│               CREATE ANSH HR ACCOUNT                   │
└────────────────────────────────────────────────────────┘
```

#### Styling Best Practices:
* **Checkbox:** Renders as a customized TouchableOpacity box (`width: 20`, `height: 20`, `borderRadius: 4`, `borderWidth: 1.5`).
* **Active State:** Fills with `colors.primary` (`#0d9488`) displaying a small white checkmark icon (e.g., `Ionicons name="checkmark"`).
* **Text links:** Color the words "Terms of Service" and "Privacy Policy" with the primary brand color (`colors.primary`) to clearly indicate they are clickable links.

---

## 3. React Native / Expo Code Modification

Here is the step-by-step layout integration for `/app/(auth)/signup.tsx`:

### 3.1 State Definition
Add a boolean state to track agreement status:
```typescript
const [agreed, setAgreed] = useState(false);
```

### 3.2 Add Validation Check
Add this verification check inside the `handleSignup` trigger:
```typescript
if (!agreed) {
  showAlert(
    "Policy Consent Required",
    "Please read and accept the Terms of Service and Privacy Policy to create your account.",
    "warning"
  );
  return;
}
```

### 3.3 Checkbox & Link JSX Layout
Insert this segment before the primary signup button:

```tsx
import * as WebBrowser from "expo-web-browser";

// ... Inside Signup Render ...

const handleOpenPolicy = async (url: string) => {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Linking.openURL(url);
  }
};

// ... Insert in JSX hierarchy:
<View style={styles.consentRow}>
  <TouchableOpacity
    style={[
      styles.checkbox,
      {
        borderColor: agreed ? colors.primary : colors.border,
        backgroundColor: agreed ? colors.primary : "transparent",
      },
    ]}
    onPress={() => setAgreed(!agreed)}
  >
    {agreed && <Ionicons name="checkmark" size={14} color="#ffffff" />}
  </TouchableOpacity>

  <Text style={[styles.consentText, { color: colors.textMuted }]}>
    I agree to the{" "}
    <Text
      style={[styles.linkText, { color: colors.primary }]}
      onPress={() => handleOpenPolicy("https://anshapps.com/terms")}
    >
      Terms of Service
    </Text>{" "}
    and{" "}
    <Text
      style={[styles.linkText, { color: colors.primary }]}
      onPress={() => handleOpenPolicy("https://anshapps.com/privacy")}
    >
      Privacy Policy
    </Text>
    .
  </Text>
</View>
```

### 3.4 StyleSheet Configurations
```typescript
const styles = StyleSheet.create({
  // ... Existing styles ...
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  linkText: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
```
