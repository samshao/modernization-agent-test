/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns. Base block: columns.
 * Source: https://www.zendesk.com
 * Instances: #logos (8-logo strip), #datapoints (3 stats),
 *   #forethought / #gartner / #marketplace_ecosystem / #teaser-* (warriors)
 *   two-up promo banners (image + text + CTA).
 * Generated: 2026-07-30
 *
 * Block library structure: first row = block name; subsequent row(s) become
 * side-by-side columns. Column count is derived from the source layout.
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

// Return the first real image found within a scope element.
function firstImage(scope, document) {
  if (!scope) return null;
  for (const img of scope.querySelectorAll('img')) {
    const picked = pickImage(img, document);
    if (picked) return picked;
  }
  return null;
}

// Clean a link: unwrap styled-component span wrappers to plain text + href,
// dropping decorative base64 icons.
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

export default function parse(element, { document }) {
  const cells = [];

  // ---- Variant A: logo strip (#logos) ----
  const logos = element.querySelectorAll('img[class*="LogotypeRowstyle__Logo"], [class*="LogotypeRow"] img');
  if (logos.length) {
    const row = [];
    const seen = new Set();
    logos.forEach((img) => {
      const picked = pickImage(img, document);
      if (picked && !seen.has(picked.getAttribute('src'))) {
        seen.add(picked.getAttribute('src'));
        row.push(picked);
      }
    });
    if (row.length) {
      // Each logo becomes its own column in a single row.
      cells.push(row);
      const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
      element.replaceWith(block);
      return;
    }
  }

  // ---- Variant B: statistics (#datapoints) ----
  // Scope to div.stat-figure (animated counters). The testimonials carousel uses
  // p.stat-figure with a different shape, which must not trigger this branch.
  const statFigures = element.querySelectorAll('div.stat-figure');
  if (statFigures.length) {
    const row = [];
    statFigures.forEach((fig) => {
      const cell = [];
      // The displayed value is the first span (later spans are animation digits).
      const valueSpan = fig.querySelector(':scope span, span');
      const value = valueSpan ? valueSpan.textContent.trim() : fig.textContent.trim();
      if (value) {
        const h = document.createElement('h2');
        h.textContent = value;
        cell.push(h);
      }
      // Label sits in a sibling .stat-text within the same stat wrapper.
      const wrapper = fig.closest('div');
      const label = wrapper && wrapper.parentNode
        ? wrapper.parentNode.querySelector('.stat-text')
        : null;
      if (label && label.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = label.textContent.trim();
        cell.push(p);
      }
      row.push(cell);
    });
    if (row.length) {
      cells.push(row);
      const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
      element.replaceWith(block);
      return;
    }
  }

  // ---- Variant C: two-up promo banner (image + text/CTA) ----
  // Text column: headings, body text, CTAs. Image column: the banner asset.
  const textCell = [];

  // Eyebrow / sticker paragraph often uses a HeadingRoot <p> before the main heading.
  element.querySelectorAll('h1, h2, h3, h4').forEach((h) => {
    if (h.textContent.trim()) textCell.push(h);
  });

  element
    .querySelectorAll('[class*="Textstyle__TextRoot"] > p')
    .forEach((p) => { if (p.textContent.trim()) textCell.push(p); });

  const ctaLinks = [];
  const seenHref = new Set();
  element.querySelectorAll('[class*="LinkGroup"] a[href], a[class*="StyledAnchor"][href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || seenHref.has(href)) return;
    const link = cleanLink(a, document);
    if (link) { seenHref.add(href); ctaLinks.push(link); }
  });
  ctaLinks.forEach((l) => textCell.push(l));

  const image = firstImage(element, document);

  // Empty-block guard.
  if (textCell.length === 0 && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build a two-column row (text | image). If no image, use a single column.
  if (image) {
    cells.push([textCell, [image]]);
  } else {
    cells.push([textCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
