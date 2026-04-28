from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# 1. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Security: Block Sensitive Files
SENSITIVE_FILES = {
    "package.json", "package-lock.json", "server.js", "render.yaml",
    ".gitignore", "README.md", "main.py", "requirements.txt"
}

@app.middleware("http")
async def block_sensitive_files(request: Request, call_next):
    path = request.url.path
    segments = path.strip("/").split("/")

    # Block hidden files/directories
    if any(s.startswith(".") and len(s) > 1 for s in segments):
        return JSONResponse(status_code=403, content={"detail": "Forbidden: Access is denied."})

    # Block sensitive files
    if segments and segments[-1] in SENSITIVE_FILES:
        return JSONResponse(status_code=403, content={"detail": "Forbidden: Access is denied."})

    response = await call_next(request)
    return response

# 3. Explicit Routes (Before Static Mounting)
@app.get("/login")
async def read_login():
    return FileResponse("login.html")

@app.get("/chat")
async def read_chat():
    return FileResponse("chat.html")

@app.get("/admin")
async def read_admin():
    return FileResponse("admin.html")

# AI API Endpoint (Python-based AI Logic)
@app.post("/api/ai/chat")
async def ai_chat(request: Request):
    data = await request.json()
    user_message = data.get("message", "").lower()

    # Advanced AI Logic in Python
    if "hello" in user_message or "hi" in user_message:
        reply = "Greetings! I am the Zyno AI, your advanced assistant running on a high-performance Python backend. How can I elevate your experience today?"
    elif "status" in user_message:
        reply = "All systems are operational. Python Backend: Active, Database: Connected, Neural Grid: Synchronized."
    elif "who are you" in user_message:
        reply = "I am Zyno AI, a sophisticated intelligence layer integrated into the Zynochat ecosystem to provide real-time assistance and insights."
    else:
        reply = f"I've analyzed your input: '{user_message}'. My neural processors are currently optimizing the response. How else can I assist you with Zynochat?"

    return {"reply": reply}

# 4. Serve Static Files
# We mount it at / but we need to handle the SPA fallback carefully.
# StaticFiles with html=True handles / to /index.html but not /login to login.html if not explicitly defined.
app.mount("/static", StaticFiles(directory="."), name="static")

# Catch-all for SPA and serving other root files
@app.get("/{path:path}")
async def catch_all(request: Request, path: str):
    # Check if file exists in root
    if path == "":
        return FileResponse("index.html")

    full_path = os.path.join(".", path)
    if os.path.isfile(full_path):
        # Prevent serving sensitive files already blocked by middleware,
        # but as a second layer of defense.
        if path in SENSITIVE_FILES or path.startswith("."):
             return JSONResponse(status_code=403, content={"detail": "Forbidden"})
        return FileResponse(full_path)

    # Fallback for SPA: If it's not a file and not an API call, return index.html
    if not path.startswith("api/"):
        return FileResponse("index.html")

    raise HTTPException(status_code=404, detail="Not Found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
