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

# 1. CORS Configuration
# Standard CORS setup to secure API requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://zynochat.in", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 2. Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 3. Security Middleware with Path segment hardening & clean URL redirection
SENSITIVE_FILES = {
    'package.json', 'package-lock.json', 'server.js',
    'render.yaml', '.gitignore', 'readme.md',
    'supabase_setup.sql', 'requirements.txt'
}

FORBIDDEN_EXTENSIONS = ('.py', '.sql', '.yaml', '.log', '.env')

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Normalize the path to prevent Open Redirects (e.g., protocol-relative URL bypasses)
        raw_path = request.url.path
        safe_path = '/' + raw_path.lstrip('/')
        path_lower = safe_path.lower()

        # 1. Path Segment Block Checks
        segments = [s for s in path_lower.split('/') if s]
        for segment in segments:
            if segment in SENSITIVE_FILES or segment.startswith('.'):
                return JSONResponse(status_code=403, content={"detail": "Forbidden: Access is denied."})
            if segment.endswith(FORBIDDEN_EXTENSIONS):
                return JSONResponse(status_code=403, content={"detail": "Forbidden: Access is denied."})

        # 2. Clean URL Enforcements & Redirects (Exclude API, Static Assets, etc.)
        # If the path ends with /index.html, redirect to parent root directory
        if path_lower.endswith('/index.html') or path_lower == '/index.html':
            parent_path = safe_path.rsplit('index.html', 1)[0]
            if not parent_path:
                parent_path = '/'
            query = f"?{request.url.query}" if request.url.query else ""
            target_url = parent_path + query
            return RedirectResponse(url=target_url, status_code=307)

        # If the path ends in .html, redirect to clean extension-less path (except root index.html handled above)
        if path_lower.endswith('.html'):
            clean_path = safe_path[:-5]  # strip '.html'
            query = f"?{request.url.query}" if request.url.query else ""
            target_url = clean_path + query
            return RedirectResponse(url=target_url, status_code=307)

        # Add security headers directly within the dispatch method to ensure presence on early returns
        response = await call_next(request)

        # Apply security headers to response
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

app.add_middleware(SecurityMiddleware)

# 4. Canonical Route Definitions
# Explicit routes for clean extension-less paths

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

@app.get("/features")
async def features_page():
    return FileResponse("features.html")

@app.get("/about")
async def about_page():
    return FileResponse("about.html")

@app.get("/compare")
async def compare_page():
    return FileResponse("compare.html")

@app.get("/contact")
async def contact_page():
    return FileResponse("contact.html")

@app.get("/blog")
async def blog_page():
    return FileResponse("blog.html")

@app.get("/blog-brand")
async def blog_brand_page():
    return FileResponse("blog-brand.html")

@app.get("/blog-competitor")
async def blog_competitor_page():
    return FileResponse("blog-competitor.html")

@app.get("/blog-howto")
async def blog_howto_page():
    return FileResponse("blog-howto.html")

@app.get("/blog-traffic")
async def blog_traffic_page():
    return FileResponse("blog-traffic.html")

@app.get("/ai-chat")
async def ai_chat_page():
    return FileResponse("ai-chat.html")

@app.get("/help")
async def help_page():
    return FileResponse("help.html")

@app.get("/report")
async def report_page():
    return FileResponse("report.html")

@app.get("/search")
async def search_page():
    return FileResponse("search.html")

@app.get("/channel")
async def channel_page():
    return FileResponse("channel.html")

@app.get("/create")
async def create_page():
    return FileResponse("create.html")

# Legal pages
@app.get("/privacy-policy")
async def privacy_policy_page():
    return FileResponse("privacy-policy.html")

@app.get("/terms-and-conditions")
async def terms_and_conditions_page():
    return FileResponse("terms-and-conditions.html")

@app.get("/disclaimer")
async def disclaimer_page():
    return FileResponse("disclaimer.html")

@app.get("/cookie-policy")
async def cookie_policy_page():
    return FileResponse("cookie-policy.html")

@app.get("/refund-policy")
async def refund_policy_page():
    return FileResponse("refund-policy.html")

# Serve all other static assets directly
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 3000)), reload=True)
