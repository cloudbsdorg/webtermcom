import pytest
from backend.models import create_session, add_sub_session, ConnectionParams, get_session, sessions_db
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_session_creation():
    # Clear DB for tests
    sessions_db.clear()
    session = create_session("Test")
    assert session.name == "Test"
    assert len(session.id) > 0

def test_add_sub_session():
    sessions_db.clear()
    session = create_session("Test")
    params = ConnectionParams(type="ssh", host="localhost")
    sub = add_sub_session(session.id, params)
    assert sub is not None
    assert sub.params.type == "ssh"
    assert sub.id in session.sub_sessions

def test_api_create_session():
    sessions_db.clear()
    response = client.post("/sessions?name=TestAPI")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["session"]["name"] == "TestAPI"

def test_api_get_session():
    sessions_db.clear()
    session = create_session("TestAPI")
    response = client.get(f"/sessions/{session.id}")
    assert response.status_code == 200
    assert response.json()["id"] == session.id

def test_api_add_subsession_serial():
    sessions_db.clear()
    session = create_session("TestSerial")
    params = {
        "type": "serial", 
        "baudRate": 9600, 
        "dataBits": 8, 
        "stopBits": 1, 
        "parity": "none"
    }
    response = client.post(f"/sessions/{session.id}/subsessions", json=params)
    assert response.status_code == 200
    data = response.json()
    assert data["params"]["type"] == "serial"
    assert data["params"]["baudRate"] == 9600
    assert data["params"]["parity"] == "none"

def test_api_delete_subsession():
    sessions_db.clear()
    session = create_session("TestDelete")
    params = {"type": "ssh", "host": "localhost"}
    sub = add_sub_session(session.id, ConnectionParams(**params))
    
    response = client.delete(f"/sessions/{session.id}/subsessions/{sub.id}")
    assert response.status_code == 200
    assert sub.id not in sessions_db[session.id].sub_sessions

def test_api_add_subsession_telnet():
    sessions_db.clear()
    session = create_session("TestTelnet")
    params = {
        "type": "telnet", 
        "host": "localhost",
        "port": 23
    }
    response = client.post(f"/sessions/{session.id}/subsessions", json=params)
    assert response.status_code == 200
    data = response.json()
    assert data["params"]["type"] == "telnet"
    assert data["params"]["host"] == "localhost"
    assert data["params"]["port"] == 23

def test_api_delete_session():
    sessions_db.clear()
    session = create_session("TestDeleteSession")
    response = client.delete(f"/sessions/{session.id}")
    assert response.status_code == 200
    assert session.id not in sessions_db
