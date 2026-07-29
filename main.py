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

SENSITIVE_FILES = {
    'package.json', 'package-lock.json', 'server.js',
    'render.yaml', '.gitignore', 'readme.md',
    'supabase_setup.sql', 'requirements.txt', 'security_headers_test.py', 'main.py'
}
FORBIDDEN_EXTENSIONS = ('.py', '.sql', '.yaml', '.log', '.env')

def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
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

# 2. Security Middleware
class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Normalize path to prevent Open Redirects via protocol-relative URLs
        raw_path = request.url.path
        safe_path = '/' + raw_path.lstrip('/\\')
        path_lower = safe_path.lower()

        # 1. Block sensitive files or forbidden extensions case-insensitively across segments
        segments = [s for s in path_lower.split('/') if s]
        for segment in segments:
            if (
                segment in SENSITIVE_FILES
                or segment.startswith('.')
                or segment.endswith(FORBIDDEN_EXTENSIONS)
            ):
                response = JSONResponse(
                    status_code=403,
                    content={"detail": "Forbidden: Access is denied."}
                )
                return add_security_headers(response)

        # 2. Clean URL Redirection to prevent rate-limit bypasses on static pages
        if path_lower.endswith('/index.html') or path_lower == '/index.html':
            parent_path = safe_path[:-10]
            if not parent_path:
                parent_path = '/'
            query = f"?{request.url.query}" if request.url.query else ""
            target_url = parent_path + query
            response = RedirectResponse(url=target_url, status_code=307)
            return add_security_headers(response)

        if path_lower.endswith('.html'):
            target_path = safe_path[:-5]
            query = f"?{request.url.query}" if request.url.query else ""
            target_url = target_path + query
            response = RedirectResponse(url=target_url, status_code=307)
            return add_security_headers(response)

        response = await call_next(request)
        return add_security_headers(response)

app.add_middleware(SecurityMiddleware)

# 3. Static Assets
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

app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 3000)), reload=True)
