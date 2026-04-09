# Zynochat — Official Static Website

> The production-ready static website for **Zynochat** (zynochat.in) — a premium real-time chat platform built for communities, privacy, and seamless communication.

---

## 📁 Project Structure

```
zynochat/
├── index.html                  # Home page
├── features.html               # Features page
├── compare.html                # Zynochat vs Zylochat comparison
├── blog.html                   # Blog hub / content index
├── about.html                  # About the brand
├── contact.html                # Contact form & info
├── privacy-policy.html         # Privacy Policy
├── terms-and-conditions.html   # Terms & Conditions
├── 404.html                    # Custom 404 error page
├── styles.css                  # All styles (single file)
├── script.js                   # All JS (single file, vanilla)
├── sitemap.xml                 # XML sitemap for search engines
├── robots.txt                  # Crawler instructions
├── render.yaml                 # Render.com deployment config
└── README.md                   # This file
```

---

## 🚀 Deployment — Render (Free Tier)

### Step 1: Push to GitHub

```bash
# Initialize a Git repository if you haven't already
git init
git add .
git commit -m "Initial commit — Zynochat website"

# Create a new GitHub repo (via github.com) then push
git remote add origin https://github.com/YOUR_USERNAME/zynochat-site.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign up (free).
2. Click **New** → **Static Site**.
3. Connect your GitHub account and select the `zynochat-site` repository.
4. Render will auto-detect `render.yaml` and configure the deployment.
5. Set the following if prompted manually:
   - **Build Command:** *(leave empty)*
   - **Publish Directory:** `.` (the root of the repo)
6. Click **Deploy**.

Your site will be live at a `.onrender.com` URL within 1–2 minutes.

### Step 3: Add Custom Domain

1. In the Render dashboard, go to your site → **Settings** → **Custom Domains**.
2. Add `zynochat.in` and `www.zynochat.in`.
3. Render will provide DNS records. Add them at your domain registrar:
   - **A Record:** `@` → Render's IP (shown in dashboard)
   - **CNAME:** `www` → your `.onrender.com` URL
4. SSL/HTTPS is automatically provisioned by Render (via Let's Encrypt). No setup required.

---

## ⚙️ Local Development

No build tools or dependencies required. Open any HTML file directly in a browser, or serve locally:

```bash
# Option 1: Python (built-in)
python3 -m http.server 3000
# Open http://localhost:3000

# Option 2: Node.js (npx)
npx serve .
# Open http://localhost:3000

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

---

## 🔍 SEO Coverage

This site is optimised to rank for the following search queries:

| Query                       | Primary Page        |
|-----------------------------|---------------------|
| zynochat                    | index.html          |
| zynochat.in                 | index.html          |
| zynochat app                | features.html       |
| zynochat features           | features.html       |
| zynochat download           | features.html       |
| zynochat login              | blog.html           |
| zylochat                    | compare.html        |
| zylochat vs zynochat        | compare.html        |
| official zynochat           | compare.html        |
| zynochat contact            | contact.html        |
| zynochat privacy policy     | privacy-policy.html |
| zynochat terms              | terms-and-conditions.html |
| what is zynochat            | blog.html           |
| is zynochat safe            | blog.html           |

### SEO Features Implemented
- ✅ Unique `<title>` and `<meta description>` on every page
- ✅ Canonical tags on every page
- ✅ Open Graph and Twitter Card metadata
- ✅ JSON-LD structured data (WebSite, Organization, FAQPage, BreadcrumbList)
- ✅ Semantic HTML with correct H1/H2/H3 hierarchy
- ✅ XML sitemap at `/sitemap.xml`
- ✅ `robots.txt` with sitemap reference
- ✅ Internal linking across all pages
- ✅ Natural keyword integration (no stuffing)
- ✅ Zylochat comparison page for alternate-spelling search intent

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#05050e` (near-black) |
| Accent — Violet | `#7c5cfc` |
| Accent — Cyan | `#00cfee` |
| Text primary | `#eeeeff` |
| Text secondary | `#9898bb` |
| Font — Headings | Syne (Google Fonts) |
| Font — Body | DM Sans (Google Fonts) |
| Border radius | 8px / 14px / 22px / 32px |

---

## ♿ Accessibility

- Semantic HTML landmarks (`<nav>`, `<main>`, `<footer>`, `<aside>`)
- `aria-label` on interactive elements
- `aria-expanded` on accordion/menu toggles
- Visible `:focus-visible` states (2px violet outline)
- Colour contrast ratios exceed WCAG AA
- Mobile tap targets are minimum 44px
- Form inputs have associated `<label>` elements
- `role` attributes used where semantic HTML is insufficient

---

## ⚡ Performance

- **Zero runtime dependencies** — no frameworks, no build step
- Single CSS file, single JS file
- Google Fonts loaded with `display=swap` for non-blocking render
- CSS variables for efficient theming
- `IntersectionObserver` for scroll animations (lazy, non-blocking)
- No images required (all visual effects via CSS/SVG)
- Core Web Vitals friendly structure

---

## 📝 Content Updates

All content is in plain HTML — editable with any text editor. To update:

- **Blog articles:** Add new `<article class="blog-card">` elements to `blog.html`
- **FAQ answers:** Edit `.faq-item` blocks in `index.html` and `compare.html`
- **Contact email:** Search and replace `hello@zynochat.in` across all files
- **Legal dates:** Update "Last updated" in `privacy-policy.html` and `terms-and-conditions.html`
- **Sitemap:** Update `<lastmod>` dates in `sitemap.xml` after content changes

---

## 📧 Contact

For questions about this codebase:

- **Email:** hello@zynochat.in
- **Website:** [zynochat.in](https://zynochat.in)

---

© 2025 Zynochat. All rights reserved. — [zynochat.in](https://zynochat.in)
