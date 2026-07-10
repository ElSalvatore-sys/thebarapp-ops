#!/bin/bash
set -e

REPO="https://github.com/ElSalvatore-sys/thebarapp-ops.git"
DIR="$HOME/thebarapp-ops"
PLIST="$HOME/Library/LaunchAgents/com.oasis.ops-bridge.plist"

echo ""
echo "=== TheBarApp Ops Dashboard — Studio Install ==="
echo ""

# 1. Clone or update
if [ -d "$DIR/.git" ]; then
  echo "→ Updating repo..."
  git -C "$DIR" fetch origin
  git -C "$DIR" reset --hard origin/main
else
  echo "→ Cloning repo..."
  git clone "$REPO" "$DIR"
fi
cd "$DIR"

# 2. Python venv
echo "→ Setting up Python venv..."
python3 -m venv .venv
.venv/bin/pip install -r bridge/requirements.txt -q

# 3. Collect secrets
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "")
if [ -z "$TAILSCALE_IP" ]; then
  echo ""
  read -p "Enter this Studio's Tailscale IP (tailscale ip -4): " TAILSCALE_IP
fi
echo "→ Tailscale IP: $TAILSCALE_IP"

# Reuse existing .env if present
if [ -f "bridge/.env" ]; then
  echo "→ Found existing bridge/.env — reusing (delete it to regenerate secrets)"
  source bridge/.env
else
  BRIDGE_TOKEN=$(openssl rand -hex 32)
  echo ""
  echo "→ Fetching SCRAPER_TOKEN from Hetzner..."
  SCRAPER_TOKEN=$(ssh hetzner "sudo docker exec thebarapp-backend-1 env" 2>/dev/null | grep SCRAPER_TOKEN | cut -d= -f2 || echo "")
  if [ -z "$SCRAPER_TOKEN" ]; then
    read -p "Enter SCRAPER_TOKEN (from Hetzner backend .env): " SCRAPER_TOKEN
  else
    echo "→ SCRAPER_TOKEN fetched from Hetzner"
  fi

  cat > bridge/.env << EOF
BRIDGE_HOST=$TAILSCALE_IP
BRIDGE_PORT=7777
BRIDGE_TOKEN=$BRIDGE_TOKEN
SCRAPER_TOKEN=$SCRAPER_TOKEN
EOF
  chmod 600 bridge/.env
  echo "→ bridge/.env created"
fi

source bridge/.env

# 4. Build frontend
echo "→ Building React frontend..."
cd dashboard
rm -rf node_modules package-lock.json
npm install --silent
VITE_BRIDGE_TOKEN=$BRIDGE_TOKEN npm run build
cd ..
echo "→ Frontend built → dashboard/dist/"

# 5. Install LaunchAgent
PYTHON_PATH="$DIR/.venv/bin/python3"
cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.oasis.ops-bridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PYTHON_PATH</string>
        <string>$DIR/bridge/main.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$DIR/bridge</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>BRIDGE_HOST</key>
        <string>$BRIDGE_HOST</string>
        <key>BRIDGE_PORT</key>
        <string>$BRIDGE_PORT</string>
        <key>BRIDGE_TOKEN</key>
        <string>$BRIDGE_TOKEN</string>
        <key>SCRAPER_TOKEN</key>
        <string>$SCRAPER_TOKEN</string>
    </dict>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ops-bridge.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ops-bridge.log</string>
</dict>
</plist>
EOF

# 6. Load LaunchAgent (unload first if already running)
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "→ LaunchAgent loaded"
sleep 2

# 7. Verify
echo ""
echo "=== Verifying bridge ==="
HEALTH=$(curl -sf "http://$TAILSCALE_IP:7777/api/health" 2>/dev/null || echo "FAILED")
echo "Bridge health: $HEALTH"
BACKEND=$(curl -sf "http://$TAILSCALE_IP:7777/api/backend-health" 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print('status='+d.get('status','?')+' db='+d.get('checks',{}).get('database',{}).get('status','?'))" 2>/dev/null || echo "FAILED")
echo "Backend proxy: $BACKEND"
SCRAPER=$(curl -sf "http://$TAILSCALE_IP:7777/api/scraper-health" 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print('healthy='+str(d.get('healthy','?'))+' hours='+str(d.get('hours_since_last_success','?')))" 2>/dev/null || echo "FAILED")
echo "Scraper health: $SCRAPER"
STUDIO=$(curl -sf "http://$TAILSCALE_IP:7777/api/studio" 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print('9222='+str(d.get('chrome_9222_alive')),'9223='+str(d.get('chrome_9223_alive')))" 2>/dev/null || echo "FAILED")
echo "Studio state: $STUDIO"

echo ""
echo "=== Done ==="
echo ""
echo "Dashboard URL (any Tailscale device):"
echo "  http://$TAILSCALE_IP:7777"
echo ""
echo "Bridge log: tail -f /tmp/ops-bridge.log"
echo "Bridge token: $BRIDGE_TOKEN"
