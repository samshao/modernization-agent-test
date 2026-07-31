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
    const img = post.querySelector('img');
    let image = null;
    if (img) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const src = img.getAttribute('src');
      if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
      const finalSrc = img.getAttribute('src');
      if (finalSrc && !finalSrc.startsWith('data:')) image = img;
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
