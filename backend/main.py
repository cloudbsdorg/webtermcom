from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from .models import sessions_db, create_session, get_session, add_sub_session, ConnectionParams
from .ssh_handler import handle_ssh_session
from .vnc_handler import handle_vnc_proxy
from .telnet_handler import handle_telnet_session
from .config import load_config, setup_logging, validate_config
from datetime import datetime, timezone
import json
import argparse
import sys
import uvicorn

# Parse command line arguments first to support --check-config and --dry-run
parser = argparse.ArgumentParser(description="WebTermCom Application")
parser.add_argument("--config", help="Path to the configuration file")
parser.add_argument("--check-config", action="store_true", help="Validate the configuration and exit")
parser.add_argument("--dry-run", action="store_true", help="Start with the config and exit immediately")
args, unknown = parser.parse_known_args()

if args.check_config:
    path = args.config if args.config else "config.json" # Default if not specified
    if validate_config(path):
        sys.exit(0)
    else:
        sys.exit(1)

config = load_config(args.config)
setup_logging(config.log_level)

if args.dry_run:
    print("Dry-run successful.")
    sys.exit(0)

app = FastAPI(title="WebTermCom API", description="Backend for managing terminal and console sessions")

if config.allow_cors:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.post("/sessions")
async def create_new_session(name: str = "New Session"):
    """
    Create a new top-level session.
    
    Args:
        name: Optional name for the session.
    
    Returns:
        The newly created session object and its ID.
    """
    session = create_session(name)
    return {"id": session.id, "session": session}

@app.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """
    Retrieve information about an existing session.
    
    Args:
        session_id: The unique ID of the session.
    
    Returns:
        The session object if found.
    
    Raises:
        HTTPException: 404 if the session does not exist.
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/sessions/{session_id}/subsessions")
async def create_subsession(session_id: str, params: ConnectionParams):
    """
    Add a new connection (sub-session) to an existing session.
    
    Args:
        session_id: The ID of the session to add the connection to.
        params: The connection parameters (type, host, port, etc.).
    
    Returns:
        The newly created sub-session object.
    
    Raises:
        HTTPException: 404 if the parent session does not exist.
    """
    sub = add_sub_session(session_id, params)
    if not sub:
        raise HTTPException(status_code=404, detail="Session not found")
    return sub

@app.websocket("/ws/{session_id}/{subsession_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, subsession_id: str):
    """
    WebSocket endpoint for interacting with a specific connection.
    
    Pipes data between the WebSocket and the underlying protocol (SSH, VNC, etc.).
    
    Args:
        websocket: The WebSocket connection.
        session_id: The parent session ID.
        subsession_id: The sub-session ID.
    """
    await websocket.accept()
    session = get_session(session_id)
    if not session or subsession_id not in session.sub_sessions:
        await websocket.close(code=4004)
        return
    
    sub = session.sub_sessions[subsession_id]
    sub.active = True
    session.last_active = datetime.now(timezone.utc)
    
    try:
        if sub.params.type == "ssh":
            await handle_ssh_session(websocket, sub.params)
        elif sub.params.type == "vnc":
            await handle_vnc_proxy(websocket, sub.params)
        elif sub.params.type == "telnet":
            await handle_telnet_session(websocket, sub.params)
        elif sub.params.type == "serial":
            # Server-side serial proxy logic could be added here
            pass
    except WebSocketDisconnect:
        pass
    finally:
        sub.active = False

@app.delete("/sessions/{session_id}")
async def delete_session_endpoint(session_id: str):
    """
    Delete a session and all its sub-sessions.
    """
    if session_id in sessions_db:
        del sessions_db[session_id]
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Session not found")

@app.delete("/sessions/{session_id}/subsessions/{subsession_id}")
async def delete_subsession_endpoint(session_id: str, subsession_id: str):
    """
    Delete a specific sub-session.
    """
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if subsession_id in session.sub_sessions:
        del session.sub_sessions[subsession_id]
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Sub-session not found")

if __name__ == "__main__":
    uvicorn.run(app, host=config.host, port=config.port)
