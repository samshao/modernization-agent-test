/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards. Base block: cards.
 * Source: https://www.zendesk.com
 * Instances:
 *   #resolution_learning_loop — 3 feature items (heading only, no images) -> 'cards (no images)'
 *   #promoblock-* relate pillars — 3 items (image + h4 + desc + CTA)
 *   #employee_service_contact_center — 2 product cards (image + h3 + desc + CTAs)
 *   #resources — 4 resource cards (image + category/title + Learn more link)
 * Generated: 2026-07-30
 *
 * Block library structure: 2 columns; first row = block name; each subsequent
 * row = one card (cell 1 image, cell 2 title/description/CTA). When no card is
 * meant to have an image, use the 1-column 'cards (no images)' variant.
 * Image cells that resolve to a base64 placeholder are emitted empty but the
 * 2-column shape is preserved for image-bearing card sets.
 */

function pickImage(img, document) {
  if (!img) return null;
  let src = img.getAttribute('src') || '';
  const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
  if ((!src || src.startsWith('data:')) && lazy) src = lazy;
  if (!src || src.startsWith('data:')) {
    const ss = img.getAttribute('data-srcset') || img.getAttribute('srcset') || '';
    if (ss) src = ss.split(',')[0].trim().split(/\s+/)[0];
  }
  if (!src || src.startsWith('data:')) return null;
  const out = document.createElement('img');
  out.setAttribute('src', src);
  const alt = img.getAttribute('alt');
  if (alt) out.setAttribute('alt', alt);
  return out;
}

// Find a *content* image element (as opposed to decorative svg spacers or
// canvas visuals). Content images carry an id like "image-..." or a real alt.
function contentImg(scope) {
  if (!scope) return null;
  for (const img of scope.querySelectorAll('img')) {
    const alt = (img.getAttribute('alt') || '').trim();
    const id = img.getAttribute('id') || '';
    const src = img.getAttribute('src') || '';
    // Skip decorative aspect-ratio svg spacers (empty alt, inline svg data URI).
    if (!alt && src.startsWith('data:image/svg+xml')) continue;
    if (id.startsWith('image-') || alt || (src && !src.startsWith('data:'))) return img;
  }
  return null;
}

// Resolve the image cell for a card. Returns a clean <img> when a real source
// is available; otherwise '' (base64 placeholders are ignored) so the card row
// still carries an image column when the card is meant to have one.
function imageCell(scope, document) {
  const raw = contentImg(scope);
  if (!raw) return null; // no content image at all -> card has no image
  const picked = pickImage(raw, document);
  return picked || '';
}

function cleanLink(a, document) {
  const href = a.getAttribute('href');
  if (!href) return null;
  const text = a.textContent.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const link = document.createElement('a');
  link.setAttribute('href', href);
  link.textContent = text;
  return link;
}

// Build the text side of a card from a scope: heading(s), description(s), CTA link(s).
function buildTextCell(scope, document) {
  const cell = [];
  scope.querySelectorAll('h2, h3, h4, h5').forEach((h) => {
    if (h.textContent.trim()) cell.push(h);
  });
  scope.querySelectorAll('[class*="Textstyle__TextRoot"] > p').forEach((p) => {
    if (p.textContent.trim()) cell.push(p);
  });
  const seen = new Set();
  scope.querySelectorAll('[class*="LinkGroup"] a[href], a[class*="StyledAnchor"][href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || seen.has(href)) return;
    const link = cleanLink(a, document);
    if (link) { seen.add(href); cell.push(link); }
  });
  return cell;
}

export default function parse(element, { document }) {
  const rows = [];
  let anyImage = false;

  // ---- Variant D: resources link cards (slick carousel of <a> LinkCards) ----
  const linkCards = element.querySelectorAll(
    '.slick-slide:not(.slick-cloned) a[class*="LinkCardstyle__LinkCardRoot"]',
  );
  if (linkCards.length) {
    linkCards.forEach((a) => {
      const href = a.getAttribute('href');
      const image = imageCell(a, document);
      if (image !== null) anyImage = true;
      const cell = [];
      // Two <p> headings inside LinkCardContent: category tag + title.
      a.querySelectorAll('[class*="LinkCardContent"] > p, [class*="HeadingRoot"]').forEach((p) => {
        const t = p.textContent.replace(/\s+/g, ' ').trim();
        if (t) {
          const el = document.createElement('p');
          el.textContent = t;
          cell.push(el);
        }
      });
      // "Learn more" faux link -> real link using the card's href.
      const faux = a.querySelector('[class*="FauxLink"], [class*="LinkText"]');
      if (href) {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = (faux && faux.textContent.trim()) || 'Learn more';
        cell.push(link);
      }
      rows.push({ image, cell });
    });
  }

  // ---- Variant C: employee/contact-center product cards ----
  if (rows.length === 0) {
    const productCards = element.querySelectorAll('[class*="Cardstyle__CardRoot"]');
    if (productCards.length) {
      productCards.forEach((card) => {
        const image = imageCell(card, document);
        if (image !== null) anyImage = true;
        rows.push({ image, cell: buildTextCell(card, document) });
      });
    }
  }

  // ---- Variant B: relate 3-pillars (image + h4 + desc + CTA) ----
  if (rows.length === 0) {
    const pillars = element.querySelectorAll('h4');
    if (pillars.length) {
      pillars.forEach((h4) => {
        // The pillar item is the wrapper two levels up (img column + text column).
        const item = h4.parentNode && h4.parentNode.parentNode ? h4.parentNode.parentNode : h4.parentNode;
        const image = imageCell(item, document);
        if (image !== null) anyImage = true;
        rows.push({ image, cell: buildTextCell(item, document) });
      });
    }
  }

  // ---- Variant A: resolution learning loop feature items (heading only) ----
  if (rows.length === 0) {
    const features = element.querySelectorAll('[id^="rll-block-"]');
    if (features.length) {
      features.forEach((item) => {
        const image = imageCell(item, document);
        if (image !== null) anyImage = true;
        rows.push({ image, cell: buildTextCell(item, document) });
      });
    }
  }

  // Empty-block guard.
  if (rows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (anyImage) {
    // 2-column cards: [image, textCell] per row. Pad missing image with empty cell.
    rows.forEach(({ image, cell }) => {
      cells.push([image || '', cell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
    element.replaceWith(block);
  } else {
    // 1-column 'cards (no images)' variant.
    rows.forEach(({ cell }) => {
      cells.push([cell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards (no images)', cells });
    element.replaceWith(block);
  }
}
