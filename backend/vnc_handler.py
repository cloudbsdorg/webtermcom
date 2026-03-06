import asyncio
from fastapi import WebSocket
import socket

async def handle_vnc_proxy(websocket: WebSocket, params):
    """
    Acts as a proxy between a VNC server and a WebSocket client.
    
    Tunnels binary VNC traffic between the WebSocket and a TCP connection
    to the remote VNC server.
    
    Args:
        websocket: The WebSocket connection.
        params: VNC connection parameters (host, port).
    """
    try:
        reader, writer = await asyncio.open_connection(
            params.host,
            params.port or 5900
        )
        
        async def pipe_ws_to_vnc():
            try:
                while True:
                    data = await websocket.receive_bytes()
                    writer.write(data)
                    await writer.drain()
            except Exception:
                pass
        
        async def pipe_vnc_to_ws():
            try:
                while True:
                    data = await reader.read(4096)
                    if not data:
                        break
                    await websocket.send_bytes(data)
            except Exception:
                pass
                
        await asyncio.gather(pipe_ws_to_vnc(), pipe_vnc_to_ws())
    except Exception as e:
        await websocket.close()
    finally:
        writer.close()
        await writer.wait_closed()
