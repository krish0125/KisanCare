"""
Single-Command Project Runner for KisanCare
-------------------------------------------
Runs both Frontend (Live Server on port 5500) and Backend (Flask on port 5001)
in a single command with auto-reloading and browser launch.

Usage:
    python run.py
"""

import os
import sys
import time
import shutil
import signal
import subprocess
import webbrowser
from pathlib import Path

# Determine project base directory
BASE_DIR = Path(__file__).resolve().parent
if not (BASE_DIR / "backend").exists() and (BASE_DIR / "Collage Project 2026-27" / "backend").exists():
    BASE_DIR = BASE_DIR / "Collage Project 2026-27"

FRONTEND_DIR = BASE_DIR / "frontend"
BACKEND_DIR = BASE_DIR / "backend"

# Determine python interpreter (prefer .venv if available)
venv_py = BASE_DIR / ".venv" / "Scripts" / "python.exe"
if not venv_py.exists():
    venv_py = BASE_DIR / ".venv" / "bin" / "python"
if not venv_py.exists():
    PYTHON_EXE = sys.executable
else:
    PYTHON_EXE = str(venv_py)

print("=" * 60)
print("  🌿 KisanCare - Starting Full Stack Application 🌿")
print("=" * 60)
print(f"[*] Base Directory: {BASE_DIR}")
print(f"[*] Python Runtime: {PYTHON_EXE}")

processes = []

def cleanup(signum=None, frame=None):
    print("\n[!] Shutting down all servers...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=2)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    print("[✓] All servers stopped. Goodbye!")
    sys.exit(0)

# Register signals for clean Ctrl+C shutdown
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# 1. Start Backend Server
env = os.environ.copy()
env["PYTHONPATH"] = str(BASE_DIR)
env["PYTHONIOENCODING"] = "utf-8"

print("\n[1/2] Starting Flask Backend API (Port 5001)...")
backend_cmd = [PYTHON_EXE, str(BASE_DIR / "backend" / "app.py")]
backend_proc = subprocess.Popen(
    backend_cmd,
    cwd=str(BASE_DIR),
    env=env
)
processes.append(backend_proc)

# Give backend a moment to initialize
time.sleep(2)

# 2. Start Frontend Server
print("[2/2] Starting Frontend Live Server (Port 5500)...")
npx_cmd = shutil.which("npx") or shutil.which("npx.cmd")

if npx_cmd:
    # Use npx live-server for auto-reload
    frontend_proc = subprocess.Popen(
        ["npx.cmd" if os.name == "nt" else "npx", "-y", "live-server", "--port=5500", "--open=index.html", "--no-css-inject"],
        cwd=str(FRONTEND_DIR),
        shell=(os.name == "nt")
    )
    processes.append(frontend_proc)
else:
    # Fallback to python http.server
    frontend_proc = subprocess.Popen(
        [PYTHON_EXE, "-m", "http.server", "5500"],
        cwd=str(FRONTEND_DIR)
    )
    processes.append(frontend_proc)
    webbrowser.open("http://localhost:5500/index.html")

print("\n" + "=" * 60)
print("  🚀 Both Frontend & Backend are RUNNING!")
print("=" * 60)
print("  • Frontend Live Server: http://localhost:5500")
print("  • Backend Flask API:    http://localhost:5001")
print("  • Press Ctrl + C to stop both servers safely.")
print("=" * 60 + "\n")

try:
    while True:
        time.sleep(1)
        # Check if any process died unexpectedly
        for p in processes:
            if p.poll() is not None:
                pass
except KeyboardInterrupt:
    cleanup()
