/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fortinet BLOG section breaks and section metadata.
 *
 * Builds EDS section boundaries from the active template's section definitions
 * (payload.template.sections). Works for BOTH blog templates:
 *   - blog-landing (3 sections: section.h1-featured, section.b3-blog-list, div.C18-Tabs)
 *   - blog-post    (4 sections: section.b4-hero, section.b15-blog-meta, article body, section.b12-related)
 * Selectors originate from page-templates.json / the captured blog DOMs.
 *
 * Behaviour (generic, driven entirely by payload.template.sections):
 *   - Inserts an <hr> before every section except the first (section breaks).
 *   - Inserts a "Section Metadata" block after any section that declares a
 *     `style`. Neither blog template currently declares a styled/dark section,
 *     so in practice this is a no-op today, but it is implemented generically
 *     from section.style so it keeps working if a styled section is added.
 *
 * Hook decision — runs in beforeTransform (mirrors fortinet-sections.js):
 * the blog section roots ARE the block instances (section.b4-hero -> hero,
 * section.b12-related -> cards, section.h1-featured -> cards-featured, etc.).
 * If this ran in afterTransform, the block parsers would already have replaced
 * those roots and the blog-cleanup transformer would have removed chrome,
 * shifting the DOM so the section selectors no longer resolve. Inserting the
 * boundaries in beforeTransform against the pristine DOM — and iterating in
 * reverse so our own <hr>/metadata insertions do not shift earlier section
 * selectors — keeps every selector valid. The inserted <hr> (an hr, not a div)
 * and Section Metadata siblings survive later parsing and cleanup, and because
 * boundaries are placed before the section root, the section's default content
 * is lifted into the correct EDS section before parsers run.
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

    // Section Metadata block for sections that declare a style (no-op today for blog).
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
