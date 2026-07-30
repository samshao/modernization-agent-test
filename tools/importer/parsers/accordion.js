/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: accordion. Base block: accordion.
 * Source: https://www.zendesk.com (#footer_faq)
 * Generated: 2026-07-30
 *
 * Block library structure: 2 columns; first row = block name; each subsequent
 * row = one item (cell 1 title/question, cell 2 answer content).
 *
 * Instance note: 6 FAQ Q&A pairs. Each accordion section has a header button
 * carrying the question (h5) and a panel carrying the answer paragraph(s),
 * which may include inline links that must be preserved.
 */

// Clone answer content, dropping decorative base64 icons but keeping links.
function cleanContent(panel, document) {
  const out = [];
  const paras = panel.querySelectorAll('[class*="Textstyle__TextRoot"] > p, p');
  const seen = new Set();
  paras.forEach((p) => {
    const t = p.textContent.replace(/\s+/g, ' ').trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    const clone = p.cloneNode(true);
    clone.querySelectorAll('img[src^="data:"], img:not([src])').forEach((i) => i.remove());
    // Flatten styled-component link wrappers to plain <a href>text</a>.
    clone.querySelectorAll('a[href]').forEach((a) => {
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
      a.replaceWith(link);
    });
    out.push(clone);
  });
  return out;
}

export default function parse(element, { document }) {
  const cells = [];
  const seenQ = new Set();

  const sections = element.querySelectorAll('[class*="Accordionstyle__AccordionSection"]');
  sections.forEach((section) => {
    const titleEl = section.querySelector(
      '[class*="AccordionLabel"] h5, [class*="AccordionLabel"] h3, [class*="AccordionLabel"] h4, [class*="AccordionLabel"], h5, h3, h4',
    );
    const question = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (!question || seenQ.has(question)) return;
    seenQ.add(question);

    const titleCell = document.createElement('h3');
    titleCell.textContent = question;

    const panel = section.querySelector('[class*="AccordionPanel"], [class*="InnerPanel"]') || section;
    const answer = cleanContent(panel, document);

    cells.push([[titleCell], answer.length ? answer : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
