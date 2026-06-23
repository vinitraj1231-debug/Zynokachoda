import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

app = FastAPI()

# 1. Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. Security Middleware
SENSITIVE_FILES = {
    'package.json', 'package-lock.json', 'server.js', 'render.yaml',
    '.gitignore', 'readme.md', 'supabase_setup.sql', 'requirements.txt',
    'main.py', 'server.log', 'server_output.log', 'server_test.log'
}
FORBIDDEN_EXTENSIONS = ('.py', '.sql', '.env', '.yaml', '.log')

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path.lower()

        # Enforce clean URLs and prevent rate-limit bypass for .html files
        if path.endswith(".html") and path != "/index.html":
            clean_path = path[:-5]
            return RedirectResponse(url=clean_path, status_code=307)

        # Block sensitive files, hidden files, and forbidden extensions
        segments = [s for s in path.split('/') if s]
        for segment in segments:
            if (segment in SENSITIVE_FILES or
                segment.startswith('.') or
                segment.endswith(FORBIDDEN_EXTENSIONS)):
                return JSONResponse(status_code=403, content={"detail": "Forbidden: Access is denied."})

        response = await call_next(request)

        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com; "
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co; "
            "img-src 'self' data: https://*.supabase.co https://zynochat.in https://user-images.githubusercontent.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "object-src 'none'; "
            "frame-ancestors 'none'; "
            "upgrade-insecure-requests;"
        )
        return response

app.add_middleware(SecurityMiddleware)

# 3. Static Assets
# Mount everything except HTML files to /assets or serve directly
# For simplicity in this structure, we serve specific pages and then mount the rest
@app.get("/login")
@limiter.limit("10/minute")
async def login_page(request: Request):
    return FileResponse("login.html")

@app.get("/chat")
async def chat_page(request: Request):
    return FileResponse("chat.html")

@app.get("/admin")
async def admin_page(request: Request):
    return FileResponse("admin.html")

@app.get("/profile")
async def profile_page(request: Request):
    return FileResponse("profile.html")

@app.get("/settings")
async def settings_page(request: Request):
    return FileResponse("settings.html")

# Root
@app.get("/")
async def root():
    return FileResponse("index.html")

# Mount the current directory for other assets (js, css, etc.)
# We use a custom StaticFiles to handle SPA-like behavior or just serve assets
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 3000)), reload=True)
