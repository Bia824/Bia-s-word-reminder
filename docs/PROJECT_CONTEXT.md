# Priority Planner Project Context

Last updated: 2026-06-13

## Purpose

Priority Planner, also called Work Reminder, is a private single-user task planning
application.

Product goals:

- Open and use immediately
- No registration or login
- No server dependency
- Store task data locally
- Provide clear priority and deadline information
- Support Windows desktop installation

The project should remain simple and personal. Do not add multi-user accounts,
permissions, or a cloud backend unless the product direction explicitly changes.

## Repository

- GitHub repository: `https://github.com/Bia824/Bia-s-word-reminder`
- Main branch: `main`
- Latest documented source commit before this change: `59a2128`
- Target GitHub Release: `v1.1.1`
- Releases page: `https://github.com/Bia824/Bia-s-word-reminder/releases`

## Technology

- UI: HTML, CSS, vanilla JavaScript
- Desktop container: Electron
- Windows installer: electron-builder with NSIS
- Automatic updates: electron-updater with public GitHub Releases
- Task storage: browser/Electron `localStorage`

Do not introduce React, Vue, Angular, Next.js, or another large frontend framework.

## Main Files

- `index.html`: application page structure
- `style.css`: blue and white glassmorphism UI
- `script.js`: task management and local storage logic
- `main.js`: Electron window and automatic update logic
- `package.json`: dependencies, version, build, and GitHub publish configuration
- `README.md`: user-facing project and build instructions

Generated or downloaded files that must not be committed:

- `node_modules/`
- `dist/`
- `electron-*-win32-*.zip`
- `.tools/`

## Current Features

- Create tasks with title, optional note, and deadline date/time
- Double-click a task title to edit it inline
- Complete and reopen tasks
- Abandon and restore tasks without deleting their history
- Delete tasks
- Change task deadlines with the shared custom date/time picker
- Edit task notes inside task cards
- Use `Shift + Enter` to insert a note line break
- Use `Enter` to save a note
- Use `Escape` to cancel note editing
- Preserve note line breaks when displayed
- Automatically classify overdue, today, tomorrow, and later tasks
- Highlight unfinished overdue tasks with a soft overdue badge, warning hint,
  and warm status styling
- Visually distinguish active, overdue, completed, and abandoned task cards
- Show a single task list sorted by deadline urgency
- The task list extends naturally with the page; there is no internal list scrollbar
- Sort unfinished non-overdue tasks by earliest deadline first, then overdue tasks,
  then completed and abandoned tasks last
- Use clickable view filters for all tasks, pending, overdue, abandoned, and
  focus mode
- Hide the non-urgent task board in focus mode
- Responsive soft blue and white rounded-card interface
- Install as a Windows desktop application
- Check GitHub Releases for updates after startup

## Data Storage

There is no backend or database.

Tasks are stored in `localStorage`. Browser data and Electron desktop data use
different storage locations and do not synchronize automatically.

Consequences:

- GitHub stores source code and release installers, not user tasks.
- Clearing site or application data can remove tasks.
- Moving to another computer does not transfer tasks.
- Reinstalling or updating the desktop application should normally preserve tasks
  because application data is outside the installation directory.

A future useful feature is JSON export and import for local backup and migration.

## Desktop Application

Development start command:

```powershell
npm.cmd start
```

Windows build command:

```powershell
npm.cmd run dist
```

Expected build outputs:

```text
dist/PriorityPlannerSetup.exe
dist/PriorityPlannerSetup.exe.blockmap
dist/latest.yml
dist/win-unpacked/
```

The installer supports choosing an installation directory and creates desktop and
Start Menu shortcuts.

The application currently uses the default Electron icon.

## Automatic Updates

Automatic updates were introduced in version `1.1.0`.

Update source:

```text
https://github.com/Bia824/Bia-s-word-reminder/releases
```

Behavior:

1. The packaged desktop application starts.
2. After approximately three seconds, it checks GitHub Releases.
3. If a newer version exists, the user is asked whether to download it.
4. After download, the user is asked whether to restart and install it.

Users of versions earlier than `1.1.0` must manually install `1.1.0` once. Later
versions can update from inside the application.

Every update Release must include:

- `PriorityPlannerSetup.exe`
- `PriorityPlannerSetup.exe.blockmap`
- `latest.yml`

The GitHub repository must remain public for the current unauthenticated update
configuration.

## Release Process

1. Finish and test the requested changes.
2. Update the version in `package.json`, for example from `1.1.0` to `1.1.1`.
3. Run syntax and diff checks:

```powershell
node --check main.js
node --check script.js
git diff --check
```

4. Build the installer:

```powershell
npm.cmd run dist
```

5. Verify `dist/latest.yml` contains the new version.
6. Commit and push source changes to `main`.
7. Create a matching GitHub Release tag, such as `v1.1.1`.
8. Upload the installer, blockmap, and `latest.yml`.
9. Mark the new Release as Latest.

Do not upload `dist/` files directly into Git history.

## Important Decisions

- The project was changed from a planned Supabase cloud application to a local-only
  application.
- There is no login, authentication, Supabase connection, backend, or database.
- Keep the existing HTML/CSS/JavaScript architecture.
- Prefer minimal, targeted changes over large rewrites.
- Preserve task data compatibility when modifying storage logic.
- Do not install a new version before explaining any data migration risk.

## Known Issues and Limitations

- The first generated installer previously showed an unresponsive application during
  installation. This has not been fully diagnosed through automated browser or GUI
  testing.
- The application has no custom icon and currently uses the Electron default icon.
- The application is not code-signed, so Windows SmartScreen may show an unknown
  publisher warning.
- There is no task backup, import, export, or multi-device synchronization.
- Browser and desktop task data are separate.
- Automatic GUI testing is limited because the Codex in-app browser control process
  failed to start under the Windows sandbox.

## Guidance for a New Codex Conversation

Open this repository as the workspace, then ask Codex to read:

1. `docs/PROJECT_CONTEXT.md`
2. `README.md`
3. `package.json`
4. Recent Git history

Before editing, Codex should check `git status`, preserve uncommitted user changes,
and verify the current application version and latest GitHub Release.
