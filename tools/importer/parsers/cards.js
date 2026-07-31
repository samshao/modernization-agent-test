/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards.
 * Source: blog-post pages (section.b12-related — "Related Posts")
 * Generated for Fortinet blog-post migration.
 *
 * Structure (from library-description.txt): Cards, 2 columns, one row per card.
 *   Col 1: image. Col 2: text — category label + title (heading, linked).
 *
 * Source: each related post is an `a.b12-related__post` with a `.b12-related__image`
 * (a real ./images/*.png plus a base64 ratio placeholder) and `.b12-related__text`
 * (category `p.b12-related__category` + title `h5.b12-related__title`).
 * The "Related Posts" H3 is section default content, lifted out before the block.
 */
export default function parse(element, { document }) {
  const posts = Array.from(element.querySelectorAll('a.b12-related__post'));

  const cells = [];

  posts.forEach((post) => {
    const href = post.getAttribute('href');

    // Image. The real URL lives on `.b12-related__image` as a CSS
    // background-image; the inner <img> is a base64 placeholder. Fall back to a
    // real (non-base64) img src / lazy attr if no background is present.
    let image = null;
    const imgWrap = post.querySelector('.b12-related__image');
    const bgStyle = imgWrap ? (imgWrap.getAttribute('style') || '') : '';
    const bgMatch = bgStyle.match(/background-image\s*:\s*url\((['"]?)([^'")]+)\1\)/i);
    if (bgMatch && bgMatch[2] && !bgMatch[2].startsWith('data:')) {
      image = document.createElement('img');
      image.src = bgMatch[2].trim();
      const placeholder = post.querySelector('img');
      if (placeholder && placeholder.getAttribute('alt')) image.alt = placeholder.getAttribute('alt');
    }
    if (!image) {
      const imgs = Array.from(post.querySelectorAll('img'));
      imgs.forEach((img) => {
        if (image) return;
        const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
        const src = img.getAttribute('src');
        if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
        const finalSrc = img.getAttribute('src');
        if (finalSrc && !finalSrc.startsWith('data:')) image = img;
      });
    }

    const contentCell = [];

    // Category label.
    const catEl = post.querySelector('.b12-related__category');
    if (catEl && catEl.textContent.trim()) {
      const cat = document.createElement('p');
      cat.textContent = catEl.textContent.trim();
      contentCell.push(cat);
    }

    // Title (H5 in source) — keep as a heading, linked.
    const titleEl = post.querySelector('.b12-related__title');
    if (titleEl && titleEl.textContent.trim()) {
      const heading = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleEl.textContent.trim();
        heading.append(a);
      } else {
        heading.textContent = titleEl.textContent.trim();
      }
      contentCell.push(heading);
    }

    // Skip empty posts.
    if (!image && contentCell.length === 0) return;

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });

  // Lift the "Related Posts" heading out as section default content.
  const sectionHeading = element.querySelector('h3');
  if (sectionHeading && sectionHeading.textContent.trim()) {
    const heading = document.createElement('h3');
    heading.textContent = sectionHeading.textContent.trim();
    element.replaceWith(heading, block);
  } else {
    element.replaceWith(block);
  }
}
