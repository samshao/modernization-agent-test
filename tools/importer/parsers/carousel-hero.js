/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://www.fortinet.com/ (billboard hero slider)
 * Generated for Fortinet homepage migration.
 *
 * Structure (from library-description.txt): 2 columns, one row per slide.
 *   Col 1: image (mandatory). Col 2: title (heading) + description + CTA(s).
 */
export default function parse(element, { document }) {
  // Each slide in the source is a `.valprop--home-slide` (fallback: `.cycle-slide`).
  let slides = Array.from(element.querySelectorAll('.valprop--home-slide, .cycle-slide'));
  // Deduplicate in case both classes match the same element.
  slides = slides.filter((slide, idx) => slides.indexOf(slide) === idx);

  const cells = [];

  // Resolve a usable image node. The billboard image may be either a real <img>
  // or a CSS background-image on an inner wrapper div (as on the live page).
  const resolveImage = (slide) => {
    const imgs = Array.from(slide.querySelectorAll('img'));
    // Prefer an <img> that already has a real (non-data) src.
    let img = imgs.find((i) => i.getAttribute('src') && !i.getAttribute('src').startsWith('data:'));
    if (!img) {
      // Fall back to an image carrying a lazy-load attribute.
      img = imgs.find((i) => i.getAttribute('data-src') || i.getAttribute('data-original') || i.getAttribute('data-lazy-src') || i.getAttribute('srcset'));
    }
    if (img) {
      const lazySrc = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
      const currentSrc = img.getAttribute('src');
      if ((!currentSrc || currentSrc.startsWith('data:')) && lazySrc) {
        img.setAttribute('src', lazySrc);
      }
      return img;
    }
    // No usable <img> — look for a CSS background-image on an inner element.
    // The active slide uses `style`; deferred slides carry it in `data-style`.
    const bgEls = [slide, ...Array.from(slide.querySelectorAll(':scope > div, [style*="background"], [data-style*="background"]'))];
    for (const el of bgEls) {
      if (!el.getAttribute) continue;
      const style = el.getAttribute('style') || el.getAttribute('data-style');
      if (!style) continue;
      const match = style.match(/background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/i);
      if (match && match[2] && !match[2].startsWith('data:')) {
        const created = document.createElement('img');
        created.src = match[2];
        const heading = slide.querySelector('.valprop--home-head, h1, h2, h3');
        if (heading) created.alt = heading.textContent.trim();
        return created;
      }
    }
    return null;
  };

  slides.forEach((slide) => {
    // Image: first real image in the slide (the full-bleed background).
    // Ignore inline base64 SVG decorations and handle lazy-loaded images.
    const image = resolveImage(slide);

    // Title: styled heading (source uses h1/h2 with class valprop--home-head).
    const title = slide.querySelector('.valprop--home-head, h1, h2, h3');
    // Description / subhead.
    const description = slide.querySelector('.valprop--home-subhead, p');
    // CTA links (may be multiple).
    const ctaLinks = Array.from(slide.querySelectorAll('a.button--transparent--home, a[class*="button"]'));

    const contentCell = [];
    if (title) contentCell.push(title);
    if (description) contentCell.push(description);
    contentCell.push(...ctaLinks);

    // Skip empty slides that have neither image nor text.
    if (!image && contentCell.length === 0) return;

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard: if no slides were found, unwrap the element.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
