/**
 * Blog Meta (byline) block.
 * Renders a blog post byline: "By {author}" (author linked) and the publication date.
 *
 * Expected authored structure (rows):
 *   Row 1: author name (typically a link to the author page)
 *   Row 2: publication date (plain text)
 *
 * Both rows are optional; the block degrades gracefully if either is omitted.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const authorCell = rows[0]?.querySelector(':scope > div') || rows[0];
  const dateCell = rows[1]?.querySelector(':scope > div') || rows[1];

  const container = document.createElement('div');
  container.className = 'blog-meta-container';

  const authorText = authorCell ? authorCell.textContent.trim() : '';
  if (authorText) {
    const prefix = document.createElement('span');
    prefix.className = 'blog-meta-prefix';
    prefix.textContent = 'By ';
    container.append(prefix);

    const author = document.createElement('span');
    author.className = 'blog-meta-author';
    // Preserve an author link if present, otherwise use plain text.
    const link = authorCell.querySelector('a');
    if (link) author.append(link);
    else author.textContent = authorText;
    container.append(author);
  }

  const dateText = dateCell ? dateCell.textContent.trim() : '';
  if (dateText) {
    const date = document.createElement('span');
    date.className = 'blog-meta-date';
    date.textContent = dateText;
    container.append(date);
  }

  block.replaceChildren(container);
}
