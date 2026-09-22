# De Palms Hotels

A refined, editorial marketing website for **De Palms Hotels**, located in G.R.A. Phase 2, Port Harcourt, Nigeria.

Built as a high-performance static website using semantic HTML5, modern vanilla CSS3, and JavaScript with GSAP, ScrollTrigger, and Lenis smooth scrolling.

---

## ✨ Features & Architecture

* **Signature Hero Animation**: The hotel building enters with a smooth blurred scale and physically transitions into the About section as the visitor scrolls (featuring responsive behavior on both desktop and mobile).
* **Accommodations & Room Tours**:
  * Image-first room cards showing photography by default.
  * Subtle `[ ▶ Watch tour ]` glassmorphic button to stream and play video tours on demand.
  * Room amenities micro-tags (Bed configuration, Hot Shower, Fast Wi-Fi, Netflix, Complimentary Breakfast) with custom inline SVG icons.
* **Places to Visit in Port Harcourt**: Real photography for local attractions (Port Harcourt Pleasure Park, Garden City Amusement Park, Genesis Cinemas) with horizontal ScrollTrigger sliding.
* **Double Marquee**: Infinite bidirectional marquee showcasing hotel amenities.
* **Bespoke Editorial Aesthetics**: Strict 0px border-radius brutalist-refined styling, high-contrast typography pairing **Instrument Serif**, **DM Sans**, and **DM Mono**, with a deep forest green and off-white palette.
* **SEO & Performance Ready**: Includes OpenGraph meta tags, canonical link, `robots.txt`, `sitemap.xml`, and Schema.org `Hotel` JSON-LD structured data.

---

## 📁 Project Structure

```text
Depalms Website/
├── assets/
│   ├── hero/          # High-resolution hotel building imagery
│   ├── logo/          # Brand icon emblem and script wordmark
│   ├── map/           # Custom vector map artwork
│   ├── places/        # Real photography for Port Harcourt attractions
│   └── rooms/         # Room photography and MP4 video tours
├── css/
│   ├── responsive.css # Mobile and tablet responsive stylesheets
│   └── style.css      # Core design tokens and typography system
├── js/
│   ├── animations.js  # GSAP scroll reveals & horizontal sliding
│   ├── data.js        # Content configuration (hotel info, rooms, places)
│   ├── hero.js        # Hero-to-about building scroll transitions
│   ├── main.js        # Dynamic DOM rendering and video tour toggles
│   ├── navigation.js  # Glassmorphic header & mobile navigation
│   └── smooth-scroll.js # Lenis smooth scroll engine
├── index.html         # Main entry page
├── package.json       # Scripts for local preview and verification
├── robots.txt         # Search engine crawl rules
├── sitemap.xml        # Search engine sitemap
├── LICENSE            # MIT License
└── README.md          # Documentation
```

---

## 🚀 Running Locally

You can open `index.html` directly in your browser, or spin up a local development server:

```bash
# Start a local static server
npm start
```

### Validate JavaScript Syntax

Verify that all script files pass syntax validation with zero dependencies:

```bash
npm run check
```

---

## 🌐 Deployment

This website is purely static and requires no build pipeline. It can be deployed directly to:
* **Netlify**: Drag and drop the folder or connect via GitHub.
* **Vercel**: Deploy as a static project.
* **GitHub Pages**: Serve directly from the root of the repository.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
