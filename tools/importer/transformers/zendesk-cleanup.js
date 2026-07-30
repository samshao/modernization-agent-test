/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Zendesk site-wide cleanup.
 *
 * Removes non-authorable site chrome (header/nav, promo eyebrow, footer,
 * cookie consent, chat widget, iframes, scripts/styles, skip links) so the
 * imported document contains only page-level authorable content.
 *
 * ALL selectors below were verified against migration-work/cleaned.html
 * (scraped Zendesk homepage DOM). Source line references are noted inline.
 *
 * IMPORTANT: This transformer must NOT touch content-section images/anchors.
 * The Dynamic Media / Scene7 <img>/<picture> elements inside the content
 * sections (e.g. #logos, promo banners) are handled separately by the
 * DM auto-block in the orchestrator, so no content <img>, <picture> or their
 * wrapping anchors are removed here.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // --- Skip-to-content link (cleaned.html:4) ---
      'a[href="#main-content"]',

      // --- Top promo eyebrow bar (cleaned.html:5, div.sc-c5fa0909-6, unique) ---
      '.sc-c5fa0909-6',
      // Requested aria/role fallbacks in case the live page exposes them
      '[aria-label*="top-promo" i]',
      'aside[aria-label*="promo" i]',

      // --- Site header / primary + secondary nav ---
      // Header wrappers (cleaned.html:26 .euzCrM and :758 .iePXIY) contain the
      // Global Primary Navigation (nav.sc-70e1ee9e-2) and Global Secondary
      // Navigation (nav.sc-6c605ae3-4). Removing the wrappers removes the navs.
      '#__next > div > div.sc-70e1ee9e-4.euzCrM',
      '#__next > div > div.sc-70e1ee9e-4.iePXIY',
      'div.sc-70e1ee9e-4',
      // Explicit header nav selectors (NOT a bare `nav` — the testimonials
      // carousel uses nav.sc-c1b68abd-3 at cleaned.html:3043 which is content)
      'nav.sc-70e1ee9e-2',
      'nav.sc-6c605ae3-4',

      // --- Site footer (cleaned.html:3587 div.sc-70d743a6-5 wraps <footer>) ---
      '#__next > div > div.sc-70d743a6-5',
      'div.sc-70d743a6-5',
      'footer#footer-1719023883',

      // --- Cookie consent (OneTrust) ---
      // cleaned.html: #onetrust-consent-sdk, #onetrust-pc-sdk, .onetrust-pc-dark-filter
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      '.onetrust-pc-dark-filter',

      // --- Chat widget / "Open chat" launcher (loaded dynamically on live page) ---
      'button[aria-label="Open chat"]',
      '[aria-label="Open chat"]',
      '#launcher',
      '#webWidget',
      'iframe[title*="chat" i]',

      // --- Ad/analytics tracking-pixel <img> elements ---
      // These non-content pixels (e.g. a.usbrowserspeed.com, 6sc.co, doubleclick)
      // carry query strings with literal [ ] characters that break the
      // WebImporter built-in image rules (Invalid regular expression: range out
      // of order in character class). They are not authorable content — remove.
      'img[src*="usbrowserspeed.com"]',
      'img[src*="6sc.co"]',
      'img[src*="6sense.com"]',
      'img[src*="doubleclick.net"]',
      'img[src*="dpmsrv.com"]',
      'img[src*="adnxs.com"]',
      'img[src*="adsrvr.org"]',
      'img[src*="casalemedia.com"]',
      'img[src*="/pixel"]',
      'img[width="1"][height="1"]',
    ]);

    // Broad safety net: remove any <img> whose src contains an unescaped
    // square bracket (tracking/beacon URLs). Such URLs crash the importer's
    // built-in image RegExp handling and never represent real content.
    element.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.includes('[') || src.includes(']')) img.remove();
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Defensive sweep: remove non-content technical elements. Repeat of some
    // chrome selectors is a safe no-op if already removed in beforeTransform.
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link[rel="stylesheet"]',
      'link',
      'iframe',
      // leftover chrome (belt-and-suspenders)
      'div.sc-70e1ee9e-4',
      'div.sc-70d743a6-5',
      'nav.sc-70e1ee9e-2',
      'nav.sc-6c605ae3-4',
      'a[href="#main-content"]',
    ]);
  }
}
