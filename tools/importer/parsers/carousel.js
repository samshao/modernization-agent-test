/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: carousel. Base block: carousel.
 * Source: https://www.zendesk.com (#testimonials)
 * Generated: 2026-07-30
 *
 * Block library structure: 2 columns; first row = block name; each subsequent
 * row = one slide (cell 1 image, cell 2 optional title/description/CTA).
 *
 * Instance note: a slick carousel of customer testimonial slides. Each slide
 * carries a customer logo, stat figures, a quote (blockquote), attribution
 * (cite), and a "Read customer story" link, plus a testimonial image. Cloned
 * slides (.slick-cloned) are duplicates and must be skipped.
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

// The visual/hero image of a slide: the last content image (id="image-...")
// rather than the small customer logo. Falls back to the first content image.
function slideImage(slide, document) {
  const candidates = [];
  slide.querySelectorAll('img').forEach((img) => {
    const alt = (img.getAttribute('alt') || '').trim();
    const src = img.getAttribute('src') || '';
    if (!alt && src.startsWith('data:image/svg+xml')) return; // spacer
    candidates.push(img);
  });
  if (!candidates.length) return null;
  const idImg = candidates.find((i) => (i.getAttribute('id') || '').startsWith('image-'));
  const chosen = idImg || candidates[candidates.length - 1];
  return pickImage(chosen, document) || '';
}

export default function parse(element, { document }) {
  const cells = [];

  const slides = element.querySelectorAll('.slick-slide:not(.slick-cloned)');
  const list = slides.length
    ? slides
    : element.querySelectorAll('[class*="slick-slide"], [class*="Slide"]');

  const seenQuotes = new Set();
  list.forEach((slide) => {
    const contentCell = [];

    // Customer logo (first small logo image) as the slide title/media.
    const logo = slide.querySelector('img[alt*="Logo"], img[alt*="logo"]');
    const logoImg = logo ? pickImage(logo, document) : null;
    if (logoImg) contentCell.push(logoImg);

    // Stat figures (e.g. "6%" + "increase in automated resolutions"). Each slide
    // renders the stat set twice (a compact view and an image overlay), so pair
    // each figure with its headline and de-duplicate by figure value.
    const seenStats = new Set();
    slide.querySelectorAll('[class*="StatRoot"]').forEach((stat) => {
      const figEl = stat.querySelector('.stat-figure');
      const headEl = stat.querySelector('.stat-headline');
      const fig = figEl ? figEl.textContent.replace(/\s+/g, ' ').trim() : '';
      const head = headEl ? headEl.textContent.replace(/\s+/g, ' ').trim() : '';
      const key = fig + '|' + head;
      if ((!fig && !head) || seenStats.has(key)) return;
      seenStats.add(key);
      if (fig) {
        const p = document.createElement('p');
        p.textContent = fig;
        contentCell.push(p);
      }
      if (head) {
        const p = document.createElement('p');
        p.textContent = head;
        contentCell.push(p);
      }
    });

    // Quote.
    const quote = slide.querySelector('blockquote');
    if (quote && quote.textContent.trim()) contentCell.push(quote);

    // Attribution (name + role) inside <cite>.
    const cite = slide.querySelector('cite');
    if (cite) {
      cite.querySelectorAll('p').forEach((p) => {
        if (p.textContent.trim()) contentCell.push(p);
      });
    }

    // "Read customer story" CTA.
    const cta = slide.querySelector('a[href]');
    if (cta && cta.getAttribute('href')) {
      const link = document.createElement('a');
      link.setAttribute('href', cta.getAttribute('href'));
      link.textContent = cta.textContent.replace(/\s+/g, ' ').trim() || 'Read customer story';
      contentCell.push(link);
    }

    // Skip empty / duplicate slides.
    const key = quote ? quote.textContent.replace(/\s+/g, ' ').trim() : contentCell.map((n) => n.textContent).join('|');
    if (!contentCell.length || seenQuotes.has(key)) return;
    seenQuotes.add(key);

    const image = slideImage(slide, document);
    cells.push([image === null ? '' : image, contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
