# Hugo Landing Page Template

**Purpose**: Clean, modern landing page with custom layouts. Perfect for product launches, marketing pages, or single-page sites.

**Use When**:
- Launching a product
- Creating a marketing landing page
- Building a single-page site
- Need full control over design

> **Template layout paths (Hugo 0.146+, this skill targets 0.164):** This
> template ships the legacy layout structure (`layouts/index.html`,
> `layouts/_default/baseof.html`, `layouts/partials/`), which still works via
> Hugo's back-compat mapping. For greenfield projects prefer the modern paths:
> `layouts/home.html`, `layouts/baseof.html` (root), `layouts/_partials/`. See
> https://gohugo.io/templates/new-templatesystem-overview/ .

---

## Quick Start

### 1. Copy Template
```bash
cp -r skills/hugo/templates/hugo-landing/ my-landing-page/
cd my-landing-page/
git init
```

### 2. Run Development Server
```bash
hugo server
# Visit: http://localhost:1313
```

### 3. Build
```bash
hugo --minify
```

---

## What's Included

### Custom Layouts
- **No Theme**: Pure custom layouts for complete control
- **Responsive Design**: Mobile-first CSS
- **Modern Styling**: Clean, professional appearance
- **Smooth Animations**: Hover effects and transitions

### Sections
- **Hero**: Eye-catching headline with CTA buttons
- **Features**: Grid layout for product features
- **Testimonials**: Customer quotes and social proof
- **CTA**: Final call-to-action section
- **Header**: Sticky navigation
- **Footer**: Social links and copyright

### Configuration
- All content controlled via `hugo.yaml`
- No markdown editing required for main content
- Easy customization with parameters

---

## Configuration

Edit `hugo.yaml` to customize your landing page:

### Basic Info
```yaml
baseURL: "https://your-domain.com/"
title: "My Product"
languageCode: "en-us"

params:
  description: "Launch your product with confidence"
  author: "Your Company"
```

### Hero Section
```yaml
params:
  hero:
    title: "Launch Your Product with Confidence"
    subtitle: "The all-in-one platform for modern teams"
    ctaText: "Get Started"
    ctaLink: "#contact"
    secondaryCtaText: "Learn More"
    secondaryCtaLink: "#features"
    image: "/images/hero.png"  # Optional
```

### Features
```yaml
params:
  features:
    - title: "Fast & Reliable"
      description: "Built for performance from the ground up"
      icon: "⚡"
    - title: "Secure by Default"
      description: "Enterprise-grade security out of the box"
      icon: "🔒"
    - title: "Easy Integration"
      description: "Integrate with your existing tools in minutes"
      icon: "🔧"
    - title: "24/7 Support"
      description: "Our team is here to help whenever you need"
      icon: "💬"
```

### Testimonials
```yaml
params:
  testimonials:
    - quote: "This product transformed how our team works together."
      author: "Jane Smith"
      role: "CTO, Tech Company"
      image: "/images/testimonial-1.jpg"  # Optional
    - quote: "Incredible value and amazing support. Highly recommended!"
      author: "John Doe"
      role: "Founder, Startup Inc"
      image: "/images/testimonial-2.jpg"
```

### CTA Section
```yaml
params:
  cta:
    title: "Ready to Get Started?"
    description: "Join thousands of teams already using our platform"
    buttonText: "Start Free Trial"
    buttonLink: "#contact"
```

### Social Links
```yaml
params:
  email: "hello@example.com"
  github: "https://github.com/yourusername"
  twitter: "https://twitter.com/yourusername"
  linkedin: "https://linkedin.com/company/yourcompany"
```

---

## Customization

### Colors

Edit `static/css/style.css` to change colors:

```css
:root {
    --primary-color: #3b82f6;      /* Main brand color */
    --primary-hover: #2563eb;      /* Button hover */
    --text-color: #1f2937;         /* Body text */
    --text-light: #6b7280;         /* Secondary text */
    --background: #ffffff;         /* Page background */
    --section-background: #f9fafb; /* Alternate sections */
    --border-color: #e5e7eb;       /* Borders */
}
```

### Typography

Change fonts in `static/css/style.css`:

```css
body {
    font-family: 'Your Font', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Layout Customization

Modify layouts in `layouts/`:

```
layouts/
├── _default/
│   └── baseof.html        # Base HTML structure
├── index.html             # Homepage layout
└── partials/
    ├── header.html        # Site header
    └── footer.html        # Site footer
```

### Adding Images

1. Add images to `static/images/`:
```bash
static/images/
├── hero.png
├── testimonial-1.jpg
├── testimonial-2.jpg
└── testimonial-3.jpg
```

2. Reference in `hugo.yaml`:
```yaml
params:
  hero:
    image: "/images/hero.png"
```

### Custom Sections

Add new sections by editing `layouts/index.html`:

```html
<!-- New Section -->
<section id="pricing" class="pricing">
    <div class="container">
        <h2>Pricing</h2>
        <!-- Your content -->
    </div>
