/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fortinet section breaks and section metadata.
 *
 * Builds EDS section boundaries from the template's section definitions
 * (payload.template.sections). Selectors originate from the captured DOM /
 * page-templates.json for the Fortinet homepage template.
 *
 * Behaviour:
 *   - Inserts an <hr> before every section except the first (section breaks).
 *   - Inserts a "Section Metadata" block after any section that declares a
 *     `style` (e.g. rc10 -> "dark").
 *
 * Runs in beforeTransform against the pristine DOM. The Fortinet homepage
 * section selectors are keyed to AEM grid columns via :nth-of-type(), and in
 * several sections the block instance IS the grid column (e.g. carousel-hero /
 * div.C926-Billboard-Sliders). If this ran in afterTransform, block parsers
 * would already have replaced those grid columns and the cleanup transformer
 * would have removed the C991-CSS-JS columns, shifting :nth-of-type() indices
 * so the section selectors no longer match. Inserting boundaries in
 * beforeTransform (in reverse, so our own insertions don't shift earlier
 * selectors) keeps every section selector valid; the inserted <hr> (an hr, not
 * a div) and Section Metadata siblings survive later parsing and cleanup.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : null;
  if (!sections || sections.length < 2) return;

  const { document } = payload;

  // Process in reverse so DOM insertions do not shift earlier section selectors.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section || !section.selector) continue;

    let sectionEl;
    try {
      sectionEl = element.querySelector(section.selector);
    } catch (e) {
      sectionEl = null;
    }
    if (!sectionEl) continue;

    // Section Metadata block for sections that declare a style.
    if (section.style) {
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      sectionEl.after(metadataBlock);
    }

    // Section break before every section except the first.
    if (i > 0) {
      sectionEl.before(document.createElement('hr'));
    }
  }
}
