# ANSH HR Mobile — Onboarding Step 1 Spec

**Handoff for Antigravity / mobile developers.**  
Technical spec for implementing Step 1 (Personal Profile Setup) of the Onboarding Wizard on the React Native mobile client.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Onboarding Wizard** (`/app/(auth)/onboarding.tsx`) |
| Phase | **Step 1 of 3: Personal Profile** |
| Objective | Establish user's full name identity and select their primary department. |
| Navigation | Next Step ➜ **Step 2 (Privilege Roles)** |

---

## 1. Setup & Pre-fill Logic (Mount Guard)

When the onboarding screen mounts, the app must verify that a valid session exists and pre-populate the employee's name from their authentication metadata.

### Data Source (Supabase Session Metadata):
```typescript
import supabase from "../lib/supabase";

// Within the screen component hook:
useEffect(() => {
  const getPreFilledName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const metadataName = 
        session.user.user_metadata?.full_name || 
        session.user.user_metadata?.name || 
        "";
      setName(metadataName);
    }
  };
  getPreFilledName();
}, []);
```

---

## 2. Onboarding Step 1 Fields & Validations

The user must confirm two primary pieces of identity data during this step.

### 2.1 Form Fields

| Field Label | Variable Key | Input Type | Default Value | Options / Choices |
|-------------|--------------|------------|---------------|-------------------|
| **Full Name** | `name` | Text Input | Pre-filled from metadata | — |
| **Department Registry** | `department` | Dropdown Picker | `"Engineering"` | `Engineering`, `Human Resources`, `Product Design`, `Data Analytics`, `Executive`, `Marketing` |

### 2.2 Client-side Validations
Before allowing the user to tap "Next Step", execute the following validation check:
* **Validation Rule:** The name input field must not be empty.
* **Error Trigger:** If empty, display AlertModal with:
  * **Title:** *"Validation Error"*
  * **Message:** *"Please enter your name."*

---

## 3. UI Layout Wireframe (Step 1)

```
┌──────────────────────────────────────────┐
│ ● Step 1  ○ Step 2  ○ Step 3             │
├──────────────────────────────────────────┤
│ Personal Profile                         │
│ Verify your pre-filled name and select   │
│ your department registry.                │
│                                          │
│ FULL NAME                                │
│ ┌──────────────────────────────────────┐ │
│ │ 👤 Priya Sharma                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ DEPARTMENT REGISTRY                      │
│ ┌──────────────────────────────────────┐ │
│ │ 💼 Engineering                     ▼ │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ NEXT STEP ➔                          │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## 4. React Native Implementation Code Example

Use the following React Native structure as a basis for your Onboarding Step 1 view:

```typescript
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import supabase from "../../lib/supabase";

interface Step1Props {
  onNext: (name: string, department: string) => void;
  initialValues: { name: string; department: string };
}

export default function OnboardingStep1({ onNext, initialValues }: Step1Props) {
  const [name, setName] = useState(initialValues.name);
  const [department, setDepartment] = useState(initialValues.department || "Engineering");

  useEffect(() => {
    if (!name) {
      const fetchSessionName = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const prefilledName = 
          session?.user?.user_metadata?.full_name || 
          session?.user?.user_metadata?.name || 
          "";
        setName(prefilledName);
      };
      fetchSessionName();
    }
  }, []);

  const handleNext = () => {
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }
    onNext(name.trim(), department);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Profile</Text>
      <Text style={styles.description}>
        Verify your pre-filled name and select your department registry.
      </Text>

      {/* Full Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Priya Sharma"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Department Picker */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Department Registry</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={department}
            onValueChange={(itemValue) => setDepartment(itemValue)}
            style={styles.picker}
            dropdownIconColor="#ffffff"
          >
            <Picker.Item label="Engineering" value="Engineering" />
            <Picker.Item label="Human Resources" value="Human Resources" />
            <Picker.Item label="Product Design" value="Product Design" />
            <Picker.Item label="Data Analytics" value="Data Analytics" />
            <Picker.Item label="Executive" value="Executive" />
            <Picker.Item label="Marketing" value="Marketing" />
          </Picker>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.btnText}>Next Step ➔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0f172a" },
  title: { fontSize: 20, fontWeight: "800", color: "#ffffff", marginBottom: 8 },
  description: { fontSize: 13, color: "#94a3b8", lineHeight: 18, marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", letterSpacing: 1, marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#1e293b", borderWidth: 1.5, borderColor: "#334155", borderRadius: 12, height: 48, paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#ffffff", fontSize: 14, fontWeight: "605" },
  pickerWrapper: { backgroundColor: "#1e293b", borderRadius: 12, borderWidth: 1.5, borderColor: "#334155", overflow: "hidden" },
  picker: { color: "#ffffff", height: 50 },
  nextButton: { backgroundColor: "#10b981", height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 30 },
  btnText: { color: "#ffffff", fontWeight: "bold", fontSize: 14 }
});
```
