from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from .models import sessions_db, create_session, get_session, add_sub_session, ConnectionParams
from .ssh_handler import handle_ssh_session
from .vnc_handler import handle_vnc_proxy
from datetime import datetime
import json

app = FastAPI(title="WebTermCom API", description="Backend for managing terminal and console sessions")

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
    session.last_active = datetime.now()
    
    try:
        if sub.params.type == "ssh":
            await handle_ssh_session(websocket, sub.params)
        elif sub.params.type == "vnc":
            await handle_vnc_proxy(websocket, sub.params)
        elif sub.params.type == "serial":
            # Server-side serial proxy logic could be added here
            pass
    except WebSocketDisconnect:
        pass
    finally:
        sub.active = False
