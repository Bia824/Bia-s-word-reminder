# Work Reminder Todo

A simple desktop-oriented work reminder tool designed to help manage task priority and reduce workflow chaos.

---

## Storage and Privacy

This project is a private, single-user tool:

* No account, sign-up, or login
* No Supabase or other cloud backend
* Tasks are stored only in the browser's `localStorage`
* Opening the page is enough to start using it

Local data belongs to the current browser profile and website origin. Clearing browser
site data, switching browsers, or using another device will not carry tasks across.

---

## Desktop App

The Electron desktop version stores tasks locally and does not require a server.

Install dependencies:

```bash
npm install
```

Run the desktop app during development:

```bash
npm start
```

Build the Windows installer:

```bash
npm run dist
```

The generated installer is saved as `dist/PriorityPlannerSetup.exe`.

Browser tasks and desktop-app tasks use different local storage locations, so existing
browser tasks are not automatically copied into the desktop app.

Starting with version `1.1.0`, the installed desktop app checks the public GitHub
Releases page for updates. New releases must include the Windows installer,
`latest.yml`, and the installer blockmap file.

---

## 🎯 Purpose

This tool is designed for people who:

* Struggle with task prioritization
* Frequently switch between tasks (multitasking chaos)
* Have difficulty finishing tasks on time

The goal is to provide a **clear, structured workflow** and help focus on **what should be done first**.

---

## 🧩 Core Features

### 1. Task Input

User can create a task with:

* Task title
* Deadline

---

### 2. Automatic Priority Sorting

Tasks are automatically categorized into:

* 🔴 High Priority Tasks (urgent / near deadline)
* 🟡 Non-Urgent Tasks

Sorting is based on deadline proximity.

---

### 3. Task Boards

The interface is divided into two sections:

1. High Priority Tasks
2. Non-Urgent Tasks

Each section automatically sorts tasks by urgency.

---

### 4. Task Notes (Important)

Each task can be clicked to open a **note page**, where users can:

* Record progress
* Write current status
* Note interruption points

This helps resume work after unexpected interruptions.

---

### 5. Task Completion System

Each task includes a status indicator:

* ⚪ Incomplete (empty circle)
* ⚫ Completed (filled circle)

When a task is marked as completed:

* It becomes visually dimmed
* It moves to the bottom of its section

---

## 🧠 Workflow Logic

```text
Input Task + Deadline
→ System evaluates urgency
→ Task is auto-sorted into sections
→ User can add notes during interruptions
→ Task marked complete when finished
→ Completed tasks move to bottom
```

---

## 🚀 Future Improvements

* Desktop widget (always-on-top window)
* Notification reminders
* Drag & drop task priority
* Daily task summary

---

## 🛠 Tech Stack (Planned)

* Frontend: HTML / CSS / JavaScript
* Storage: Browser `localStorage`
* Version Control: GitHub
* Desktop App: Electron (later stage)
