# 🌟 ZenStick - The Glassmorphic Floating Notes App

<div align="center">
  <img src="<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/c8e411e2-6960-4f6f-bc6e-954deb03a200" />
" alt="ZenStick Main Dashboard" width="800"/>
</div>

<br />

> **A blazing-fast, lightweight desktop notes application featuring a transparent floating widget, built to boost productivity without cluttering your workspace.**

## 🎓 About The Project

ZenStick is a passion project built during my Computer Science degree to solve a personal friction point: wanting a sticky note that stays on top of my windows without looking ugly. 

I wanted to move away from bulky Electron apps and explore native OS performance. By leveraging **Tauri v2** and **Rust**, ZenStick achieves a minimal memory footprint while delivering a premium, glassmorphic UI using React and Tailwind CSS. 

### ✨ Key Features
* **Floating Transparent Widget:** A dedicated widget window that stays precisely where you leave it, remembering its native OS coordinates.
* **Smart Dashboard:** Time-based personalized greetings and at-a-glance workspace statistics.
* **Blazing Fast Local Storage:** Zero cloud lag. Your notes and snapshots are saved instantly to your local machine.
* **Glassmorphic UI:** A beautiful, distraction-free interface with customizable note colors and smooth animations.
* **Interactive Guide:** Built-in tutorial tour for seamless onboarding.

---

## 🛠️ Tech Stack

This project was a deep dive into modern desktop app architecture:
* **Frontend:** React (TypeScript), Vite, Tailwind CSS, Lucide Icons
* **Backend / Desktop Engine:** Tauri v2, Rust
* **Window Management:** `tauri-plugin-window-state` (Native OS positioning)

---

## 📸 Sneak Peek

### The Workspace
<img src="<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/385ea3f8-28bf-4143-b094-2a796a51a533" />
" alt="Editor View" width="800"/>

### The Floating Widget in Action
*(Add a GIF here showing the widget moving around the screen)*
<img src="
" alt="Floating Widget" width="800"/>

---
## 📥 Download & Install

**Don't want to mess with code?** Simply download the ready-to-use Windows installer!
1. Go to the [Releases page](../../releases/latest).
2. Download `ZenStick_x64-setup.exe`.
3. Install and enjoy!

## 💻 For Developers (Run Locally)

If you want to view the source code or run it locally, make sure you have Node.js and Rust installed on your machine.

1. **Clone the repo:**
   ```bash
   git clone [https://github.com/bytebandit-07/zenstick.git](https://github.com/bytebandit-07/zenstick.git)

2. **Install dependencies:**
   ```bash
   npm install

4. **Run in Development Mode:**
   ```bash
   npx tauri dev
   
5. **Build the executable:**
   ```bash
   npx tauri build
