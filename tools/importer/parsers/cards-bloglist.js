/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-bloglist. Base: cards (no images variant).
 * Source: https://www.fortinet.com/blog (section.b3-blog-list)
 * Generated for Fortinet blog-landing migration.
 *
 * Structure (from library-description.txt, "Cards (no images)"): 1 column,
 * one row per card. The single cell holds text content:
 *   category (heading) + title (linked) + byline ("By {author} {date}").
 *
 * The "Latest Blogs" H2 is section default content and is lifted out of the
 * block (inserted before the block) so it survives as default content.
 * Source: each post is a `div.blog-card` wrapping an `a.card-link`.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.blog-card'));

  const cells = [];

  cards.forEach((card) => {
    const link = card.querySelector('a.card-link, a[href]');
    const href = link ? link.getAttribute('href') : null;

    const contentCell = [];

    // Category (H3 in source) — keep as a heading.
    const catEl = card.querySelector('.blog-title, h3');
    if (catEl && catEl.textContent.trim()) {
      const cat = document.createElement('h3');
      cat.textContent = catEl.textContent.trim();
      contentCell.push(cat);
    }

    // Title (linked). Source title lives in p.blog-desc.
    const titleEl = card.querySelector('.blog-desc');
    if (titleEl && titleEl.textContent.trim()) {
      const title = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleEl.textContent.trim();
        title.append(a);
      } else {
        title.textContent = titleEl.textContent.trim();
      }
      contentCell.push(title);
    }

    // Byline: "By {author} {date}".
    const bylineEl = card.querySelector('.blog-author');
    if (bylineEl && bylineEl.textContent.trim()) {
      const byline = document.createElement('p');
      byline.textContent = bylineEl.textContent.replace(/\s+/g, ' ').trim();
      contentCell.push(byline);
    }

    if (contentCell.length === 0) return;

    // 1-column block: one row whose single cell holds all elements.
    cells.push([contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-bloglist', cells });

  // Lift the "Latest Blogs" heading out as section default content.
  const sectionHeading = element.querySelector('h2.section-title, h2');
  if (sectionHeading && sectionHeading.textContent.trim()) {
    const heading = document.createElement('h2');
    heading.textContent = sectionHeading.textContent.trim();
    element.replaceWith(heading, block);
  } else {
    element.replaceWith(block);
  }
}
