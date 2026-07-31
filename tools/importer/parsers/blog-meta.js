/* eslint-disable */
/* global WebImporter */
/**
 * Parser for blog-meta. Base: blog-meta (custom project block).
 * Source: blog-post pages (section.b15-blog-meta)
 * Generated for Fortinet blog-post migration.
 *
 * Structure (from blocks/blog-meta/blog-meta.js decorate): 1 column, 2 rows.
 *   Row 1: author name (typically an author-page link).
 *   Row 2: publication date (plain text).
 * The decorator adds the "By " prefix itself, so the author cell holds just the
 * author link/name and the date cell holds just the date (no "|" separator).
 *
 * Source: `.b15-blog-meta__author` wraps an author link; `.b15-blog-meta__date`
 * holds " | July 14, 2026".
 */
export default function parse(element, { document }) {
  const cells = [];

  // Author (row 1) — preserve the author-page link.
  const authorEl = element.querySelector('.b15-blog-meta__author');
  const authorLink = authorEl ? authorEl.querySelector('a[href]') : null;
  if (authorLink) {
    const a = document.createElement('a');
    a.href = authorLink.getAttribute('href');
    a.textContent = authorLink.textContent.trim();
    cells.push([a]);
  } else if (authorEl && authorEl.textContent.trim()) {
    const span = document.createElement('span');
    span.textContent = authorEl.textContent.trim();
    cells.push([span]);
  }

  // Date (row 2) — strip a leading separator (e.g. "| July 14, 2026").
  const dateEl = element.querySelector('.b15-blog-meta__date');
  if (dateEl && dateEl.textContent.trim()) {
    const date = document.createElement('span');
    date.textContent = dateEl.textContent.replace(/^[\s|]+/, '').trim();
    cells.push([date]);
  }

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'blog-meta', cells });
  element.replaceWith(block);
}
