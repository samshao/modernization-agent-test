/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fortinet press-release cleanup.
 * Removes non-authorable global chrome, injected widgets, and marketing/PR
 * chrome so the import contains only page-level press-release content.
 *
 * Selectors verified against migration-work/cleaned.html for the press-release
 * page. Keeps: the hero (div.C941-Product-Hero-Banner), the two-column body
 * (div.C05-Container:nth-of-type(2)) article + the kept sidebar bits (In Short,
 * Mentions In This Article), and the About Fortinet band
 * (div.C05-Container:nth-of-type(3)).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets that could interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      'aside.dg-consent-banner', // consent/cookie banner
      '.dg-consent-banner',
      '#embedded-messaging', // embedded chat widget
      'div.liveChat', // live chat widget
    ]);

    // Strip inline <style>/<script> inside the hero banner (huge blocks of CSS
    // and a resize script that are not content).
    const hero = element.querySelector('div.C941-Product-Hero-Banner');
    if (hero) {
      hero.querySelectorAll('style, script').forEach((n) => n.remove());
    }

    // Drop the PR-contact + social icon chrome inside the left sidebar
    // (auxiliary marketing, not page content). The sidebar's "In Short" and
    // "Mentions In This Article" are kept.
    const body = element.querySelector('div.C05-Container:nth-of-type(2)');
    if (body) {
      body.querySelectorAll('div.C871-Social-Media, div.C871-Social, ul.social, .social-icons, .press-social').forEach((n) => n.remove());
      // "Contact Fortinet PR" mailto block + any social <ul> of icon links.
      body.querySelectorAll('a[href^="mailto:pr@"]').forEach((a) => {
        const container = a.closest('div.C32-Text, li, div') || a;
        container.remove();
      });
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome and injected regions.
    WebImporter.DOMUtils.remove(element, [
      'header.ftnt-navigation', // site header (wraps #top-nav and #main-nav)
      '#top-nav', // utility navigation
      '#main-nav', // primary navigation
      'footer#footer', // site footer
      'nav.footer-nav', // footer navigation
      '.be-ix-link-block', // BrightEdge related-links SEO block ("Also of Interest")
      'div.C48-Form-HTML-Snippet', // marketing form snippet
      'div.C991-CSS-JS', // empty AEM clientlib CSS/JS injection points
    ]);
  }
}
