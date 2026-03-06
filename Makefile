# Makefile for WebTermCom

PYTHON = python3
PIP = $(PYTHON) -m pip
NPM = npm
UVICORN = $(PYTHON) -m uvicorn

.PHONY: help install build run run-backend run-frontend test test-backend test-frontend clean

help:
	@echo "Usage:"
	@echo "  make install        Install dependencies for backend and frontend"
	@echo "  make build          Build frontend assets"
	@echo "  make run            Run both backend and frontend (requires tmux or similar for parallel)"
	@echo "  make run-backend    Run FastAPI backend"
	@echo "  make run-frontend   Run Vite frontend"
	@echo "  make test           Run all tests"
	@echo "  make test-backend   Run backend tests with pytest"
	@echo "  make test-frontend  Run frontend tests with vitest"
	@echo "  make clean          Clean build artifacts and caches"

install: install-backend install-frontend

install-backend:
	$(PIP) install -r requirements.txt
	$(PIP) install pytest pytest-asyncio httpx

install-frontend:
	$(NPM) install

build:
	$(NPM) run build

run:
	@echo "To run both, it's recommended to use separate terminals or a process manager."
	@echo "Starting backend on :8000 and frontend on :5173..."
	(trap 'kill 0' SIGINT; $(MAKE) run-backend & $(MAKE) run-frontend)

run-backend:
	$(UVICORN) backend.main:app --reload --host 0.0.0.0 --port 8000

run-frontend:
	$(NPM) run dev

test: test-backend test-frontend

test-backend:
	$(PYTHON) -m pytest tests/

test-frontend:
	$(NPM) test -- --run

clean:
	rm -rf dist/
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".vitest_cache" -exec rm -rf {} +
