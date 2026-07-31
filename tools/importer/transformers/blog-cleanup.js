/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fortinet BLOG cleanup (blog-landing + blog-post templates).
 *
 * Removes the non-authorable global chrome and injected widgets shared by both
 * blog page shells so the import contains only page-level authorable content.
 * This is a SEPARATE file from fortinet-cleanup.js (homepage): the blog pages
 * use a different shell (b1-header / b6-footer BEM markup) than the corporate
 * homepage (ftnt-navigation / footer#footer).
 *
 * All selectors below were verified against migration-work/cleaned.blog-landing.html
 * and migration-work/cleaned.blog-post.html:
 *   - <div class="b1-header ..."> -> <header class="b1-header__container"> (site header + nav)
 *   - <div class="social-links ..."> (social bar, landing only; no-op on post)
 *   - <div class="b6-footer ..."> (site footer + footer nav)
 *   - <div class="be-ix-link-block"> (BrightEdge related-links SEO link spam; x2 per page)
 *   - <aside class="dg-consent-banner visible dg-bottom"> (consent/cookie preferences banner)
 *   - <div id="sf-chat-text-bubble" class="chat-text-bubble">Need help? Chat with us!</div> (chat launcher)
 *   - <iframe class="embeddedMessagingSiteContextFrame" ...> (chat site-context frame)
 *   - <div id="embedded-messaging" class="embedded-messaging"> (embedded chat widget)
 *   - <div class="b13-comment-section ..."> (post comment section, post only; no-op on landing)
 *
 * Note: no OneTrust/Cookiebot dialog is present on these pages; the consent
 * surface is the site's own `aside.dg-consent-banner`. Scripts/styles/noscript/
 * stylesheet links were already stripped by the scraper, but they are removed
 * again here defensively so the transformer is safe on un-pre-cleaned DOM.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets that could interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      'aside.dg-consent-banner', // consent / cookie preferences banner
      '#sf-chat-text-bubble', // "Need help? Chat with us!" launcher bubble
      'iframe.embeddedMessagingSiteContextFrame', // chat site-context iframe
      '#embedded-messaging', // embedded chat widget
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome and injected regions common to both blog shells.
    WebImporter.DOMUtils.remove(element, [
      'div.b1-header', // site header (wraps header.b1-header__container + nav)
      'div.social-links', // social links bar (landing only)
      'div.b6-footer', // site footer (wraps footer nav + copyright)
      'div.be-ix-link-block', // BrightEdge related-links SEO block(s)
      'div.b13-comment-section', // post comment section (post only)
      // Defensive: strip anything non-authorable the scraper may have left behind.
      'script',
      'style',
      'noscript',
      'link[rel="stylesheet"]',
      'iframe',
    ]);
  }
}
