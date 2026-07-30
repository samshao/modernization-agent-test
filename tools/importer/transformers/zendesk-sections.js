/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Zendesk section breaks + section metadata + default-content lift.
 *
 * Runs in beforeTransform against the PRISTINE (post-cleanup) DOM — before the
 * block parsers run element.replaceWith(block) on the section roots. This is
 * required because most section roots (#logos, #hero, #resolution_learning_loop,
 * ...) ARE the block instances; if we waited until afterTransform the parsers
 * would already have replaced them (and destroyed their default-content
 * headings), so section selectors would no longer resolve.
 *
 * For each section it:
 *   1. Lifts default-content nodes (headings/intro paragraphs listed in the
 *      template's section.defaultContent) OUT of the section root to sit just
 *      before it, so they survive as section default content instead of being
 *      swallowed when the parser replaces the section root with a block table.
 *   2. Inserts a <hr> section break before every section except the first.
 *   3. Appends a "Section Metadata" block as a following sibling for styled
 *      sections (style="dark": ai_first_customer_service, footer_cta, footer_faq)
 *      so it lands at the end of the section, after the block.
 *
 * All of hr / lifted headings / section-metadata are placed as SIBLINGS of the
 * section root (or moved before it), so the parser's later root.replaceWith(block)
 * leaves them intact. Resulting per-section order: <hr>, <heading>, <block>, <meta>.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : [];
  if (sections.length < 2) return;

  const { document } = payload;

  // Process sections in reverse so DOM insertions don't shift the positions
  // of sections we have yet to handle. All inserts are local to each root.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section || !section.selector) continue;

    // Resolve the section root within the current (post-cleanup, pre-parse) DOM.
    const root = element.querySelector(section.selector);
    if (!root) continue;

    // 1) Section break before every section except the first. Insert first so
    //    subsequent lifted headings land between the <hr> and the root.
    if (i > 0) {
      const hr = document.createElement('hr');
      root.before(hr);
    }

    // 2) Lift default-content nodes out of the section root, preserving order.
    const dcSelectors = Array.isArray(section.defaultContent) ? section.defaultContent : [];
    dcSelectors.forEach((sel) => {
      let node = null;
      try {
        node = element.querySelector(sel);
      } catch (e) {
        node = null;
      }
      // Only lift nodes that actually live inside this section root.
      if (node && root.contains(node)) {
        root.before(node);
      }
    });

    // 3) Section Metadata block for styled sections, as a following sibling so
    //    it survives the parser's root.replaceWith(block) and sits after it.
    if (section.style) {
      const metaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      root.after(metaBlock);
    }
  }
}
