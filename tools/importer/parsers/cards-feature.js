/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base: cards.
 * Source: https://www.fortinet.com/ (platform feature tiles)
 * Generated for Fortinet homepage migration.
 *
 * Structure (from library-description.txt): 2 columns, one row per card.
 *   Col 1: icon image. Col 2: label + title (heading) + description.
 * Each source `.product-card` is one tile. The card element may itself be an
 * anchor (its href becomes the title link).
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.product-card'));

  const cells = [];

  cards.forEach((card) => {
    // Icon image. Promote lazy-load attrs; ignore base64 placeholders.
    const img = card.querySelector('img.product-image, .product-card-body img, img');
    let image = null;
    if (img) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const src = img.getAttribute('src');
      if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
      if (img.getAttribute('src') && !img.getAttribute('src').startsWith('data:')) image = img;
    }

    // Label (e.g. "ONE OPERATING SYSTEM").
    const labelEl = card.querySelector('.product-card-header span, .product-card-header');
    let label = null;
    if (labelEl && labelEl.textContent.trim()) {
      label = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = labelEl.textContent.trim();
      label.append(strong);
    }

    // Title. The card may itself be an anchor with an href.
    const titleEl = card.querySelector('.product-title, b.product-title');
    const href = card.matches('a[href]') ? card.getAttribute('href')
      : (card.querySelector('a[href]') ? card.querySelector('a[href]').getAttribute('href') : null);
    let heading = null;
    if (titleEl && titleEl.textContent.trim()) {
      heading = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleEl.textContent.trim();
        heading.append(a);
      } else {
        heading.textContent = titleEl.textContent.trim();
      }
    }

    // Description.
    const descEl = card.querySelector('.product-desc, p.product-desc');
    let description = null;
    if (descEl && descEl.textContent.trim()) {
      description = document.createElement('p');
      description.textContent = descEl.textContent.trim();
    }

    const contentCell = [];
    if (label) contentCell.push(label);
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);

    // Skip empty tiles.
    if (!image && contentCell.length === 0) return;

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
