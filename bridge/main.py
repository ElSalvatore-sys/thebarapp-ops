import os
import subprocess
from pathlib import Path
from typing import Optional

# Auto-load bridge/.env so the process works without shell env setup
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        if "=" in _line and not _line.startswith("#"):
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

import httpx
from fastapi import FastAPI, HTTPException, Request  # HTTPException kept for scraper-runs 503
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="TheBarApp Ops Bridge")

HETZNER_BASE = "https://api.thebarapp.de"
SCRAPER_TOKEN = os.environ.get("SCRAPER_TOKEN", "")

KNOWN_AGENTS = [
    "com.oasis.orderbird-scraper",
    "com.oasis.ordio-chrome-keeper",
    "com.oasis.ordio-hours-daily",
]

# --------------------------------------------------------------------------- #
# Helpers                                                                      #
# --------------------------------------------------------------------------- #

async def _proxy_get(path: str, extra_headers: Optional[dict] = None) -> dict:
    headers = extra_headers or {}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{HETZNER_BASE}{path}", headers=headers)
            resp.raise_for_status()
            return resp.json()
    except httpx.TimeoutException:
        return {"error": "timeout", "status": "unreachable"}
    except Exception as e:
        return {"error": str(e), "status": "unreachable"}


def _chrome_alive(port: int) -> bool:
    r = subprocess.run(
        ["pgrep", "-f", f"remote-debugging-port={port}"],
        capture_output=True,
    )
    return r.returncode == 0


def _agent_state(label: str) -> dict:
    r = subprocess.run(["launchctl", "list"], capture_output=True, text=True)
    for line in r.stdout.strip().split("\n"):
        parts = line.split("\t")
        if len(parts) == 3 and parts[2].strip() == label:
            pid_str = parts[0].strip()
            status_str = parts[1].strip()
            pid = None if pid_str == "-" else pid_str
            try:
                exit_status = None if status_str == "-" else int(status_str)
            except ValueError:
                exit_status = None
            return {
                "loaded": True,
                "pid": pid,
                "running": pid is not None,
                "exit_status": exit_status,
            }
    return {"loaded": False, "pid": None, "running": False, "exit_status": None}


# --------------------------------------------------------------------------- #
# API routes                                                                   #
# --------------------------------------------------------------------------- #

@app.get("/api/health")
async def bridge_health():
    """Bridge self-check — no token required."""
    return {"status": "ok", "bridge": "thebarapp-ops"}


@app.get("/api/backend-health")
async def backend_health():
    return await _proxy_get("/api/v1/health")


@app.get("/api/scraper-health")
async def scraper_health():
    return await _proxy_get("/api/v1/pp/scraper/health")


@app.get("/api/scraper-runs")
async def scraper_runs():
    if not SCRAPER_TOKEN:
        raise HTTPException(status_code=503, detail="SCRAPER_TOKEN not configured on bridge")
    return await _proxy_get(
        "/api/v1/pp/scraper/status",
        {"X-Scraper-Token": SCRAPER_TOKEN},
    )


@app.get("/api/studio")
async def studio_health():
    """Read Studio-local state: Chrome processes + LaunchAgent states."""
    try:
        return {
            "chrome_9222_alive": _chrome_alive(9222),
            "chrome_9223_alive": _chrome_alive(9223),
            "agents": {label: _agent_state(label) for label in KNOWN_AGENTS},
        }
    except Exception as e:
        return {"error": str(e)}


# --------------------------------------------------------------------------- #
# Serve React frontend (after all API routes)                                  #
# --------------------------------------------------------------------------- #

_dist = Path(__file__).parent.parent / "dashboard" / "dist"

if _dist.exists():
    app.mount("/assets", StaticFiles(directory=str(_dist / "assets")), name="assets")


@app.get("/{full_path:path}")
async def spa(full_path: str):
    if not _dist.exists():
        return {"detail": "Frontend not built yet. Run: cd dashboard && npm run build"}
    candidate = _dist / full_path
    if candidate.is_file():
        return FileResponse(candidate)
    return FileResponse(_dist / "index.html")


# --------------------------------------------------------------------------- #
# Entry point                                                                  #
# --------------------------------------------------------------------------- #

if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("BRIDGE_HOST", "127.0.0.1")
    port = int(os.environ.get("BRIDGE_PORT", "7777"))
    print(f"Starting ops bridge on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")
