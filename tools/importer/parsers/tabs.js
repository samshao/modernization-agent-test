/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: tabs. Base block: tabs.
 * Source: https://www.zendesk.com (#ai_first_customer_service)
 * Generated: 2026-07-30
 *
 * Block library structure: 2 columns; first row = block name; each subsequent
 * row = one tab (cell 1 label, cell 2 content: image + description).
 *
 * Instance note: the source renders the tab set twice (a desktop tab list +
 * panels, and a mobile accordion). The accordion sections give clean, paired
 * label/content, so we extract from those and de-duplicate by label.
 */

function pickImage(img, document) {
  if (!img) return null;
  let src = img.getAttribute('src') || '';
  const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
  if ((!src || src.startsWith('data:')) && lazy) src = lazy;
  if (!src || src.startsWith('data:')) {
    const ss = img.getAttribute('data-srcset') || img.getAttribute('srcset') || '';
    if (ss) src = ss.split(',')[0].trim().split(/\s+/)[0];
  }
  if (!src || src.startsWith('data:')) return null;
  const out = document.createElement('img');
  out.setAttribute('src', src);
  const alt = img.getAttribute('alt');
  if (alt) out.setAttribute('alt', alt);
  return out;
}

function contentImage(scope, document) {
  if (!scope) return null;
  for (const img of scope.querySelectorAll('img')) {
    const alt = (img.getAttribute('alt') || '').trim();
    const src = img.getAttribute('src') || '';
    if (!alt && src.startsWith('data:image/svg+xml')) continue; // decorative spacer
    const picked = pickImage(img, document);
    if (picked) return picked;
  }
  return null;
}

export default function parse(element, { document }) {
  const cells = [];
  const seenLabels = new Set();

  // Preferred source: accordion sections (each has a header label + a panel).
  let sections = element.querySelectorAll('[class*="Accordionstyle__AccordionSection"]');

  if (sections.length) {
    sections.forEach((section) => {
      const labelEl = section.querySelector(
        '[class*="AccordionLabel"] h3, [class*="AccordionLabel"] h4, [class*="AccordionLabel"], h3, h4',
      );
      const label = labelEl ? labelEl.textContent.replace(/\s+/g, ' ').trim() : '';
      if (!label || seenLabels.has(label)) return;
      seenLabels.add(label);

      const panel = section.querySelector('[class*="AccordionPanel"], [class*="InnerPanel"]') || section;
      const contentCell = [];
      const img = contentImage(panel, document);
      if (img) contentCell.push(img);
      panel.querySelectorAll('[class*="Textstyle__TextRoot"] > p').forEach((p) => {
        if (p.textContent.trim()) contentCell.push(p);
      });

      cells.push([label, contentCell.length ? contentCell : '']);
    });
  }

  // Fallback: explicit tab list (<li>) + panels keyed by index.
  if (cells.length === 0) {
    const tabLabels = element.querySelectorAll('ul li[id*="tab-"], ul li');
    tabLabels.forEach((li, i) => {
      const label = li.textContent.replace(/\s+/g, ' ').trim();
      if (!label || seenLabels.has(label)) return;
      seenLabels.add(label);
      const panel = element.querySelector(`[id*="panel-${i}"]`);
      const contentCell = [];
      if (panel) {
        const img = contentImage(panel, document);
        if (img) contentCell.push(img);
        panel.querySelectorAll('[class*="Textstyle__TextRoot"] > p').forEach((p) => {
          if (p.textContent.trim()) contentCell.push(p);
        });
      }
      cells.push([label, contentCell.length ? contentCell : '']);
    });
  }

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
