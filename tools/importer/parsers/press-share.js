/* eslint-disable */
/* global WebImporter */
/**
 * Parser for press-share — the press-release "control bar".
 * Source: https://www.fortinet.com/corporate/about-us/newsroom/press-releases/...
 *         (left sidebar of div.C05-Container:nth-of-type(2))
 *
 * Emits a press-share block (1 column):
 *   Row 1: contact action link ("Contact Fortinet PR »", mailto:pr@fortinet.com)
 *   Row 2: social share icons as EDS icon tokens (:linkedin: :twitter: ...),
 *          each wrapped in its outbound link. decorateIcons() renders the
 *          tokens as <img src="/icons/{name}.svg"> at runtime.
 *
 * Source anatomy:
 *   - contact:  a.press-contact                (mailto link)
 *   - socials:  .press-socials ul li a > img   (alt = network, data-src = icon)
 *
 * Maps source icon alt/filename to a local icon name in /icons/.
 */
const ICON_MAP = {
  linkedin: 'linkedin',
  twitter: 'twitter',
  x: 'twitter',
  youtube: 'youtube',
  instagram: 'instagram',
  facebook: 'facebook',
  rss: 'rss',
};

function iconNameFor(img) {
  const dataSrc = img.getAttribute('data-src') || img.getAttribute('src') || '';
  const fileMatch = dataSrc.match(/icon-([a-z]+)\.svg/i);
  if (fileMatch && ICON_MAP[fileMatch[1].toLowerCase()]) return ICON_MAP[fileMatch[1].toLowerCase()];
  const alt = (img.getAttribute('alt') || '').trim().toLowerCase();
  return ICON_MAP[alt] || null;
}

export default function parse(element, { document }) {
  const cells = [];

  // The block instance may be the whole PR-overview container (which also holds
  // "In Short" / "Mentions" kept as default content). Narrow to the control-bar
  // wrapper: the element that holds the contact link + social list.
  const contactAnchor = element.querySelector('a.press-contact, a[href^="mailto:pr@"]');
  if (!contactAnchor) {
    return; // nothing to do; leave surrounding default content intact
  }
  const socialsEl = element.querySelector('.press-socials');
  const bar = socialsEl && socialsEl.parentElement && socialsEl.parentElement.contains(contactAnchor)
    ? socialsEl.parentElement
    : (contactAnchor.closest('div') || element);

  // Row 1 — "Contact Fortinet PR" action link.
  const contact = bar.querySelector('a.press-contact, a[href^="mailto:pr@"]');
  if (contact && contact.textContent.trim()) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = contact.getAttribute('href');
    a.textContent = contact.textContent.trim();
    p.append(a);
    cells.push([p]);
  }

  // Row 2 — social share icons (as icon tokens inside their links).
  const socials = bar.querySelector('.press-socials') || bar;
  const iconLinks = [...socials.querySelectorAll('a')].filter((a) => a.querySelector('img'));
  if (iconLinks.length) {
    const ul = document.createElement('ul');
    iconLinks.forEach((a) => {
      const img = a.querySelector('img');
      const name = iconNameFor(img);
      if (!name) return;
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      // EDS icon token — decorateIcons() converts to <img src="/icons/{name}.svg">
      link.textContent = `:${name}:`;
      li.append(link);
      ul.append(li);
    });
    if (ul.children.length) cells.push([ul]);
  }

  // Empty-block guard.
  if (cells.length === 0) {
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'press-share', cells });
  // Replace only the control-bar wrapper, leaving In Short / Mentions intact.
  bar.replaceWith(block);
}
