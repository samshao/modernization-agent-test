/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-trust. Base: cards (no images variant).
 * Source: https://www.fortinet.com/ (Trusted Company/Products/Processes/Partners tiles)
 * Generated for Fortinet homepage migration.
 *
 * Structure (from library-description.txt "Cards (no images)"): 1 column,
 * one row per card. The single cell holds: heading (tile title) + description +
 * CTA. No images (the header icon is decorative). Each `.trusted-tile` anchor
 * is one tile; its href becomes the CTA link.
 */
export default function parse(element, { document }) {
  const tiles = Array.from(element.querySelectorAll('.trusted-tile'));

  const cells = [];

  tiles.forEach((tile) => {
    // Title: the text div inside the trust-header (sibling of the decorative icon).
    const headerTitle = tile.querySelector('.trust-header > div, .trust-header div');
    let heading = null;
    if (headerTitle && headerTitle.textContent.trim()) {
      heading = document.createElement('h3');
      heading.textContent = headerTitle.textContent.trim();
    }

    // Description.
    const infoEl = tile.querySelector('.trust-info');
    let description = null;
    if (infoEl && infoEl.textContent.trim()) {
      description = document.createElement('p');
      description.textContent = infoEl.textContent.trim();
    }

    // CTA: the "Learn More" link. The tile itself is the anchor holding the href.
    const linkEl = tile.querySelector('.trust-link');
    const href = tile.matches('a[href]') ? tile.getAttribute('href')
      : (tile.querySelector('a[href]') ? tile.querySelector('a[href]').getAttribute('href') : null);
    let cta = null;
    const ctaText = (linkEl && linkEl.textContent.trim()) || '';
    if (href) {
      cta = document.createElement('a');
      cta.href = href;
      cta.textContent = ctaText.replace(/\s*»\s*$/, '').trim() || 'Learn More';
    }

    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);

    // Skip empty tiles.
    if (contentCell.length === 0) return;

    // 1-column block: one row, one cell holding all elements.
    cells.push([contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-trust', cells });
  element.replaceWith(block);
}
