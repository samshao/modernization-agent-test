/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-blog. Base: tabs.
 * Source: https://www.fortinet.com/blog (div.C18-Tabs)
 * Generated for Fortinet blog-landing migration.
 *
 * Structure (from library-description.txt): Tabs, 2 columns, one row per tab.
 *   Col 1: tab label. Col 2: tab panel content.
 *
 * Source: `.tab-selector` buttons give the tab labels (Products and Solutions,
 * Threat Research, Thought Leadership, Corporate). `.id-tab-container` elements
 * are the matching panels, each holding category groups (`section.b3-blog-list`)
 * with a subheading, post cards (image + title + date + link) and a "See All"
 * CTA link.
 *
 * The "Blog topics" H2 is section default content, sitting outside this element
 * (in the preceding cmp-text), so it is not part of this block.
 */
export default function parse(element, { document }) {
  // Tab labels.
  const labels = Array.from(element.querySelectorAll('.tab-selector'))
    .map((b) => b.textContent.trim())
    .filter((t) => t);

  // Tab panels.
  const panels = Array.from(element.querySelectorAll('.id-tab-container'));

  const cells = [];

  panels.forEach((panel, i) => {
    // Label cell — fall back to a generic label if counts mismatch.
    const labelText = labels[i] || `Tab ${i + 1}`;
    const label = document.createElement('p');
    label.textContent = labelText;

    // Panel content cell: rebuild each category group cleanly.
    const panelCell = [];
    const groups = Array.from(panel.querySelectorAll('section.b3-blog-list'));

    groups.forEach((group) => {
      // Category subheading.
      const titleEl = group.querySelector('.section-title');
      if (titleEl && titleEl.textContent.trim()) {
        const h = document.createElement('h3');
        h.textContent = titleEl.textContent.trim();
        panelCell.push(h);
      }

      // Post cards + "See All" CTA are both anchors (.card-link).
      const links = Array.from(group.querySelectorAll('a.card-link, a[href]'));
      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Post card: image + title + date. CTA card: just a label.
        const isCta = !!link.querySelector('.cta-card');

        if (isCta) {
          const p = document.createElement('p');
          const a = document.createElement('a');
          a.href = href;
          a.textContent = link.textContent.replace(/\s+/g, ' ').trim();
          p.append(a);
          panelCell.push(p);
          return;
        }

        // Image — promote lazy attrs, skip base64 placeholders.
        const img = link.querySelector('img');
        if (img) {
          const lazy = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src');
          const src = img.getAttribute('src');
          if ((!src || src.startsWith('data:')) && lazy) img.setAttribute('src', lazy);
          const finalSrc = img.getAttribute('src');
          if (finalSrc && !finalSrc.startsWith('data:')) panelCell.push(img);
        }

        // Title (linked).
        const titleCard = link.querySelector('.card-title');
        const dateEl = link.querySelector('.card-content span, span');
        if (titleCard && titleCard.textContent.trim()) {
          const p = document.createElement('p');
          const a = document.createElement('a');
          a.href = href;
          a.textContent = titleCard.textContent.trim();
          p.append(a);
          panelCell.push(p);
        }

        // Date.
        if (dateEl && dateEl.textContent.trim()) {
          const d = document.createElement('p');
          d.textContent = dateEl.textContent.trim();
          panelCell.push(d);
        }
      });
    });

    if (panelCell.length === 0) return;

    cells.push([label, panelCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-blog', cells });
  element.replaceWith(block);
}
