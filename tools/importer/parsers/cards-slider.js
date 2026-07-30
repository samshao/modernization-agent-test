/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-slider. Base: cards.
 * Source: https://www.fortinet.com/ (Latest News slider & Upcoming Events slider)
 * Generated for Fortinet homepage migration.
 *
 * Structure (from library-description.txt): 2 columns, one row per card.
 *   Col 1: image (mandatory). Col 2: title (heading) + description + CTA.
 * Each source `.ftnt-product` is one card.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.ftnt-product'));

  const cells = [];

  cards.forEach((card) => {
    // Image: lozad lazy-loads the real URL into data-src while src holds a
    // base64 placeholder. Promote data-src to src so the image is captured.
    const img = card.querySelector('picture img, img.ftnt-image, img');
    let image = null;
    if (img) {
      const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const src = img.getAttribute('src');
      if ((!src || src.startsWith('data:')) && dataSrc) {
        img.setAttribute('src', dataSrc);
      }
      if (img.getAttribute('src') && !img.getAttribute('src').startsWith('data:')) {
        image = img;
      }
    }

    // Title: the news title text lives in b.ftnt-news-title inside the headline anchor.
    const titleEl = card.querySelector('.ftnt-news-title, b.ftnt-news-title');
    const titleLink = card.querySelector('a.ftnt-anchor[href]:not(.ftnt-picture a)')
      || card.querySelector('.ftnt-detail a.ftnt-anchor[href]');
    let heading = null;
    if (titleEl) {
      heading = document.createElement('h3');
      if (titleLink) {
        const a = document.createElement('a');
        a.href = titleLink.getAttribute('href');
        a.textContent = titleEl.textContent.trim();
        heading.append(a);
      } else {
        heading.textContent = titleEl.textContent.trim();
      }
    }

    // Description.
    const descEl = card.querySelector('.ftnt-news-description');
    let description = null;
    if (descEl) {
      description = document.createElement('p');
      description.textContent = descEl.textContent.trim();
    }

    // CTA: "READ THE PRESS RELEASE" / "READ THE BLOG" / "DOWNLOAD THE REPORT".
    const ctaAnchor = card.querySelector('a.ftnt-download-anchor[href]');
    let cta = null;
    if (ctaAnchor) {
      cta = document.createElement('a');
      cta.href = ctaAnchor.getAttribute('href');
      cta.textContent = ctaAnchor.textContent.trim();
    }

    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);

    // Skip empty cards.
    if (!image && contentCell.length === 0) return;

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-slider', cells });
  element.replaceWith(block);
}
