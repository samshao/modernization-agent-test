/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import cardsParser from './parsers/cards.js';
import tabsParser from './parsers/tabs.js';
import carouselParser from './parsers/carousel.js';
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/zendesk-cleanup.js';
import sectionsTransformer from './transformers/zendesk-sections.js';
import dmImagesTransformer from './transformers/zendesk-dm-images.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  columns: columnsParser,
  cards: cardsParser,
  tabs: tabsParser,
  carousel: carouselParser,
  accordion: accordionParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Zendesk corporate homepage with hero, logos, learning loop, stats, promo banners, tabs, cards, testimonials, marketplace, resources, pricing, CTA, and FAQ.',
  urls: [
    'https://www.zendesk.com',
  ],
  blocks: [
    { name: 'hero', instances: ['#hero'] },
    {
      name: 'columns',
      instances: [
        '#logos',
        '#datapoints',
        '#forethought',
        '#gartner',
        '#marketplace_ecosystem',
        '#main-content > div.sc-f9eaaf5f-0.cwMKbe > section.sc-3cb30ae3-10.jDUkDo:nth-of-type(7)',
      ],
    },
    {
      name: 'cards',
      instances: [
        '#resolution_learning_loop',
        '#employee_service_contact_center',
        '#resources',
        '#main-content > div.sc-f9eaaf5f-0.cwMKbe > section.sc-3cb30ae3-10.jDUkDo:nth-of-type(5)',
      ],
    },
    { name: 'tabs', instances: ['#ai_first_customer_service'] },
    { name: 'carousel', instances: ['#testimonials'] },
    { name: 'accordion', instances: ['#footer_faq'] },
  ],
  sections: [
    { id: 'rc1', name: 'Hero', selector: '#hero', style: null, blocks: ['hero'], defaultContent: [] },
    { id: 'rc2', name: 'Trust Logos', selector: '#logos', style: null, blocks: ['columns'], defaultContent: ['#logos h2'] },
    { id: 'rc3', name: 'Resolution Learning Loop', selector: '#resolution_learning_loop', style: null, blocks: ['cards'], defaultContent: ['#resolution_learning_loop h2', '#resolution_learning_loop p'] },
    { id: 'rc4', name: 'Data Points Stats', selector: '#datapoints', style: null, blocks: ['columns'], defaultContent: ['#datapoints h3'] },
    { id: 'rc5', name: 'Relate Promo + 3 Pillars', selector: '#main-content > div.sc-f9eaaf5f-0.cwMKbe > section.sc-3cb30ae3-10.jDUkDo:nth-of-type(5)', style: null, blocks: ['columns', 'cards'], defaultContent: [] },
    { id: 'rc6', name: 'Forethought Promo', selector: '#forethought', style: null, blocks: ['columns'], defaultContent: [] },
    { id: 'rc7', name: 'Warriors Partnership Promo', selector: '#main-content > div.sc-f9eaaf5f-0.cwMKbe > section.sc-3cb30ae3-10.jDUkDo:nth-of-type(7)', style: 'dark', blocks: ['columns'], defaultContent: [] },
    { id: 'rc8', name: 'AI-First Service Tabs', selector: '#ai_first_customer_service', style: 'dark', blocks: ['tabs'], defaultContent: ['#ai_first_customer_service h2', '#ai_first_customer_service p'] },
    { id: 'rc9', name: 'Employee Service + Contact Center Cards', selector: '#employee_service_contact_center', style: null, blocks: ['cards'], defaultContent: ['#employee_service_contact_center h2'] },
    { id: 'rc10', name: 'Gartner Report Promo', selector: '#gartner', style: 'dark', blocks: ['columns'], defaultContent: [] },
    { id: 'rc11', name: 'Testimonials Carousel', selector: '#testimonials', style: null, blocks: ['carousel'], defaultContent: ['#testimonials h2', '#testimonials p'] },
    { id: 'rc12', name: 'Marketplace Ecosystem', selector: '#marketplace_ecosystem', style: null, blocks: ['columns'], defaultContent: [] },
    { id: 'rc13', name: 'Additional Resources Cards', selector: '#resources', style: null, blocks: ['cards'], defaultContent: ['#resources h2'] },
    { id: 'rc14', name: 'Pricing CTA', selector: '#pricing', style: null, blocks: [], defaultContent: ['#pricing h2', '#pricing p'] },
    { id: 'rc15', name: 'Footer CTA', selector: '#footer_cta', style: 'dark', blocks: [], defaultContent: ['#footer_cta h2'] },
    { id: 'rc16', name: 'FAQ Accordion', selector: '#footer_faq', style: 'dark', blocks: ['accordion'], defaultContent: ['#footer_faq h3'] },
  ],
};

// TRANSFORMER REGISTRY
// Order matters within a hook: cleanup first, then sections, then dm-images.
// - cleanup: beforeTransform (strip chrome) + afterTransform (defensive sweep)
// - sections: afterTransform (insert <hr> + section-metadata)
// - dm-images: afterTransform (rewrite Scene7 <img> to carrier anchors AFTER
//   block parsers have extracted the images into their cells)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  dmImagesTransformer,
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return; // avoid double-processing overlapping selectors
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
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

    // 4. Execute afterTransform transformers (section breaks/metadata + DM images + defensive cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
