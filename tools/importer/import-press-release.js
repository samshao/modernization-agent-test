/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroPressParser from './parsers/hero-press.js';
import tableParser from './parsers/table.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/pr-cleanup.js';
import sectionsTransformer from './transformers/pr-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-press': heroPressParser,
  table: tableParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (press-release)
const PAGE_TEMPLATE = {
  name: 'press-release',
  description: 'Fortinet newsroom press release: hero (eyebrow, title, subtitle, dateline), two-column body (article + kept sidebar bits) as default content, and an About Fortinet band.',
  urls: [
    'https://www.fortinet.com/corporate/about-us/newsroom/press-releases/2026/fortinet-expands-fortigate-g-series-with-1200g-and-fortisase-outpost-to-advance-firewall-sase-convergence',
  ],
  blocks: [
    { name: 'hero-press', instances: ['div.C941-Product-Hero-Banner'] },
    { name: 'table', instances: ['div.C05-Container:nth-of-type(2) table'] },
  ],
  sections: [
    { id: 'sec1', name: 'Press Release Hero', selector: 'div.C941-Product-Hero-Banner', style: null, blocks: ['hero-press'], defaultContent: [] },
    { id: 'sec2', name: 'Press Release Body', selector: 'div.C05-Container:nth-of-type(2)', style: null, blocks: [], defaultContent: ['div.C05-Container:nth-of-type(2) div.col-8.col-md-12.cta--item', 'div.C05-Container:nth-of-type(2) div.col-4'] },
    { id: 'sec3', name: 'About Fortinet', selector: 'div.C05-Container:nth-of-type(3)', style: 'light', blocks: [], defaultContent: ['div.C05-Container:nth-of-type(3) div.col-12.col-md-12.cta--item'] },
  ],
};

// TRANSFORMER REGISTRY
// pr-cleanup: beforeTransform (chrome removal) + its own afterTransform sweep.
// pr-sections: afterTransform only (runs after block parsing) — added when the
// template declares 2+ sections.
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