</section>
```

Then add corresponding CSS in `static/css/style.css`.

---

## Deployment

### Cloudflare Workers (Recommended)

1. Update `wrangler.jsonc`:
```jsonc
{
  "name": "my-landing-page",
  "compatibility_date": "2025-01-29"
}
```

2. Build and deploy:
```bash
hugo --minify
npx wrangler deploy
```

### GitHub Actions (Automatic)

The included workflow deploys on push to `main`:

1. Add secret: `CLOUDFLARE_API_TOKEN`
2. Push to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

3. Deployment happens automatically

---

## File Structure

```
hugo-landing/
├── hugo.yaml              # All content and configuration
├── wrangler.jsonc         # Cloudflare Workers config
├── .gitignore             # Git ignores
├── content/
│   └── _index.md          # Homepage (minimal)
├── layouts/
│   ├── _default/
│   │   └── baseof.html    # Base template
│   ├── index.html         # Homepage layout
│   └── partials/
│       ├── header.html    # Site header
│       └── footer.html    # Site footer
├── static/
│   ├── css/
│   │   └── style.css      # All styles
│   └── images/            # Your images
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions
```

---

## Styling Tips

### Gradient Backgrounds

The hero section uses a gradient:

```css
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

Change colors:
- Use [UI Gradients](https://uigradients.com/) for inspiration
- Or solid color: `background: #3b82f6;`

### Button Styles

Customize buttons in CSS:

```css
.btn-primary {
    background: #3b82f6;
    color: white;
    /* Add more styles */
}
```

### Spacing

Adjust section padding:

```css
.hero {
    padding: 6rem 0;  /* Top/bottom padding */
}
```

---

## Advanced Features

### Add More Sections

Create reusable section templates:

1. Add partial: `layouts/partials/pricing.html`
2. Include in `layouts/index.html`:
```html
{{ partial "pricing.html" . }}
```

### Analytics

Add Google Analytics or Plausible:

Edit `layouts/_default/baseof.html`:

```html
<head>
    <!-- Existing tags -->
    <script defer data-domain="your-domain.com" src="https://plausible.io/js/script.js"></script>
</head>
```

### Contact Form

Integrate Cloudflare Forms or external service:

```html
<form action="https://formspree.io/f/your-form-id" method="POST">
    <input type="email" name="email" required>
    <textarea name="message" required></textarea>
    <button type="submit">Send</button>
</form>
```

### SEO Optimization

Add meta tags in `layouts/_default/baseof.html`:

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{ .Site.Params.description }}">
    <meta property="og:title" content="{{ .Site.Title }}">
    <meta property="og:description" content="{{ .Site.Params.description }}">
    <meta property="og:image" content="{{ .Site.BaseURL }}/images/og-image.png">
    <meta name="twitter:card" content="summary_large_image">
</head>
```

---

## Responsive Design

The template is mobile-first:

- Flexbox and Grid for layouts
- Media queries at 768px breakpoint
- Touch-friendly buttons and navigation

Test on different devices:

```bash
# Run server accessible from other devices
hugo server --bind 0.0.0.0
```

---

## Performance

Optimize for speed:

1. **Minify**: Use `hugo --minify` for production
2. **Images**: Compress images with tools like TinyPNG
3. **Fonts**: Use system fonts or subset custom fonts
4. **CSS**: Remove unused styles before launch

---

## Common Patterns

### Adding a Video

Replace hero image with video:

```html
<!-- In layouts/index.html -->
<div class="hero-video">
    <video autoplay muted loop playsinline>
        <source src="/videos/hero.mp4" type="video/mp4">
    </video>
</div>
```

### Newsletter Signup

Add email signup form:

```html
<form action="/api/newsletter" method="POST">
    <input type="email" name="email" placeholder="Enter your email" required>
    <button type="submit">Subscribe</button>
</form>
```

### Logo in Header

Add logo image:

```html
<!-- In layouts/partials/header.html -->
<a href="/" class="logo">
    <img src="/images/logo.svg" alt="{{ .Site.Title }}">
</a>
```

---

## Troubleshooting

### Styles Not Loading
- Ensure CSS path is `/css/style.css` (note leading slash)
- Check file exists in `static/css/style.css`
- Clear browser cache

### Layout Looks Broken
- Run `hugo server` and check for build errors
- Verify closing HTML tags in layouts
- Check CSS syntax errors

### Images Not Showing
- Images must be in `static/` directory
- Use absolute paths: `/images/photo.jpg`
- Check file names match (case-sensitive)

---

## Next Steps

1. ✅ Copy template
2. ✅ Customize `hugo.yaml` (title, content, colors)
3. ✅ Add your images to `static/images/`
4. ✅ Customize CSS colors and fonts
5. ✅ Test with `hugo server`
6. ✅ Build with `hugo --minify`
7. ✅ Deploy with `npx wrangler deploy`

---

## Inspiration & Resources

- **Colors**: [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- **Gradients**: [UI Gradients](https://uigradients.com/)
- **Icons**: [Lucide Icons](https://lucide.dev/), [Heroicons](https://heroicons.com/)
- **Fonts**: [Google Fonts](https://fonts.google.com/)
- **Images**: [Unsplash](https://unsplash.com/), [Pexels](https://www.pexels.com/)

---

**This template provides a clean, customizable landing page with no dependencies beyond Hugo.**
