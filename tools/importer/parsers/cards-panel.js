/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-panel. Base: cards.
 * Source: https://www.fortinet.com/ (convergence category panels)
 * Generated for Fortinet homepage migration.
 *
 * Structure (from library-description.txt): 2 columns, one row per card.
 *   Col 1: image/icon (optional here — panels may be text-only).
 *   Col 2: title (heading, linked) + description + navigation links.
 * The instance selector targets the heading row inside `main`, but the actual
 * panels live in a sibling `.fabric-bg` div; scope to the `#fabric-area` ancestor.
 */
export default function parse(element, { document }) {
  const scope = element.closest('#fabric-area') || element.parentElement || element;
  const cards = Array.from(scope.querySelectorAll('.white-box'));

  const cells = [];

  cards.forEach((card) => {
    // Icon image (optional). Promote lazy-load attrs; ignore base64 placeholders.
    const img = card.querySelector(':scope > img, img');
    let image = null;
    if (img) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const src = img.getAttribute('src');
      if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
      if (img.getAttribute('src') && !img.getAttribute('src').startsWith('data:')) image = img;
    }

    const detail = card.querySelector('.box-detail') || card;

    // Title: prefer the linked title in box-detail (a.box-title containing h3).
    const titleLink = detail.querySelector('a.box-title[href]');
    const titleText = (titleLink && titleLink.textContent.trim())
      || (card.querySelector('.box-label h3, h3') && card.querySelector('.box-label h3, h3').textContent.trim());
    let heading = null;
    if (titleText) {
      heading = document.createElement('h3');
      if (titleLink && titleLink.getAttribute('href')) {
        const a = document.createElement('a');
        a.href = titleLink.getAttribute('href');
        a.textContent = titleText;
        heading.append(a);
      } else {
        heading.textContent = titleText;
      }
    }

    // Description (immediate paragraph in the detail area).
    const description = detail.querySelector(':scope > p, p');

    // Navigation links list.
    const linkList = detail.querySelector(':scope > ul, ul');

    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (linkList) contentCell.push(linkList);

    // Skip empty panels.
    if (!image && contentCell.length === 0) return;

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Lift the section heading (e.g. "Fortify Your Network...") out of the block so
  // it survives as default content above the panels rather than being discarded.
  const sectionHeading = scope.querySelector('h1, h2');
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-panel', cells });
  if (sectionHeading) {
    const headingClone = sectionHeading.cloneNode(true);
    element.replaceWith(headingClone, block);
  } else {
    element.replaceWith(block);
  }
}
