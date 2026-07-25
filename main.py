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
class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        original_path = request.url.path
        path_lower = original_path.lower()

        # 1. Clean URL Redirection (e.g., /login.html -> /login, /index.html -> /)
        if path_lower.endswith('/index.html'):
            redirect_path = original_path[:-10] or "/"
        elif path_lower.endswith('.html'):
            redirect_path = original_path[:-5]
        else:
            redirect_path = None

        if redirect_path is not None:
            safe_path = '/' + redirect_path.lstrip('/\\')
            query = f"?{request.url.query}" if request.url.query else ""
            return RedirectResponse(url=f"{safe_path}{query}", status_code=307)

        # 2. Block sensitive files & forbidden extensions
        sensitive_files = {
            'package.json', 'package-lock.json', 'server.js',
            'render.yaml', '.gitignore', 'readme.md',
            'requirements.txt'
        }
        forbidden_extensions = ('.py', '.sql', '.yaml', '.log', '.env')

        segments = [s for s in path_lower.split('/') if s]
        for segment in segments:
            if segment in sensitive_files or segment.startswith('.') or segment.endswith(forbidden_extensions):
                return JSONResponse(status_code=403, content={"detail": "Forbidden: Access is denied."})

        response = await call_next(request)

        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com; "
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co; "
            "img-src 'self' data: https://*.supabase.co https://zynochat.in https://user-images.githubusercontent.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "object-src 'none'; "
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
