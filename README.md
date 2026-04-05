# Abdalrahman — Creative Graphic Designer Portfolio

A modern, responsive, bilingual (Arabic/English) portfolio website for a graphic designer specializing in Adobe Creative Suite tools.

## ✨ Features

- **Dark Premium Design** — Elegant dark theme with gold accents
- **Bilingual Support** — Full Arabic (RTL) and English support with language switcher
- **Interactive Hero** — Grayscale-to-color image toggle on click
- **Portfolio Filtering** — Filter projects by category (Branding, Social Media, Motion, UI, Video, Print)
- **Scroll Animations** — Smooth reveal animations using Intersection Observer
- **Responsive Design** — Mobile-first, works on all devices
- **SEO Optimized** — Meta tags, Open Graph, structured data (JSON-LD), hreflang, sitemap
- **Accessibility** — ARIA labels, focus states, prefers-reduced-motion support
- **Zero Dependencies** — Pure HTML, CSS, and JavaScript (no frameworks, no build tools)

## 📁 Project Structure

```
Abdalrahman-portfolio/
├── index.html          # Main HTML file with all sections
├── sitemap.xml         # SEO sitemap
├── README.md           # This file
├── css/
│   └── style.css       # Complete stylesheet with design tokens
├── js/
│   ├── main.js         # Core functionality (nav, filters, animations)
│   └── language.js     # i18n translation system (AR/EN)
└── images/
    ├── hero-bg.png     # Hero background image
    ├── profile.png     # Profile photo
    ├── project-*.png   # Portfolio project images
    └── certificate.png # Certificate placeholder
```

## 🚀 Run Locally

No build tools needed. Simply open `index.html` in your browser:

```bash
# Option 1: Open directly
start index.html

# Option 2: Use a local server (recommended for best experience)
npx serve .

# Option 3: Python server
python -m http.server 8000

# Option 4: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

## 🌐 Deploy to GitHub Pages

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/Abdalrahman-portfolio.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository → **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** → **/ (root)**
   - Click **Save**

3. Your site will be live at `https://YOUR-USERNAME.github.io/Abdalrahman-portfolio/`

## 🌐 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Framework Preset: **Other**
5. Click **Deploy**

## ✏️ How to Edit Content

### Change Text Content
All text is managed through the translation system in `js/language.js`. Edit the `translations` object:

```javascript
// js/language.js
const translations = {
  en: {
    "about.name": "Your Name Here",
    "about.role": "Your Title Here",
    // ... other keys
  },
  ar: {
    "about.name": "اسمك هنا",
    "about.role": "عنوانك هنا",
    // ... Arabic versions
  }
};
```

### Change Images
Replace files in the `images/` folder with your own images (keep the same filenames):
- `profile.png` — Your profile photo
- `hero-bg.png` — Hero background
- `project-*.png` — Portfolio project images
- `certificate.png` — Certificate images

### Add New Projects
1. Add a new project image to `images/`
2. Add a new `<article class="project-card">` in `index.html` (copy an existing card)
3. Set the `data-category` attribute to match a filter category
4. Add translation keys in `js/language.js`

### Change Colors
Edit CSS custom properties in `css/style.css`:

```css
:root {
  --accent-primary: #d4a853;     /* Main accent color */
  --accent-secondary: #e8c975;   /* Secondary accent */
  --bg-primary: #0a0a0f;         /* Main background */
  --bg-secondary: #12121a;       /* Section backgrounds */
}
```

### Change Contact Info
Update the contact details in `js/language.js` under the `contact.*` keys:
- `contact.email`
- `contact.phone`
- `contact.location`

Also update social media URLs directly in `index.html` (search for `href="https://linkedin.com/..."`).

## 🔍 SEO Details

| Feature | Implementation |
|---------|---------------|
| Title Tag | Descriptive, bilingual-ready |
| Meta Description | Keyword-rich, bilingual |
| Open Graph | Full OG tags for social sharing |
| Twitter Card | Large image card |
| Structured Data | JSON-LD Person schema |
| Hreflang | EN/AR alternates for multilingual SEO |
| Sitemap | XML sitemap included |
| Semantic HTML | Proper heading hierarchy (single H1) |
| Image Alt Text | Descriptive alt text on all images |
| Performance | No external dependencies, lazy-loaded images |

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome Android)

## 📄 License

This project is free to use and modify for personal and commercial purposes.
