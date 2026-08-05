import { decorateIcons } from '../../scripts/aem.js';

/**
 * Press Share (press-share) block — the press-release "control bar".
 *
 * Renders the Fortinet newsroom control bar that sits in the press-release
 * sidebar: a bold "Contact Fortinet PR »" action link followed by a row of
 * social share icons (LinkedIn, X, YouTube, Instagram, Facebook, RSS).
 *
 * Authored structure (one column):
 *   Row 1 (optional): the contact link — a single paragraph with one link.
 *   Row 2 (icons):    a list (or paragraph) of links, each containing an icon
 *                     token (e.g. `:linkedin:`) that decorateIcons() turns into
 *                     an <img> from /icons/.
 *
 * decorate() classifies each row: a row whose links carry icons becomes the
 * social row; the first non-icon link row becomes the contact action.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Convert any :name: icon tokens (e.g. from the importer) into icon spans so
  // decorateIcons() can render them, regardless of server-side token handling.
  block.querySelectorAll('a').forEach((a) => {
    const match = a.textContent.trim().match(/^:([a-z0-9-]+):$/i);
    if (match) {
      const name = match[1].toLowerCase();
      a.textContent = '';
      const span = document.createElement('span');
      span.className = `icon icon-${name}`;
      a.setAttribute('aria-label', name);
      a.append(span);
    }
  });

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const hasIcon = cell.querySelector('.icon, img');
    if (hasIcon) {
      cell.classList.add('press-share-socials');
      // Normalize to a flat list of icon links.
      const links = [...cell.querySelectorAll('a')];
      if (links.length) {
        const ul = document.createElement('ul');
        links.forEach((a) => {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
          const li = document.createElement('li');
          li.append(a);
          ul.append(li);
        });
        cell.textContent = '';
        cell.append(ul);
      }
    } else {
      cell.classList.add('press-share-contact');
      const link = cell.querySelector('a');
      if (link) link.classList.add('press-share-contact-link');
    }
  });

  decorateIcons(block);
}
