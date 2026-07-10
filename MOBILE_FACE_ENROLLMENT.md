# ANSH HR Mobile — Biometric Face Enrollment Spec

**Handoff for Antigravity / mobile developers.**  
Technical integration guide for building the 3-Step Profile Face Scan Enrollment in the React Native mobile client.

---

## 0. Overview

| Item | Value |
|------|-------|
| Screen | **Biometric Enrollment** (`/settings/face-enroll` inside settings/profile stack) |
| Core Flow | **3-Step Camera Capture:** Front Profile ➜ Left Profile ➜ Right Profile |
| Primary API | `POST/DELETE /api/employee/face-enroll` |
| Security | Self-Service: Any employee can enroll/delete their own face. Admin/HR can enroll/delete on behalf of others by passing `employeeId`. |

---

## 1. Enrollment UI Flow

The enrollment process must capture **three distinct angles** of the employee's face to establish a reliable baseline biometric template for punch verification.

```
Step 1: Look Straight          Step 2: Turn Left             Step 3: Turn Right
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│        [Camera]      │      │        [Camera]      │      │        [Camera]      │
│                      │      │                      │      │                      │
│        ( ◉_◉ )       │      │         ( ◉_ )       │      │         ( _◉ )       │
│                      │      │                      │      │                      │
│                      │      │                      │      │                      │
├──────────────────────┤      ├──────────────────────┤      ├──────────────────────┤
│ Capture Front Face   │      │ Capture Left Profile │      │ Capture Right Profile│
└──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

### UI Best Practices:
* **Camera Overlay:** Render a circular cut-out container (`borderWidth: 2`, `borderColor: colors.primaryLight` with rounded circular edges) to instruct the user where to position their face.
* **Progress Stepper:** Display a 3-part step progress indicator showing which angle is active and which are completed.
* **Lighting Check:** Display an eyebrow notice advising: *"Ensure you are in a well-lit area and avoid wearing hats or sunglasses."*

---

## 2. API Specifications

All requests require user authorization: `Authorization: Bearer <ansh_auth_token>`.

### 2.1 Enroll Face Profiles (`POST /api/employee/face-enroll`)
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Form Parameters:**
  * `photo1`: File binary (Front-facing photo)
  * `photo2`: File binary (Left profile photo)
  * `photo3`: File binary (Right profile photo)
  * `employeeId`: String (Optional. If omitted, defaults to the logged-in user. Admins or HR Managers can pass target IDs to enroll on behalf of team members).
  * `faceEmbedding`: JSON String representation of `number[]` (Optional. A 128-float coordinate array. If omitted, the backend server will automatically calculate the embedding vectors from the uploaded images).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Facial sign-in enrolled successfully",
    "employee": {
      "id": "emp_123",
      "faceEnrolled": true,
      "facePhotos": [
        "https://storage.anshapps.com/faces/emp_123/172055_front.jpg",
        "https://storage.anshapps.com/faces/emp_123/172055_left.jpg",
        "https://storage.anshapps.com/faces/emp_123/172055_right.jpg"
      ]
    }
  }
  ```
* **Error Response (422 Unprocessable Entity):**
  * Thrown if the server's face detection pipeline fails to recognize a face in any of the 3 images.
  ```json
  {
    "error": "Could not detect a face in the uploaded photos. Use clear, front-facing images with good lighting."
  }
  ```

### 2.2 Delete / Reset Face Profile (`DELETE /api/employee/face-enroll`)
* **Method:** `DELETE`
* **Query Params:**
  * `employeeId`: String (Optional. Defaults to self. Admin/HR can supply this parameter to clear other profiles).
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Face enrollment removed successfully"
  }
  ```

---

## 3. React Native Mobile Implementation

Because calculating high-dimensional neural network descriptors locally inside React Native requires loading heavy TensorFlow/WASM models, the mobile application should **capture the photos and upload them directly to the backend**, delegating the embedding calculations to the server.

### 3.1 Expo Camera Capture & Upload Code Example

```typescript
import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import * as SecureStore from "expo-secure-store";

export default function FaceEnrollmentScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need permission to use the camera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photoResult = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });

        const newPhotos = [...photos, photoResult.uri];
        setPhotos(newPhotos);

        if (step < 3) {
          setStep((prev) => (prev + 1) as any);
        } else {
          // All 3 captured, launch upload process
          await uploadFaceProfile(newPhotos);
        }
      } catch (err) {
        Alert.alert("Capture Error", "Failed to take photo.");
      }
    }
  };

  const uploadFaceProfile = async (capturedPhotos: string[]) => {
    try {
      const formData = new FormData();
      
      formData.append("photo1", {
        uri: capturedPhotos[0],
        name: "front.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("photo2", {
        uri: capturedPhotos[1],
        name: "left.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("photo3", {
        uri: capturedPhotos[2],
        name: "right.jpg",
        type: "image/jpeg",
      } as any);

      const token = await SecureStore.getItemAsync("ansh_auth_token");
      const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

      const res = await fetch(`${API_BASE}/api/employee/face-enroll`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseJson = await res.json();

      if (!res.ok) {
        throw new Error(responseJson.error || "Enrollment failed");
      }

      Alert.alert("Success", "Facial biometric profile enrolled successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert("Biometric Error", err.message || "Something went wrong.");
      // Reset captures on error to allow retrying
      setStep(1);
      setPhotos([]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        {step === 1 && "Look directly at the camera (Front Profile)"}
        {step === 2 && "Slowly tilt your head to the Left"}
        {step === 3 && "Slowly tilt your head to the Right"}
      </Text>
      
      <View style={styles.cameraFrame}>
        <CameraView style={styles.camera} ref={cameraRef} facing="front" />
        <View style={styles.cutoutOverlay} />
      </View>

      <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
        <Text style={styles.btnText}>Capture Angle {step}/3</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" },
  text: { color: "#ffffff", marginBottom: 20 },
  instruction: { color: "#38bdf8", fontSize: 16, fontWeight: "bold", marginHorizontal: 20, textAlign: "center", marginBottom: 30 },
  cameraFrame: { width: 300, height: 300, borderRadius: 150, overflow: "hidden", position: "relative", borderWidth: 4, borderColor: "#0d9488" },
  camera: { flex: 1 },
  cutoutOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 150 },
  captureBtn: { marginTop: 40, backgroundColor: "#0d9488", paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25 },
  btnText: { color: "#ffffff", fontWeight: "bold" },
  btn: { backgroundColor: "#0d9488", padding: 10, borderRadius: 5 }
});
```
