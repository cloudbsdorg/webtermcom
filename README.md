# WebTermCom

WebTermCom is a high-performance, web-based terminal and console viewer designed for the CloudBSD ecosystem. It provides a unified interface for managing multiple remote sessions, including SSH, VNC, Telnet, and Serial connections, all within a modern browser-based environment.

## 🚀 Features

- **Multi-Protocol Support**:
  - **SSH**: Full-featured terminal emulation via `xterm.js` and `asyncssh`.
  - **VNC**: Direct VNC access using `noVNC` with backend proxy support for credentialed access.
  - **Telnet**: Modern WebSocket-to-TCP proxying for legacy systems.
  - **Serial**: Direct hardware access using the **Web Serial API**, ensuring privacy and local execution without server-side port contention.
- **Advanced Session Management**:
  - **Unified Workspace**: Manage multiple connections (sub-sessions) within a single top-level session.
  - **Shareable URLs**: Every session and sub-session generates a unique ID, automatically updated in the URL for instant sharing.
  - **State Monitoring**: Real-time monitoring of connection activity.
- **Modern UI/UX**:
  - **Responsive Sidebar**: Collapsible navigation for managing and switching between sessions.
  - **High Contrast**: Optimized for readability with a sleek, dark-themed "premium" aesthetic.
  - **Intelligent Defaults**: Automatic application of industry-standard ports (SSH: 22, VNC: 5900, Telnet: 23).
- **Portable & Robust**:
  - **Containerized**: Ready for deployment on **Linux** and **FreeBSD**.
  - **Developer-Friendly**: Includes a `Makefile` for streamlined installation, building, and testing.

## 🛠 Tech Stack

- **Backend**: Python 3.13, FastAPI, `asyncssh`, `websockets`, Pydantic.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, `@xterm/xterm`, `@novnc/novnc`.
- **Infrastructure**: Makefile, Containerfile (Linux/FreeBSD), IntelliJ/PyCharm Run Configurations.

## 🏁 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 22+
- `make`

### Installation
```bash
make install
```

### Running the Application
To start both the backend and frontend development servers:
```bash
make run
```
- Backend will be available at `http://localhost:8000`
- Frontend will be available at `http://localhost:5173`

### Building for Production
```bash
make build
```
Production assets will be generated in the `dist/` directory.

### Testing
```bash
make test
```
This runs both the `pytest` suite for the backend and `vitest` for the frontend.

## 📁 Project Structure

- `backend/`: FastAPI application, models, and protocol handlers (SSH, VNC, Telnet).
- `frontend/`: React components, TypeScript types, and UI logic.
- `tests/`: Comprehensive unit tests for both frontend and backend.
- `Containerfile`, `Containerfile.freebsd`: Deployment configurations for Linux and FreeBSD.
- `Makefile`: Unified command interface for development tasks.
- `PROMPT.md`: Detailed documentation for recreating or extending the application.

## ⚖️ License

Distributed under the ISC License. See `package.json` for details.

---
Built with ❤️ for the CloudBSD project.
