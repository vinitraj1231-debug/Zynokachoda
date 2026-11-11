import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
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

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['https://zynochat.in', 'http://localhost:3000', 'http://localhost:8000'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Security Constants
SENSITIVE_FILES = {
    'package.json', 'package-lock.json', 'server.js',
    'render.yaml', '.gitignore', 'readme.md',
    'supabase_setup.sql', 'requirements.txt', 'main.py',
    'server.log', 'server_output.log', 'server_test.log',
    'db.js', 'backend_test.js', 'seed.js', 'pnpm-lock.yaml'
}
FORBIDDEN_EXTENSIONS = ('.py', '.sql', '.yaml', '.log', '.env', '.json', '.bak')

def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
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

# 4. Security Middleware
class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        original_path = request.url.path
        # Prevent open redirect by lstripping backslashes and slashes, then prefixing with single slash
        safe_path = '/' + original_path.lstrip('/\\')
        path_lower = safe_path.lower()

        # Block sensitive files & extensions globally across all segments
        segments = [s for s in path_lower.split('/') if s]
        for segment in segments:
            if segment in SENSITIVE_FILES or segment.startswith('.'):
                response = JSONResponse(status_code=403, content={"detail": "Forbidden: Access is denied."})
                return add_security_headers(response)
            if any(segment.endswith(ext) for ext in FORBIDDEN_EXTENSIONS):
                response = JSONResponse(status_code=403, content={"detail": "Forbidden: Access is denied."})
                return add_security_headers(response)

        # 307 Clean URL Redirects for index.html (case-insensitive checks, casing-preserved paths)
        if path_lower.endswith('/index.html'):
            target = safe_path[:-10]
            if not target.endswith('/'):
                target += '/'
            query = f"?{request.url.query}" if request.url.query else ""
            response = RedirectResponse(url=target + query, status_code=307)
            return add_security_headers(response)
        elif path_lower == '/index.html':
            query = f"?{request.url.query}" if request.url.query else ""
            response = RedirectResponse(url='/' + query, status_code=307)
            return add_security_headers(response)

        # 307 Clean URL Redirects for other .html files
        if path_lower.endswith('.html'):
            target = safe_path[:-5]
            query = f"?{request.url.query}" if request.url.query else ""
            response = RedirectResponse(url=target + query, status_code=307)
            return add_security_headers(response)

        # Call the next middleware / route handler
        response = await call_next(request)
        return add_security_headers(response)

app.add_middleware(SecurityMiddleware)

# 5. Clean URL Routes (Explicit mappings)
@app.get("/")
async def root():
    return FileResponse("index.html")

@app.get("/login")
@limiter.limit("10/minute")
async def login_page(request: Request):
    return FileResponse("login.html")

@app.get("/chat")
@limiter.limit("20/minute")
async def chat_page(request: Request):
    return FileResponse("chat.html")

@app.get("/admin")
@limiter.limit("10/minute")
async def admin_page(request: Request):
    return FileResponse("admin.html")

@app.get("/profile")
@limiter.limit("20/minute")
async def profile_page(request: Request):
    return FileResponse("profile.html")

@app.get("/settings")
@limiter.limit("20/minute")
async def settings_page(request: Request):
    return FileResponse("settings.html")

@app.get("/ai-chat")
@limiter.limit("20/minute")
async def ai_chat_page(request: Request):
    return FileResponse("ai-chat.html")

@app.get("/channel")
@limiter.limit("20/minute")
async def channel_page(request: Request):
    return FileResponse("channel.html")

@app.get("/about")
async def about_page(request: Request):
    return FileResponse("about.html")

@app.get("/blog")
async def blog_page(request: Request):
    return FileResponse("blog.html")

@app.get("/privacy-policy")
async def privacy_policy_page(request: Request):
    return FileResponse("privacy-policy.html")

@app.get("/terms-and-conditions")
async def terms_and_conditions_page(request: Request):
    return FileResponse("terms-and-conditions.html")

@app.get("/refund-policy")
async def refund_policy_page(request: Request):
    return FileResponse("refund-policy.html")

@app.get("/cookie-policy")
async def cookie_policy_page(request: Request):
    return FileResponse("cookie-policy.html")

@app.get("/disclaimer")
async def disclaimer_page(request: Request):
    return FileResponse("disclaimer.html")

# 6. Static Mount fallback for assets (JS, CSS, sitemap, sitemap/xml etc)
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 3000)), reload=True)
