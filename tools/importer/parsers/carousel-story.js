/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-story. Base: carousel.
 * Source: https://www.fortinet.com/ (customer stories banner, #banner1)
 * Generated for Fortinet homepage migration.
 *
 * Structure (from library-description.txt): 2 columns, one row per slide.
 *   Col 1: image (mandatory). Col 2: title (heading) + quote/description + attribution + CTA(s).
 * The instance selector targets a single banner, so this yields one slide row.
 */
export default function parse(element, { document }) {
  // The element may be a single banner, or a container (.customer-stories) that
  // holds multiple .banner slides (#banner1..#bannerN). Prefer one slide per
  // .banner-content; fall back to the element itself for a lone banner.
  let slides = Array.from(element.querySelectorAll('.banner-content'));
  if (slides.length === 0) {
    slides = element.classList && element.classList.contains('banner-content')
      ? [element]
      : [element];
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image scope: the banner photo is a sibling of .banner-content, so search the
    // closest .banner wrapper (falling back to the slide, then the element itself).
    const imageScope = slide.closest('.banner') || slide;
    const resolveSrc = (img) => img.getAttribute('src')
      || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
    // Image: the customer photo. Ignore inline base64 SVG decorations.
    let image = Array.from(imageScope.querySelectorAll('img.banner-image'))
      .find((img) => resolveSrc(img) && !resolveSrc(img).startsWith('data:'));
    if (!image) {
      image = Array.from(imageScope.querySelectorAll('img'))
        .find((img) => resolveSrc(img) && !resolveSrc(img).startsWith('data:')) || null;
    }
    if (image) {
      const src = image.getAttribute('src');
      const lazy = image.getAttribute('data-src') || image.getAttribute('data-original');
      if ((!src || src.startsWith('data:')) && lazy) image.setAttribute('src', lazy);
    }

    // Title / heading.
    const title = slide.querySelector('h1, h2, h3');
    // Pull-quote (the testimonial text).
    const quote = slide.querySelector('.quote');
    // Attribution (person / company).
    const company = slide.querySelector('.company');
    // CTA links (Read the Case Study, Customer Video, etc.).
    const ctaLinks = Array.from(slide.querySelectorAll('.customer-links a, a[href]'))
      .filter((a) => {
        // Exclude links that live inside the attribution block.
        return !company || !company.contains(a);
      });
    // Deduplicate CTA links.
    const uniqueCtas = ctaLinks.filter((a, idx) => ctaLinks.indexOf(a) === idx);

    const contentCell = [];
    if (title) contentCell.push(title);
    if (quote) contentCell.push(quote);
    if (company) contentCell.push(company);
    contentCell.push(...uniqueCtas);

    // Skip empty slides.
    if (!image && contentCell.length === 0) return;

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-story', cells });

  // When the element is a container of multiple .banner slides (e.g.
  // div.customer-stories with #banner1..#bannerN), replace only the banner
  // slides with the block and keep sibling content (logo nav, CTA) as the
  // section's default content. Otherwise replace the single banner element.
  const banners = Array.from(element.querySelectorAll(':scope > .banner'));
  if (banners.length > 0) {
    banners[0].replaceWith(block);
    banners.slice(1).forEach((b) => b.remove());
  } else {
    element.replaceWith(block);
  }
}
