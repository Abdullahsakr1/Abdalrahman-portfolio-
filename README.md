# 🎨 Abdalrahman Portfolio | Creative Graphic Designer

A modern, responsive, and bilingual (Arabic/English) personal portfolio website designed specifically to showcase Abdalrahman's professional graphic design work and expertise in Adobe Creative Suite tools. It features an elegant "Dark Mode" design with premium gold accents.

## ✨ Features

- **Dark Premium Design:** Elegant dark theme UI with gold accents to make the artwork stand out.
- **Bilingual Support:** Full support for both Arabic (RTL) and English (LTR) with a seamless language switcher.
- **Interactive Visuals:** Grayscale-to-color image transformations upon interaction.
- **Smart Portfolio Filtering:** Filter projects easily by category (Branding, Social Media, Motion Graphics, UI, Video, Print).
- **Scroll Animations:** Smooth element reveal animations on scroll using Intersection Observer.
- **100% Responsive:** Mobile-first design that adapts perfectly to phones, tablets, and large desktop screens.
- **SEO Optimized:** Includes Meta tags, Open Graph, structured data (JSON-LD), and a `sitemap.xml`.
- **High Performance (Zero Dependencies):** Built with pure HTML, CSS, and JavaScript without relying on heavy external libraries or frameworks for blazing fast load times.

## 📁 Project Structure

```text
Abdalrahman-portfolio/
├── index.html          # Main landing page
├── admin.html          # Simple admin dashboard (if applicable)
├── sitemap.xml         # SEO sitemap
├── README.md           # This documentation file
├── css/
│   └── style.css       # Stylesheets and design tokens
├── js/
│   ├── main.js         # Core functionality (filters, animations, nav)
│   └── language.js     # i18n translation and switching system
├── data/               # Data files (if applicable)
└── images/             # Images and artwork assets folder
```

## 🚀 Run Locally

This project requires no build tools. To run the website, simply open the `index.html` file in your browser:

**Available Methods:**
1. Double-click the `index.html` file to open it directly.
2. Use the **Live Server** extension in VS Code (Recommended for the best experience).
3. Using Python: `python -m http.server 8000`

## ✏️ How to Edit Content

### 1. Edit Texts and Translations
All text content is managed via the `js/language.js` file. You can modify the `translations` object:

```javascript
const translations = {
  en: {
    "about.name": "Abdalrahman",
    "about.role": "Graphic Designer",
    // ... remaining English texts
  },
  ar: {
    "about.name": "عبدالرحمن",
    "about.role": "مصمم جرافيك",
    // ... remaining Arabic texts
  }
};
```

### 2. Update Images and Projects
To replace images, place your own files in the `images/` directory using the same filenames:
- `profile.png` — Your profile picture.
- `hero-bg.png` — Hero/Cover background image.
- `project-*.png` — Portfolio project images.

### 3. Change Primary Colors
To change the website's color scheme, open `css/style.css` and modify the following CSS variables:

```css
:root {
  --accent-primary: #d4a853;     /* Main accent color (Gold) */
  --accent-secondary: #e8c975;   /* Secondary accent color */
  --bg-primary: #0a0a0f;         /* Main background color */
  --bg-secondary: #12121a;       /* Section background color */
}
```

## 🌐 Deployment

You can easily host this website for free via:
- **GitHub Pages:** By pushing the files to your repository and enabling Pages from the settings.
- **Vercel / Netlify:** By linking the repository; it will deploy the site automatically.

## 📄 License

This project is available for personal use and modification to suit your portfolio needs.