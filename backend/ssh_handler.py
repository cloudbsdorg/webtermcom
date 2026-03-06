import json
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
import asyncssh

async def pipe_ssh_to_ws(ssh_session, websocket: WebSocket):
    try:
        while True:
            data = await ssh_session.read(4096)
            if not data:
                break
            await websocket.send_text(data)
    except Exception:
        pass

async def pipe_ws_to_ssh(websocket: WebSocket, ssh_session):
    try:
        while True:
            data = await websocket.receive_text()
            ssh_session.write(data)
    except Exception:
        pass

class MySSHClientSession(asyncssh.SSHClientSession):
    def __init__(self, websocket):
        self._websocket = websocket

    def data_received(self, data, datatype):
        # This is another way to handle data
        pass

    def terminal_size_changed(self, width, height, pixwidth, pixheight):
        # Handle terminal size changes from the server side if needed
        pass

async def handle_ssh_session(websocket: WebSocket, params):
    """
    Handle an SSH session over a WebSocket.
    
    Establishes an SSH connection to the remote host and pipes data between
    the SSH session and the WebSocket.
    
    Args:
        websocket: The WebSocket connection to the frontend.
        params: SSH connection parameters (host, port, username, password).
    """
    try:
        async with asyncssh.connect(
            params.host,
            port=params.port or 22,
            username=params.username,
            password=params.password,
            known_hosts=None,
            agent_forwarding=True,
            client_keys=None, # In production, use managed keys
            preferred_auth=['password', 'publickey', 'keyboard-interactive']
        ) as conn:
            stdin, stdout, stderr = await conn.open_session(
                term_type='xterm-256color',
                encoding='utf-8'
            )
            # Using a simple piping task
            t1 = asyncio.create_task(pipe_stdout_to_ws(stdout, websocket))
            t2 = asyncio.create_task(pipe_ws_to_stdin(websocket, stdin, conn))
            await asyncio.gather(t1, t2)
    except Exception as e:
        import traceback
        error_msg = f"\r\n[SSH Connection Error to {params.host}: {str(e)}]\r\n"
        print(f"SSH Error: {str(e)}")
        traceback.print_exc()
        await websocket.send_text(error_msg)
        await websocket.close()

async def pipe_stdout_to_ws(stdout, websocket):
    """
    Pipe data from SSH stdout to the WebSocket.
    """
    try:
        while True:
            data = await stdout.read(4096)
            if not data:
                break
            await websocket.send_text(data)
    except Exception:
        pass

async def pipe_ws_to_stdin(websocket, stdin, conn=None):
    """
    Pipe data from the WebSocket to SSH stdin.
    
    Handles special control messages like '__RESIZE__:'.
    """
    try:
        while True:
            data = await websocket.receive_text()
            # Handle special commands like terminal resize
            if data.startswith("__RESIZE__:"):
                try:
                    parts = data.split(":")
                    if len(parts) >= 3:
                        rows = int(parts[1])
                        cols = int(parts[2])
                        if hasattr(stdin, 'change_terminal_size'):
                            stdin.change_terminal_size(cols, rows)
                        elif conn:
                            # Try setting it on the connection if stdin doesn't have it directly
                            # asyncssh usually has it on the SSHClientSession
                            pass 
                except (ValueError, IndexError):
                    pass
                continue
            stdin.write(data)
    except Exception:
        pass
