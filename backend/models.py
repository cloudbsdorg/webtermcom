import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ConnectionParams(BaseModel):
    """
    Parameters for establishing a connection to a remote host.
    """
    type: str  # "ssh", "vnc", "serial", "telnet"
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    device: Optional[str] = None  # For serial if needed server-side, though web-serial is client-side
    baudRate: Optional[int] = None
    dataBits: Optional[int] = None
    stopBits: Optional[int] = None
    parity: Optional[str] = None

class SubSession(BaseModel):
    """
    Represents an individual connection (SSH, VNC, or Serial) within a parent session.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    params: ConnectionParams
    active: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

class Session(BaseModel):
    """
    A top-level container that can hold multiple connections (sub-sessions).
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    sub_sessions: Dict[str, SubSession] = {}
    created_at: datetime = Field(default_factory=datetime.now)
    last_active: datetime = Field(default_factory=datetime.now)

# In-memory storage for sessions (for simplicity in this task, but should be a DB in production)
sessions_db: Dict[str, Session] = {}

def create_session(name: str) -> Session:
    """
    Create a new Session and store it in the in-memory database.
    """
    session = Session(name=name)
    sessions_db[session.id] = session
    return session

def get_session(session_id: str) -> Optional[Session]:
    """
    Retrieve a Session by its ID.
    """
    return sessions_db.get(session_id)

def add_sub_session(session_id: str, params: ConnectionParams) -> Optional[SubSession]:
    """
    Create and add a new SubSession to an existing Session.
    """
    session = get_session(session_id)
    if not session:
        return None
    sub = SubSession(params=params)
    session.sub_sessions[sub.id] = sub
    return sub
