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
      'div.liveChat', // live chat widget (wraps "Need help? Chat with us!")
      '.U06-Chat', // live chat variant class
      '.modal--support-window', // support chat modal
      '#sf-chat-text-bubble', // "Need help? Chat with us!" chat bubble
      '.chat-text-bubble', // chat bubble variant class
      '.threats-button', // floating "Request a quote" rail button
      '.sidebar-info', // floating rail wrapper
    ]);

    // Floating action rail: "Request a quote / Contact Us / Free Demo" links
    // (relative hrefs). Remove each link's small floating wrapper. The real
    // About-footer links use absolute http://www.fortinet.com/... hrefs and are
    // untouched.
    ['/corporate/about-us/request-a-quote', '/corporate/about-us/contact-us', '/demo-center'].forEach((href) => {
      element.querySelectorAll(`a[href="${href}"]`).forEach((a) => {
        const wrap = a.closest('.liveChat, .U06-Chat, .modal--support-window, .sidebar-info');
        if (wrap) wrap.remove();
        else a.remove();
      });
    });

    // Strip inline <style>/<script> inside the hero banner (huge blocks of CSS
    // and a resize script that are not content).
    const hero = element.querySelector('div.C941-Product-Hero-Banner');
    if (hero) {
      hero.querySelectorAll('style, script').forEach((n) => n.remove());
    }

    // NOTE: the left-sidebar "Contact Fortinet PR" + social share icons (the
    // press-release control bar) are intentionally KEPT. They are migrated by
    // the press-share block/parser rather than stripped as chrome.
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

    // Stray live-chat prompt text ("Need help? Chat with us!") that survives as
    // a bare paragraph after the live-chat wrapper is removed.
    element.querySelectorAll('p').forEach((p) => {
      if (/^\s*Need help\?\s*Chat with us!?\s*$/i.test(p.textContent)) p.remove();
    });
  }
}
