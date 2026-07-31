/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-press. Base: hero (press-release variant).
 * Source: https://www.fortinet.com/corporate/about-us/newsroom/press-releases/...
 *         (div.C941-Product-Hero-Banner)
 * Generated for the Fortinet press-release migration.
 *
 * Follows the Hero library convention: 1 column,
 *   Row 1: block name (added by createBlock)
 *   Row 2: Background/feature image (optional)
 *   Row 3: content cell — eyebrow (category link), Title (h1), Subheading (p),
 *          and the dateline (bold text). hero-press.js styles the dark banner.
 *
 * Source anatomy (see migration-work/block-context/hero-press/source.html):
 *   - eyebrow:  .announcement.pr span a           ("Press Releases" + href)
 *   - title:    .section-content h1
 *   - subtitle: .section-content h1 + p
 *   - dateline: .section-content ... strong        ("Jul 28, 2026 - SUNNYVALE, Calif.")
 *   - image:    optional real <img> (none in this instance; decorative dots
 *               SVG in .section-aside / .right-dots are ignored)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Row 2 (optional) — real feature image. Promote lazy attrs; skip base64
  // placeholders and decorative dots/lines inside .right-dots / .section-aside.
  let feature = null;
  Array.from(element.querySelectorAll('img')).forEach((img) => {
    if (feature) return;
    const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
    let src = img.getAttribute('src');
    if ((!src || src.startsWith('data:')) && lazy) {
      img.setAttribute('src', lazy);
      src = lazy;
    }
    if (src && !src.startsWith('data:') && !img.closest('.right-dots, .section-aside')) {
      feature = img;
    }
  });
  if (feature) cells.push([feature]);

  // Row 3 — content cell: eyebrow + title + subtitle + dateline.
  const content = [];

  // Eyebrow (category link) — keep link + href when present.
  const eyebrowLink = element.querySelector('.announcement.pr span a[href], .new-announcement a[href]');
  if (eyebrowLink && eyebrowLink.textContent.trim()) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = eyebrowLink.getAttribute('href');
    a.textContent = eyebrowLink.textContent.trim();
    p.append(a);
    content.push(p);
  }

  // Title.
  const headlineEl = element.querySelector('.section-content h1, h1');
  if (headlineEl && headlineEl.textContent.trim()) {
    const h1 = document.createElement('h1');
    h1.textContent = headlineEl.textContent.trim();
    content.push(h1);
  }

  // Subheading — the paragraph immediately after the h1 (not the dateline).
  let subtitleEl = null;
  if (headlineEl) {
    let sib = headlineEl.nextElementSibling;
    while (sib && !subtitleEl) {
      if (sib.tagName === 'P' && sib.textContent.trim() && !sib.querySelector('strong')) {
        subtitleEl = sib;
      }
      sib = sib.nextElementSibling;
    }
  }
  if (subtitleEl) {
    const p = document.createElement('p');
    p.textContent = subtitleEl.textContent.trim();
    content.push(p);
  }

  // Dateline (bold text like "Jul 28, 2026 - SUNNYVALE, Calif.").
  const strongEl = element.querySelector('.section-content strong');
  if (strongEl && strongEl.textContent.trim()) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = strongEl.textContent.trim();
    p.append(strong);
    content.push(p);
  }

  // Empty-block guard — unwrap if nothing usable was found.
  if (!feature && content.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-press', cells });
  element.replaceWith(block);
}
