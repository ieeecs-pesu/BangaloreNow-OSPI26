# BangaloreNow - Quick Setup Guide

## Prerequisites
- Python 3.10+
- Node.js 18+
- Cloudflare WARP (for IPv6 connectivity to Supabase)

---

## 🚀 First Time Setup

### 1. Install Cloudflare WARP (Required for Database Access)
```bash
# Add Cloudflare repository
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list

# Install WARP
sudo apt update
sudo apt install cloudflare-warp -y

# Register and connect
warp-cli registration new
warp-cli connect

# Verify connection
warp-cli status
```

### 2. Setup Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -e .
```

### 3. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install
```

---

## 🏃 Running the Project

### Every Time You Start:

**Step 1: Connect to WARP** (if not already connected)
```bash
warp-cli connect
warp-cli status  # Should show "Connected"
```

**Step 2: Start Backend** (in one terminal)
```bash
cd backend
source venv/bin/activate
fastapi dev app/main.py
```
Backend will run at: **http://127.0.0.1:8000**

**Step 3: Start Frontend** (in another terminal)
```bash
cd frontend
npm run dev
```
Frontend will run at: **http://localhost:5173**

**Step 4: Open Browser**
- Visit: http://localhost:5173
- API Docs: http://127.0.0.1:8000/docs

---

## 🛑 Stopping the Project

1. Press `Ctrl+C` in both terminal windows
2. Optionally disconnect WARP:
   ```bash
   warp-cli disconnect
   ```

---

## 🔧 Troubleshooting

### Database Connection Failed?
```bash
# Check WARP status
warp-cli status

# If disconnected, reconnect
warp-cli connect

# Test database connection
cd backend
source venv/bin/activate
python test_db_connection.py
```

### Port Already in Use?
```bash
# Kill process on port 8000 (backend)
sudo lsof -ti:8000 | xargs kill -9

# Kill process on port 5173 (frontend)
sudo lsof -ti:5173 | xargs kill -9
```

### WARP Not Working?
```bash
# Restart WARP service
sudo systemctl restart warp-svc

# Reconnect
warp-cli disconnect
warp-cli connect
```

---

## 📝 Quick Commands Reference

| Task | Command |
|------|---------|
| Check WARP status | `warp-cli status` |
| Connect WARP | `warp-cli connect` |
| Disconnect WARP | `warp-cli disconnect` |
| Activate backend venv | `cd backend && source venv/bin/activate` |
| Run backend | `fastapi dev app/main.py` |
| Run frontend | `cd frontend && npm run dev` |
| Test DB connection | `cd backend && source venv/bin/activate && python test_db_connection.py` |

---

## ⚠️ Important Notes

1. **Always connect WARP first** before starting the backend
2. The `.env` file contains database credentials - keep it secure
3. Backend uses port 8000, frontend uses port 5173
4. You need 183 events in the database for the map to display properly
