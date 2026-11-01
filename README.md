# 🎓 MET Campus App

An official campus companion application for **MET Institute of Technology (Adgaon, Nashik, Maharashtra)**. The app brings together student academics, attendance tracking, classroom announcements, timetables with laboratory batch rotations, campus event registrations, and TPO placement drives under a unified, role-based mobile interface.

---

## 📲 Download & Install the Android App

Directly install the standalone Android APK on any Android phone (no Google Play Store required).

### Option 1: Direct APK Download (Recommended)
👉 **[Download MET Campus APK (Latest v1.0.0)](https://expo.dev/artifacts/eas/JG4m97n4WN7rqnW1AjQ5vt6GOpADdfX1_hK8FJckWmM.apk)**

*(Or download [`met-campus.apk`](met-campus.apk) directly from this repository or the [GitHub Releases](https://github.com/rohansachinpatil/met-campus-app/releases) page).*

### 🛠️ How to Install on Android:
1. Tap the download link on your Android smartphone.
2. When the download completes, tap **Open** or find `met-campus.apk` in your **Downloads** folder.
3. If Android prompts **"For your security, your phone is not allowed to install unknown apps"**:
   - Tap **Settings** $\rightarrow$ Toggle on **"Allow from this source"**.
4. Tap **Install** (or **Update** if you already had an earlier version).
5. Open **MET Campus** and sign in!

---

## 🔐 How to Log In

The app features dedicated, pre-provisioned credentials for students, faculty, and student clubs.

### 👨‍🎓 For Students
- **Username:** Your official **PRN Number** (e.g., `2405240001`)
- **Initial Password:** Your **first name** + **last 2 digits of your PRN** in all lowercase
  - *Example 1:* Student *Prachi Mahesh Aher* with PRN ending in `01` $\rightarrow$ Password: `prachi01`
  - *Example 2:* Student *Rohan Sachin Patil* with PRN ending in `42` $\rightarrow$ Password: `rohan42`

> **Note:** On your first login, the app will ask you to set a personal, secure password (12+ characters) before unlocking your campus dashboard.

### 👩‍🏫 For Faculty & Staff
Choose **Faculty** on the login screen and enter your assigned username with the `_iot` department suffix:

| Department / Role | Username | Initial Password |
| :--- | :--- | :--- |
| **Principal Office** | `principal_iot` | `METCAMPUS` |
| **Training & Placement Officer (TPO)** | `tpo_iot` | `METCAMPUS` |
| **HOD · Computer Science & Design (CSD)** | `hodcsd_iot` | `METCAMPUS` |
| **HOD · Computer Science & Engineering (CSE)** | `hodcse_iot` | `METCAMPUS` |
| **HOD · Automation & Robotics (AR)** | `hodar_iot` | `METCAMPUS` |
| **Head of School · Civil & Environmental (CEE)** | `hodcee_iot` | `METCAMPUS` |
| **HOD · Electronics & Computer Eng (ECE)** | `hodece_iot` | `METCAMPUS` |
| **Class Coordinator · S.E. CSD** | `cccsd_iot` | `METCAMPUS` |
| **Class Coordinator · Automation & Robotics** | `ccarsa_iot` | `METCAMPUS` |

### 🚀 For Campus Clubs
| Club | Username | Initial Password |
| :--- | :--- | :--- |
| **eCell MET** | `ecellmet_iot` | `METCAMPUS` |
| **TEDxMET Nashik** | `tedxmet_iot` | `METCAMPUS` |
| **Code Crafters** | `codecrafters_iot` | `METCAMPUS` |
| **STAPLE (T&P Cell)** | `staple_iot` | `METCAMPUS` |

---

## ✨ Features & Modules

- **Campus Dashboard:** Instant overview of daily schedule, upcoming classes, deadlines, and notifications.
- **Timetable & Lab Rotations:** Complete schedule with T1–T4 batch rotations for labs, seminars, and lectures.
- **Attendance Register:** Subject-wise lecture & lab attendance tracker with minimum 75% warning calculations.
- **Classroom & Course Material:** Faculty announcements, assignments, due date reminders, and notices.
- **Curriculum:** Full eight-semester syllabus breakdown.
- **TPO Placement Portal:** Real-time placement drives, eligibility criteria, CTC details, and one-tap application submission.
- **Club Hub:** Upcoming events, workshops, registrations, and ticketing.
- **Offline & Hardware-Backed Security:** Fast native WebView shell using `expo-secure-store` with encrypted session storage.

---

## 💻 Developer Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- Expo CLI (`npx expo`)
- Mobile device with the **Expo Go** app installed

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rohansachinpatil/met-campus-app.git
cd met-campus-app
npm install
```

### 2. Build the Web Portal Assets
Whenever you modify files in `web/`:
```bash
npm run build
```

### 3. Run in Expo Go
```bash
npx expo start -c
```
Scan the QR code displayed in your terminal with **Expo Go** (Android) or the default Camera app (iOS).

### 4. Build a New Standalone APK via EAS
```bash
npx eas-cli build -p android --profile apk
```

---

## 🏛️ Institute Details
**MET Institute of Technology**  
*Bhujbal Knowledge City, Adgaon, Nashik, Maharashtra 422003*
