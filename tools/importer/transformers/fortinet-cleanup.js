/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fortinet site-wide cleanup.
 * Removes non-authorable global chrome and injected widgets so the import
 * contains only page-level authorable content.
 *
 * All selectors below were verified against migration-work/cleaned.html:
 *   - <header class="ftnt-navigation">  (contains <nav id="top-nav"> and <nav id="main-nav">)
 *   - <aside class="dg-consent-banner visible dg-bottom">  (cookie/consent banner)
 *   - <div id="embedded-messaging">  (embedded chat widget)
 *   - <footer class="footer" id="footer">  (contains <nav class="footer-nav ...">)
 *   - <div class="be-ix-link-block">  (BrightEdge related-links SEO block, non-authorable)
 *   - <div class="C991-CSS-JS ...">  (empty AEM clientlib CSS/JS injection points, sections rc3 & rc7)
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets that could interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      'aside.dg-consent-banner', // consent/cookie banner
      '#embedded-messaging', // embedded chat widget
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome and injected regions.
    WebImporter.DOMUtils.remove(element, [
      'header.ftnt-navigation', // site header (wraps #top-nav and #main-nav)
      '#top-nav', // utility navigation
      '#main-nav', // primary navigation
      'footer#footer', // site footer (wraps nav.footer-nav)
      'nav.footer-nav', // footer navigation
      '.be-ix-link-block', // BrightEdge related-links SEO block
      'div.C991-CSS-JS', // empty AEM clientlib CSS/JS injection points (rc3, rc7)
    ]);
  }
}
