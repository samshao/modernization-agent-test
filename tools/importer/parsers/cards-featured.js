/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-featured. Base: cards.
 * Source: https://www.fortinet.com/blog (section.h1-featured)
 * Generated for Fortinet blog-landing migration.
 *
 * Structure (from library-description.txt): Cards, 2 columns, one row per card.
 *   Col 1: image (mandatory in library, but blog featured imgs are base64
 *          placeholders on the scraped page -> emit empty cell when no real src).
 *   Col 2: text — category eyebrow + title heading (linked) + description.
 *
 * Source: each featured post is an `a.h1-featured__post` (one "main" post plus
 * two secondary posts). The anchor's href becomes the title link.
 */
export default function parse(element, { document }) {
  const posts = Array.from(element.querySelectorAll('a.h1-featured__post'));

  const cells = [];

  posts.forEach((post) => {
    const href = post.getAttribute('href');
    const isMain = post.classList.contains('h1-featured__post-main');

    // Image — promote lazy-load attrs, skip base64 placeholders.
    // A usable src is non-empty, not a data: URI, and not a blob: placeholder.
    // Note: the scraper wraps blob: placeholders in a CDN URL
    // (https://cdn.../blob:https://site/uuid), so match blob: ANYWHERE, not just
    // as a prefix — otherwise the placeholder gets accepted as a real image.
    const isUsableSrc = (s) => !!s && !s.startsWith('data:') && !s.includes('blob:');
    const img = post.querySelector('img');
    let image = null;
    if (img) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const src = img.getAttribute('src');
      if (!isUsableSrc(src) && isUsableSrc(lazy)) img.setAttribute('src', lazy);
      if (isUsableSrc(img.getAttribute('src'))) image = img;
    }

    // Fallback: the real hero image is a CSS background-image on the anchor or a
    // descendant (the <img> is a base64 placeholder). Extract that URL and build
    // a real <img> so the featured card renders the photo.
    if (!image) {
      const bgHost = [post, ...post.querySelectorAll('*')].find((el) => {
        const st = el.getAttribute && el.getAttribute('style');
        return st && /background(-image)?\s*:\s*url\(/i.test(st) && !/url\(\s*['"]?data:/i.test(st);
      });
      if (bgHost) {
        const m = bgHost.getAttribute('style').match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
        const bgUrl = m && m[1] ? m[1].trim() : '';
        if (bgUrl && !bgUrl.startsWith('data:')) {
          const alt = (post.querySelector('.h1-featured__headline') || {}).textContent || '';
          const newImg = document.createElement('img');
          newImg.setAttribute('src', bgUrl);
          newImg.setAttribute('alt', alt.trim());
          image = newImg;
        }
      }
    }

    // Category eyebrow.
    const kickerEl = post.querySelector('.h1-featured__kicker');
    let kicker = null;
    if (kickerEl && kickerEl.textContent.trim()) {
      kicker = document.createElement('p');
      kicker.textContent = kickerEl.textContent.trim();
    }

    // Title (linked). Larger heading for the main post.
    const headlineEl = post.querySelector('.h1-featured__headline');
    let heading = null;
    if (headlineEl && headlineEl.textContent.trim()) {
      heading = document.createElement(isMain ? 'h2' : 'h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = headlineEl.textContent.trim();
        heading.append(a);
      } else {
        heading.textContent = headlineEl.textContent.trim();
      }
    }

    // Description.
    const descEl = post.querySelector('.h1-featured__description');
    let description = null;
    if (descEl && descEl.textContent.trim()) {
      description = document.createElement('p');
      description.textContent = descEl.textContent.trim();
    }

    const contentCell = [];
    if (kicker) contentCell.push(kicker);
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);

    // Skip empty posts.
    if (!image && contentCell.length === 0) return;

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-featured', cells });
  element.replaceWith(block);
}
