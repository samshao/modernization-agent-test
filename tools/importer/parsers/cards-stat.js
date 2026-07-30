/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-stat. Base: cards (no images variant).
 * Source: https://www.fortinet.com/ (FortiGuard Labs global stats grid)
 * Generated for Fortinet homepage migration.
 *
 * Structure (from library-description.txt "Cards (no images)"): 1 column,
 * one row per card. The single cell holds: heading (the large value/unit) +
 * description (the stat label). No images.
 */
export default function parse(element, { document }) {
  // Each stat card is a `.stat-info` (fall back to the stat columns).
  let stats = Array.from(element.querySelectorAll('.stat-info'));
  if (stats.length === 0) {
    stats = Array.from(element.querySelectorAll('[class*="col"]')).filter((c) => c.querySelector('.stat-num'));
  }

  const cells = [];

  // The live site injects the leading digits via a JS count-up animation, so the
  // static markup only carries the unit (K/M/B/T). The real figures are therefore
  // not present in the page source. These authoritative FortiGuard "Global Threat
  // Protection Delivered Daily" values were supplied by the site owner and are keyed
  // by their (normalized) stat label so the correct figure lands on each card.
  const VALUE_BY_LABEL = {
    'cloud events processed': '100T',
    'exploit attempts detected': '60B',
    'malware executions blocked': '1.8B',
    'new unique objects analyzed': '130B',
    'new unique attack objects identified': '4.2M',
    'attacks prevented inline': '34B',
  };

  stats.forEach((stat) => {
    // Label: the text of the card, excluding the value element.
    const clone = stat.cloneNode(true);
    const cloneNum = clone.querySelector('.stat-num');
    if (cloneNum) cloneNum.remove();
    const labelText = clone.textContent.replace(/\s+/g, ' ').trim();

    const numEl = stat.querySelector('.stat-num');
    // Value/unit as present in source, e.g. "1T" (usually just the bare unit).
    let valueText = numEl ? numEl.textContent.replace(/\s+/g, ' ').trim() : '';
    // Prefer the authoritative value matched by label; fall back to source text.
    const authoritative = VALUE_BY_LABEL[labelText.toLowerCase()];
    if (authoritative) valueText = authoritative;

    const contentCell = [];
    if (valueText) {
      const heading = document.createElement('h3');
      heading.textContent = valueText;
      contentCell.push(heading);
    }
    if (labelText) {
      const desc = document.createElement('p');
      desc.textContent = labelText;
      contentCell.push(desc);
    }

    // Skip empty stat cells.
    if (contentCell.length === 0) return;

    // 1-column block: one row, one cell holding all elements.
    cells.push([contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stat', cells });
  element.replaceWith(block);
}
