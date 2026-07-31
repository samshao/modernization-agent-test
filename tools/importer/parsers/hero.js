/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero. Base: hero.
 * Source: blog-post pages (section.b4-hero)
 * Generated for Fortinet blog-post migration.
 *
 * Structure (from library-description.txt): Hero, 1 column, up to 3 rows.
 *   Row 2 (optional): background/feature image.
 *   Row 3: title (heading) + subheading + optional CTA/eyebrow.
 * Matches the project hero block (single-column: image row then content row).
 *
 * Source: category eyebrow is an anchor wrapping `p.b4-hero__kicker`; title is
 * `h1.b4-hero__headline`; subtitle is `p.b4-hero__subtitle`. The teal pattern is
 * a CSS background (not an <img>); the only <img> present is a base64 decorative
 * dot pattern, which is skipped. A real feature image is emitted if present.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Optional background/feature image — promote lazy attrs, skip base64/decorative.
  let bgImage = null;
  const imgs = Array.from(element.querySelectorAll('img'));
  imgs.forEach((img) => {
    if (bgImage) return;
    const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
    const src = img.getAttribute('src');
    if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
    const finalSrc = img.getAttribute('src');
    // Skip base64 placeholders and decorative dot/line SVGs inside .right-dots / .section-aside.
    if (finalSrc && !finalSrc.startsWith('data:') && !img.closest('.right-dots, .section-aside')) {
      bgImage = img;
    }
  });
  if (bgImage) cells.push([bgImage]);

  // Content cell: eyebrow (linked) + title + subtitle.
  const contentCell = [];

  // Category eyebrow — keep its link if present.
  const kickerEl = element.querySelector('.b4-hero__kicker');
  if (kickerEl && kickerEl.textContent.trim()) {
    const eyebrow = document.createElement('p');
    const kickerLink = kickerEl.closest('a[href]') || element.querySelector('.section-content a[href]');
    if (kickerLink) {
      const a = document.createElement('a');
      a.href = kickerLink.getAttribute('href');
      a.textContent = kickerEl.textContent.trim();
      eyebrow.append(a);
    } else {
      eyebrow.textContent = kickerEl.textContent.trim();
    }
    contentCell.push(eyebrow);
  }

  // Title.
  const headlineEl = element.querySelector('.b4-hero__headline, h1');
  if (headlineEl && headlineEl.textContent.trim()) {
    const h1 = document.createElement('h1');
    h1.textContent = headlineEl.textContent.trim();
    contentCell.push(h1);
  }

  // Subtitle / summary.
  const subEl = element.querySelector('.b4-hero__subtitle');
  if (subEl && subEl.textContent.trim()) {
    const sub = document.createElement('p');
    sub.textContent = subEl.textContent.trim();
    contentCell.push(sub);
  }

  // Empty-block guard.
  if (!bgImage && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // 1-column block: content row is one cell holding all elements.
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
