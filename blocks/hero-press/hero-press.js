/**
 * Press Release Hero (hero-press) block.
 *
 * A dark press-release hero banner. Unlike the vanilla `hero` block (which
 * overlays white text on a full-bleed background image), this variant renders
 * a solid dark banner with a category eyebrow link, an h1 title, a subtitle,
 * and a bold dateline. A feature image is optional.
 *
 * Authored structure (Hero convention): one column,
 *   Row (optional): a feature image (picture).
 *   Row (content):  a single cell holding — in any order — the eyebrow link,
 *                   the title heading, the subtitle paragraph, and the bold
 *                   dateline paragraph.
 *
 * decorate() finds the image row (if any) and classifies the child elements of
 * the content cell by their shape:
 *   - link-only paragraph      -> eyebrow (category link)
 *   - heading                  -> title
 *   - <strong>/date paragraph  -> dateline
 *   - other text paragraph     -> subtitle
 * Every field is optional and simply skipped when absent.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  let imageRow = null;
  let contentCell = null;

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    if (cell.querySelector('picture, img')) {
      imageRow = row;
    } else if (!contentCell) {
      contentCell = cell;
    }
  });

  if (imageRow) {
    imageRow.classList.add('hero-press-row', 'hero-press-image');
  }

  if (contentCell) {
    contentCell.classList.add('hero-press-content');
    [...contentCell.children].forEach((el) => {
      const link = el.querySelector('a');
      const text = el.textContent.trim();
      if (/^H[1-6]$/.test(el.tagName)) {
        el.classList.add('hero-press-title');
      } else if (link && link.textContent.trim() === text) {
        el.classList.add('hero-press-eyebrow');
      } else if (el.querySelector('strong') || /^[A-Z][a-z]{2}\s+\d{1,2},\s*\d{4}/.test(text)) {
        el.classList.add('hero-press-dateline');
      } else if (text) {
        el.classList.add('hero-press-subtitle');
      }
    });
  }

  if (!block.querySelector('.hero-press-image')) {
    block.classList.add('no-image');
  }
}
