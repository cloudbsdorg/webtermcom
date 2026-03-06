# WebTermCom Application

This document describes everything needed to recreate the WebTermCom application, a web-based terminal and console viewer supporting SSH, VNC, Telnet, and Serial connections.

## Core Tech Stack
- **Backend**: Python 3.13, FastAPI, asyncssh, websockets, Pydantic.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
- **Protocols**: 
  - **SSH**: `@xterm/xterm` (frontend) + `asyncssh` (backend).
  - **VNC**: `@novnc/novnc` (frontend) + basic TCP proxy (backend).
  - **Telnet**: `@xterm/xterm` (frontend) + basic TCP proxy (backend).
  - **Serial**: Web Serial API (client-side only via `navigator.serial`).

## Re-creation Steps

### 1. Backend Setup
1. Create a `backend/` directory.
2. Define Pydantic models in `models.py` for `Session`, `SubSession`, and `ConnectionParams`. Ensure `ConnectionParams` includes protocol-specific fields like `baudRate`, `dataBits`, `stopBits`, and `parity` for Serial.
3. Implement `main.py` with FastAPI endpoints:
   - `POST /sessions`: Create a new session.
   - `GET /sessions/{id}`: Get session state.
   - `POST /sessions/{id}/subsessions`: Add a connection.
   - `DELETE /sessions/{id}`: Delete a session.
   - `DELETE /sessions/{id}/subsessions/{subId}`: Terminate and remove a specific connection.
   - `WebSocket /ws/{sessionId}/{subId}`: Protocol multiplexing for SSH, VNC, and Telnet.
4. Implement protocol handlers:
   - `ssh_handler.py`: Uses `asyncssh` to pipe data between WebSocket and SSH. Supports terminal resizing via `__RESIZE__` control messages.
   - `vnc_handler.py`: Acts as a binary TCP proxy between the WebSocket and a VNC server.
   - `telnet_handler.py`: Acts as a text-based TCP proxy between the WebSocket and a Telnet server.

### 2. Frontend Setup
1. Initialize a Vite project with React and TypeScript.
2. Install dependencies: `@xterm/xterm`, `@xterm/addon-fit`, `@novnc/novnc`, `lucide-react`, `tailwindcss`, `framer-motion`.
3. Create core components:
   - `TerminalComponent.tsx`: Integrates xterm.js and connects to the protocol WebSocket (SSH/Telnet). Handles automatic fitting and terminal resizing.
   - `VNCComponent.tsx`: Integrates noVNC's RFB client with scaling and viewport support.
   - `SerialComponent.tsx`: Uses the Web Serial API for direct browser-based serial access. Includes autodiscovery of authorized ports and configuration of baud, parity, etc.
   - `Sidebar.tsx`: Manages session list, allows adding new connections with intelligent default ports, and provides controls for sharing and deleting sessions.
   - `Viewport.tsx`: Dynamically switches between active connections based on protocol type.
   - `App.tsx`: Main layout, global session state management, and URL synchronization.
4. Set up `api.ts` for backend communication, dynamically determining hostnames and protocols (WS vs. WSS).

### 3. State Management
- **Persistence**: Store session and sub-session state in the backend.
- **URL Synchronization**: Use a unique session ID (`?s=UUID`) and sub-session ID (`&sub=UUID`) in the URL for instant sharing and navigation.
- **Reactivity**: Automatically update the local state when connections are added, removed, or switched.

### 4. Styling & UI/UX
- **Theme**: High-contrast, dark-themed UI with `bg-zinc-950` and solid borders to ensure readability.
- **Responsiveness**: A collapsible sidebar for optimized workspace usage.
- **Defaults**: Automatically populate default ports based on the selected protocol (SSH: 22, VNC: 5900, Telnet: 23).

### 5. Deployment & Development
- **Automation**: Use a `Makefile` to simplify `install`, `build`, `run`, and `test` commands.
- **Containerization**: Provide a `Containerfile` for Linux (multi-stage) and `Containerfile.freebsd` for FreeBSD environments.
- **IDE Support**: Pre-configure `.idea/runConfigurations` for standard development workflows.

## Critical Implementation Notes
- **Web Serial**: Must run on the client side because the server cannot access the user's local hardware ports. Connections are private to the browser session.
- **VNC Proxy**: The backend must handle binary WebSocket messages (`receive_bytes`/`send_bytes`) to correctly proxy VNC traffic.
- **Terminal Resize**: Send a special control string `__RESIZE__:rows:cols` over the WebSocket. The backend should intercept this and use `stdin.change_terminal_size` to update the remote PTY.
- **Security**: The current implementation is a development blueprint. For production, ensure host key verification for SSH, credential management for all protocols, and secure WebSocket (WSS) usage.
