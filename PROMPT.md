# WebTermCom Application

This document describes everything needed to recreate the WebTermCom application, a web-based terminal and console viewer supporting SSH, VNC, and Serial connections.

## Core Tech Stack
- **Backend**: Python 3.13, FastAPI, asyncssh, websockets.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
- **Protocols**: 
  - SSH: xterm.js (frontend) + asyncssh (backend).
  - VNC: noVNC (frontend) + basic TCP proxy (backend).
  - Serial: Web Serial API (client-side only).

## Re-creation Steps

### 1. Backend Setup
1. Create a `backend/` directory.
2. Define Pydantic models in `models.py` for `Session`, `SubSession`, and `ConnectionParams`.
3. Implement `main.py` with FastAPI endpoints:
   - `POST /sessions`: Create a new session.
   - `GET /sessions/{id}`: Get session state.
   - `POST /sessions/{id}/subsessions`: Add a connection.
   - `WebSocket /ws/{sessionId}/{subId}`: Protocol multiplexing.
4. Implement `ssh_handler.py` using `asyncssh` to pipe data between WebSocket and SSH.
5. Implement `vnc_handler.py` as a binary TCP proxy for VNC traffic.

### 2. Frontend Setup
1. Initialize a Vite project with React and TypeScript.
2. Install dependencies: `@xterm/xterm`, `@xterm/addon-fit`, `@novnc/novnc`, `lucide-react`, `tailwindcss`.
3. Create components:
   - `TerminalComponent.tsx`: Integrates xterm.js and connects to the SSH WebSocket.
   - `VNCComponent.tsx`: Integrates noVNC's RFB client.
   - `SerialComponent.tsx`: Uses `navigator.serial` for browser-based serial access.
   - `Sidebar.tsx`: Manages session list and adds new connections.
   - `Viewport.tsx`: Switches between active connections.
   - `App.tsx`: Main layout and session state management.
4. Set up `api.ts` for backend communication.

### 3. State Management
- Use a unique session ID in the URL (`?s=UUID`).
- On mount, `App.tsx` should fetch the session state or create a new one if missing.
- When adding a connection, update the backend and refresh the local state.
- Automatically update the URL when switching sub-sessions.

### 4. Styling
- Use Tailwind CSS for a dark-themed, terminal-like UI.
- Implement a collapsible sidebar for better use of screen real estate.

### 5. Deployment & Development
- Use a `Makefile` to automate `install`, `build`, and `run` commands.
- Use `Containerfile` for consistent environment setup (Python 3.13 + Node 22).
- Configure `.idea/runConfigurations` for IntelliJ/PyCharm.

## Critical Notes
- **Web Serial**: Must run on the client side (browser) because the server cannot access the user's local hardware ports.
- **VNC Proxy**: The backend must handle binary WebSocket messages and proxy them to the VNC TCP port (default 5900).
- **SSH Resize**: Send a special string (e.g., `__RESIZE__:rows:cols`) over the WebSocket to inform the backend to resize the PTY.
