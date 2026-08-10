import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * fortinet.com's footer has a second, visually distinct section below the
 * main black footer (light gray, .footer-row.copyrights on the source):
 * a row of sponsorship badge images, a copyright line, an extended legal
 * links row, a tagline, and an "Also of Interest" links row. Authored here
 * as one row per part (in that order) rather than needing named markers —
 * each row is classified by what it actually contains (images vs. text
 * starting with "Copyright" vs. "Also of Interest" vs. a plain link row vs.
 * plain text), so the author doesn't need to remember a rigid row order.
 * @param {Element} block The footer-legal block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    // Rows may be authored as a single cell (row > div > content) or with
    // content directly in the row — flatten either into the row itself so
    // classification below doesn't need to care which.
    const cells = [...row.children];
    if (cells.length === 1 && cells[0].tagName === 'DIV') {
      const cell = cells[0];
      moveInstrumentation(cell, row);
      while (cell.firstElementChild) row.append(cell.firstElementChild);
      cell.remove();
    }

    const text = row.textContent.trim();
    const images = row.querySelectorAll('picture, img');
    const links = row.querySelectorAll('a');

    if (images.length && links.length) {
      row.classList.add('footer-legal-badges');
      // Each linked badge becomes its own list item, for flex/gap layout
      // and so screen readers announce a count ("list of 7 items") instead
      // of a wall of unrelated links.
      const ul = document.createElement('ul');
      row.querySelectorAll('p').forEach((p) => {
        const li = document.createElement('li');
        moveInstrumentation(p, li);
        while (p.firstChild) li.append(p.firstChild);
        ul.append(li);
        p.remove();
      });
      row.append(ul);
    } else if (/^Copyright/i.test(text)) {
      row.classList.add('footer-legal-copyright');
    } else if (/Also of Interest/i.test(text)) {
      row.classList.add('footer-legal-also-of-interest');
      // Split the leading label ("Also of Interest:") from the links after
      // it so each can be styled on its own — the label is bold/dimmer on
      // the source, not just plain running text.
      const firstNode = row.firstChild;
      if (firstNode?.nodeType === Node.TEXT_NODE) {
        const [label, ...rest] = firstNode.textContent.split(':');
        if (rest.length) {
          const labelSpan = document.createElement('span');
          labelSpan.className = 'footer-legal-also-of-interest-label';
          labelSpan.textContent = `${label}:`;
          firstNode.textContent = rest.join(':');
          row.prepend(labelSpan);
        }
      }
    } else if (links.length >= 2) {
      row.classList.add('footer-legal-links');
    } else {
      row.classList.add('footer-legal-tagline');
    }
  });
}
