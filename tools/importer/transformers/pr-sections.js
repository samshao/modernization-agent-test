/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fortinet press-release section breaks and section metadata.
 *
 * Builds EDS section boundaries from the template's section definitions
 * (payload.template.sections) for the press-release template. Three sections:
 *   1. Press Release Hero   (div.C941-Product-Hero-Banner) — no style; the
 *      hero-press block owns its own dark styling, so no section-metadata.
 *   2. Press Release Body   (div.C05-Container:nth-of-type(2)) — default content,
 *      no style.
 *   3. About Fortinet        (div.C05-Container:nth-of-type(3)) — style "light"
 *      so the company boilerplate renders on the grey band like the source.
 *
 * Behaviour:
 *   - Inserts an <hr> before every section except the first (section breaks).
 *   - Inserts a "Section Metadata" block after any section that declares a
 *     `style` (only the About band here).
 *
 * Runs in beforeTransform against the pristine DOM — at that point all three
 * section selectors (the hero div.C941-Product-Hero-Banner and the two
 * div.C05-Container:nth-of-type(2|3) bands) still exist and match, so
 * boundaries and section-metadata land correctly. The hero-press parser later
 * replaces the hero with its block table, but the inserted <hr> and Section
 * Metadata siblings survive parsing and cleanup. Processing in reverse so our
 * own DOM insertions do not shift earlier section selectors. (Same rationale as
 * fortinet-sections.js.)
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

    // Section Metadata block for sections that declare a style (About band).
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
