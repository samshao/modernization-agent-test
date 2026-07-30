/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero. Base block: hero.
 * Source: https://www.zendesk.com (#hero)
 * Generated: 2026-07-30
 *
 * Block library structure (1 column, 3 rows):
 *   Row 1: block name
 *   Row 2: background image (optional)
 *   Row 3: content cell — title (heading), subheading, CTA, supporting text
 *
 * Instance notes: full-bleed hero photo + eyebrow (h1) + headline (h2) +
 * supporting paragraph + an email-signup form. The form's submit is modeled
 * as a "Try for free" CTA link; trust microcopy + privacy link are kept as text.
 */

// Promote lazy-loaded images and skip base64 placeholders.
// Preserves Scene7 / cdn-cgi URLs (incl. query params) as-is.
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

// Clone a text element and strip embedded base64 placeholder images (icons/checkmarks),
// while preserving real links inside it.
function cleanText(el) {
  if (!el) return null;
  const clone = el.cloneNode(true);
  clone.querySelectorAll('img[src^="data:"], img:not([src])').forEach((i) => i.remove());
  if (!clone.textContent.trim() && !clone.querySelector('a, img')) return null;
  return clone;
}

export default function parse(element, { document }) {
  const contentCell = [];

  // Background image: the first real (non-placeholder) image in the hero.
  let bgImage = null;
  const imgs = element.querySelectorAll('img');
  for (const img of imgs) {
    const picked = pickImage(img, document);
    if (picked) { bgImage = picked; break; }
  }

  // Headings: eyebrow (h1) + headline (h2), plus generic fallbacks.
  element
    .querySelectorAll('h1, h2, h3')
    .forEach((h) => { if (h.textContent.trim()) contentCell.push(h); });

  // Supporting paragraph (the description sitting above the form).
  const desc = element.querySelector('[class*="Textstyle__TextRoot"] > p, p');
  if (desc && desc.textContent.trim()) contentCell.push(desc);

  // Primary CTA: model the form submit button as a "Try for free" link.
  const submit = element.querySelector('form button, button[type="submit"], button');
  const ctaText = (submit && submit.textContent.trim()) || 'Try for free';
  const cta = document.createElement('a');
  cta.setAttribute('href', '/register/');
  cta.textContent = ctaText;
  contentCell.push(cta);

  // Trust microcopy (e.g. "14-day free trial. No credit card required.")
  // and the privacy notice paragraph (keeps its Privacy Notice link).
  const microcopy = [];
  element.querySelectorAll('form p, [class*="Textstyle__TextRoot"]').forEach((p) => {
    const t = p.textContent.replace(/\s+/g, ' ').trim();
    if (!t) return;
    if (/free trial|no credit card/i.test(t) || p.className.includes('privacy-notice')) {
      const cleaned = cleanText(p);
      if (cleaned) microcopy.push(cleaned);
    }
  });
  microcopy.forEach((m) => contentCell.push(m));

  // Empty-block guard.
  if (contentCell.length === 0 && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (bgImage) cells.push([bgImage]);      // Row 2: background image (optional)
  cells.push([contentCell]);               // Row 3: single content cell (1-column block)

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
