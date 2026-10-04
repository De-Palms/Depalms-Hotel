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
* **Dynamic Promotions**: A small, typography-led promotions and events section powered by a dedicated `Promotions` Google Sheets tab and a safe Cloudflare Pages API response.

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

## 📊 Google Sheets Master Integrations

The website integrates with a Google Sheets workbook containing two dedicated tabs:

### 1. `Bookings` Tab Schema (AI Front-Desk Concierge)

When guests complete a reservation with the AI concierge, records are automatically appended to the `Bookings` tab (`A:N`).

The tab must have this exact 14-column header row in Row 1:

| Column | Header Name | Description | Example |
| :---: | :--- | :--- | :--- |
| **A** | `Timestamp` | ISO 8601 timestamp of logging | `2026-10-04T13:45:34.416Z` |
| **B** | `Booking ID` | Unique booking reference | `DP-494458` |
| **C** | `Guest Full Name` | Full guest name | `Godstime Ekpenyong` |
| **D** | `Email Address` | Guest email address | `godstime1605@gmail.com` |
| **E** | `Phone Number` | Contact telephone number | `09063814659` |
| **F** | `Check-in Date` | Arrival date | `2026-11-12` |
| **G** | `Check-out Date` | Departure date | `2026-11-15` |
| **H** | `Room Category` | Room type and quantity | `1x Mini Deluxe, 1x Special Room` |
| **I** | `Total Bill` | Total calculated bill | `₦540,000` |
| **J** | `Payment Preference` | Payment terms | `Pay Later` / `Full Payment` / `Part Payment` |
| **K** | `Number of Guests` | Total guests staying | `2` |
| **L** | `Special Requests` | Stay preferences/requests | `Airport pickup required, quiet room` |
| **M** | `Inquiry Summary / Notes` | Concierge booking summary | `Reservation for 1x Mini Deluxe and 1x Special Room for 3 nights. Guest opted to Pay Later.` |
| **N** | `Booking Status` | Current reservation state | `CONFIRMED` |

---

## Dynamic promotions

Promotions are controlled by the `Promotions` tab in the same Google Sheet used by the AI front desk. The public site requests `/api/promotion`, which returns only one safe, currently valid item. It never exposes the sheet, booking rows, guest data, or Google credentials.

Create the tab with this exact header row:

| ID | Active | Label | Title | Description | Details | Price | Old Price | Currency | Button Text | Button Link | Start Date | End Date | Priority | Created At |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

- Use `TRUE`/`FALSE` or a checkbox for **Active**.
- Use `YYYY-MM-DD` for **Start Date** and **End Date**. These are inclusive and are evaluated in `Africa/Lagos` time.
- Use the smallest positive **Priority** number first. Ties fall back to the most recent **Created At** value.
- **Details**, **Price**, **Old Price**, **Button Text**, and **Button Link** are optional. This lets one component support room packages as well as parties, dinners, and other events.
- Price fields must be numbers without currency symbols; **Currency** defaults to `₦` when blank.

Example event row:

```text
EVENT001 | TRUE | THIS WEEKEND | Sunset Soirée | An evening of music, cocktails and good company at De Palms. | Saturday · 7 PM · Rooftop Lounge | | | ₦ | Reserve a table | https://wa.me/2349153111592 | 2026-10-10 | 2026-10-10 | 1 | 2026-10-01
```

When no valid row exists, or the promotion service cannot be reached, visitors see the permanent De Palms highlight instead. Promotion responses are cached for up to five minutes, without extending past the next local date boundary.

## 🌐 Deployment

Deploy to **Cloudflare Pages** so the `/functions` directory runs as Pages Functions. Configure the same production environment variables used by the AI front desk:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GEMINI_API_KEY` (required for the chat feature)

Share the Google Sheet with the service-account email. Once the Cloudflare Pages project exists, connect `depalmshotel.com` as the custom domain.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
