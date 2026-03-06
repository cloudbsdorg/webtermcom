import asyncio
from fastapi import WebSocket

async def handle_telnet_session(websocket: WebSocket, params):
    """
    Handle a Telnet session over a WebSocket.
    
    Establishes a raw TCP connection to the remote host and pipes data 
    between the TCP connection and the WebSocket.
    
    Args:
        websocket: The WebSocket connection.
        params: Telnet connection parameters (host, port).
    """
    try:
        reader, writer = await asyncio.open_connection(
            params.host,
            params.port or 23
        )
        
        async def pipe_ws_to_telnet():
            try:
                while True:
                    data = await websocket.receive_text()
                    writer.write(data.encode('utf-8'))
                    await writer.drain()
            except Exception:
                pass
        
        async def pipe_telnet_to_ws():
            try:
                while True:
                    data = await reader.read(4096)
                    if not data:
                        break
                    # We send text to the terminal component
                    # Note: Telnet may send binary control sequences
                    # For a simple terminal, we'll try to decode it
                    await websocket.send_text(data.decode('utf-8', errors='replace'))
            except Exception:
                pass
                
        await asyncio.gather(pipe_ws_to_telnet(), pipe_telnet_to_ws())
    except Exception as e:
        await websocket.send_text(f"\r\n[Telnet Connection Error to {params.host}: {str(e)}]\r\n")
        await websocket.close()
    finally:
        try:
            writer.close()
            await writer.wait_closed()
        except:
            pass
