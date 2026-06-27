# 🪄 Zenstick: Your Mind, Glassmorphed.

[![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](#)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

*A blazingly fast, beautifully crafted local desktop notes app that respects your focus.*

<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/f86e5069-64bb-45eb-9964-9990e9a0e10d" />
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/eabcad5a-0fea-40e9-88f6-8649a7afdb87" />
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/cbb53894-e92c-496f-9c33-9a8b54569bf7" />





## ⚡ The Vision
Modern note-taking apps are bloated, slow, and live on the cloud. I wanted a space that feels personal, opens instantly, and stays out of the way. Zenstick combines native desktop performance with a stunning glassmorphic UI, strictly keeping your data stored locally on your machine.

## ✨ Core Features
*   **Glassmorphic Design:** A translucent, blur-heavy aesthetic that blends with your desktop.
*   **Native Performance:** Powered by Tauri (Rust core) for minimal RAM footprint and instant startup.
*   **Local First:** No accounts, no cloud syncs. Your data stays on your hard drive (SQLite).
*   **Smart Utility Panels:** Fully collapsible sidebars for a 100% distraction-free "Zen" mode.
*   **Built-in Markdown Export:** Convert your thoughts to clean `.md` files in a single click.
*   **Time-Travel History:** Every change is snapshotted. Never lose a thought again.

## ⌨️ Power-User Shortcuts
Zenstick is built for the keyboard.

| Action | Shortcut |
| :--- | :--- |
| **New Note** | `Alt + N` |
| **Toggle Settings Panel** | `Alt + P` |
| **Move to Trash** | `Alt + D` |
| **Search Notes** | `Alt + F` |

## 🚀 Getting Started (Local Development)

### Prerequisites
Before you begin, ensure you have the following installed on your system:
1. [Node.js](https://nodejs.org/) (v16 or higher)
2. [Rust](https://www.rust-lang.org/)
3. **Tauri OS Dependencies:** Tauri requires specific system-level build tools to compile the desktop app (e.g., C++ Build Tools on Windows). 
   👉 **[Click here to see the Official Tauri Prerequisites for your OS](https://v2.tauri.app/start/prerequisites/)**

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/bytebandit-07/zenstick.git
   ```

2. **Install dependencies:**
   ```bash
   cd zenstick
   npm install

4. **Run in Development Mode:**
   ```bash
   npx tauri dev
   
5. **Build the executable:**
   ```bash
   npx tauri build
