/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import blogMetaParser from './parsers/blog-meta.js';
import cardsParser from './parsers/cards.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/blog-cleanup.js';
import sectionsTransformer from './transformers/blog-sections.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  'blog-meta': blogMetaParser,
  cards: cardsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (blog-post)
const PAGE_TEMPLATE = {
  name: 'blog-post',
  description: 'Fortinet blog article page: hero, byline, article body (default content), related posts.',
  urls: [
    'https://www.fortinet.com/blog/security-operations/fortiendpoint-expands-security-for-the-ai-era',
    'https://www.fortinet.com/blog/security-operations/introducing-fortisoc-one-platform-total-control',
    'https://www.fortinet.com/blog/ciso-collective/update-on-fortinet-use-of-frontier-ai',
    'https://www.fortinet.com/blog/industry-trends/while-external-threats-are-driving-security-awareness-internal-risks-are-growing',
    'https://www.fortinet.com/blog/threat-research/inside-a-trickbot-variant-using-dns-tunneling-for-c2',
    'https://www.fortinet.com/blog/secure-networking/fortinet-earns-av-comparatives-certification-for-edr-detection-visibility',
  ],
  blocks: [
    { name: 'hero', instances: ['section.b4-hero'] },
    { name: 'blog-meta', instances: ['section.b15-blog-meta'] },
    { name: 'cards', instances: ['section.b12-related'] },
  ],
  sections: [
    { id: 'rc2', name: 'Post Hero', selector: 'section.b4-hero', style: null, blocks: ['hero'], defaultContent: [] },
    { id: 'rc3', name: 'Byline Meta', selector: 'section.b15-blog-meta', style: null, blocks: ['blog-meta'], defaultContent: [] },
    { id: 'rc4', name: 'Article Body', selector: 'div.responsivegrid > div.aem-Grid > div.cmp.cmp-text:nth-of-type(5)', style: null, blocks: [], defaultContent: ['div.responsivegrid > div.aem-Grid > div.cmp.cmp-text:nth-of-type(5)'] },
    { id: 'rc6', name: 'Related Posts', selector: 'section.b12-related', style: null, blocks: ['cards'], defaultContent: ['section.b12-related h3'] },
  ],
};

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
