# therisklab-website

The public marketing site for The Risk Lab, served at [therisklab.ai](https://therisklab.ai).

## What's here

A plain static site: hand-written HTML, CSS and a little JavaScript. There is no build step, framework or package manager.

- `index.html`, `about.html`, `services.html`, `clients.html`, `contact.html`, `thank-you.html`: the site's pages
- `insights/`: Insights articles
- `style.css`, `components.css`, `script.js`: shared styles and script
- `assets/`: logos, icons, images and photos
- `sitemap.xml`, `robots.txt`: crawler files
- `netlify.toml`: Netlify redirects and cache headers

## Deployment

Netlify deploys the site from the `main` branch. Anything merged into `main` goes live on therisklab.ai, so do your work on a branch and merge only when it's ready to publish.
