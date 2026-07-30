/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import carouselStoryParser from './parsers/carousel-story.js';
import cardsSliderParser from './parsers/cards-slider.js';
import cardsPanelParser from './parsers/cards-panel.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import cardsStatParser from './parsers/cards-stat.js';
import cardsTrustParser from './parsers/cards-trust.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/fortinet-cleanup.js';
import sectionsTransformer from './transformers/fortinet-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'carousel-story': carouselStoryParser,
  'cards-slider': cardsSliderParser,
  'cards-panel': cardsPanelParser,
  'cards-feature': cardsFeatureParser,
  'cards-stat': cardsStatParser,
  'cards-trust': cardsTrustParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Fortinet corporate homepage with billboard hero slider, news slider, fabric/AI-driven feature sections, platform product rows, global scale stats, customer stories, trusted-by logos, and events slider.',
  urls: [
    'https://www.fortinet.com/',
  ],
  blocks: [
    {
      name: 'carousel-hero',
      instances: ['div.C926-Billboard-Sliders', '#home-valprop-slides'],
    },
    {
      name: 'cards-slider',
      instances: ['section.container.ftnt-section.ftnt-news', 'section.container.ftnt-section.ftnt-events'],
    },
    {
      name: 'cards-panel',
      instances: ['#fabric-area > main.ftnt-main.bg-red > div.container > div.row'],
    },
    {
      name: 'cards-feature',
      instances: ['div.product-row.ftnt-platform'],
    },
    {
      name: 'cards-stat',
      instances: ['div.global-scale > div.container > div.row'],
    },
    {
      name: 'carousel-story',
      instances: ['div.customer-stories'],
    },
    {
      name: 'cards-trust',
      instances: ['main.ftnt-main.trusted-section > div.container > div.row:nth-of-type(3)'],
    },
  ],
  sections: [
    { id: 'rc4', name: 'Hero Billboard', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C926-Billboard-Sliders.aem-GridColumn.aem-GridColumn--default--12', style: null, blocks: ['carousel-hero'], defaultContent: [] },
    { id: 'rc5', name: 'Latest News', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C814-Event-News-Slider.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(3)', style: null, blocks: ['cards-slider'], defaultContent: ['div.section-label', 'h2.text-align--center'] },
    { id: 'rc6', name: 'Integration and Automation', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(4)', style: null, blocks: ['cards-panel'], defaultContent: ['#fabric-area > main.ftnt-main.bg-red > div.container > div.section-label'] },
    { id: 'rc8', name: 'AI-Driven Security', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(6)', style: null, blocks: [], defaultContent: ['div.section__head', '#ai-diagram', 'div.cta-wrapper'] },
    { id: 'rc9', name: 'Cybersecurity Platform', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(7)', style: null, blocks: ['cards-feature'], defaultContent: ['div.platform-container > div.section__head'] },
    { id: 'rc10', name: 'FortiGuard Labs Stats', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(8)', style: 'dark', blocks: ['cards-stat'], defaultContent: ['div.global-scale > div.container > div.section__head', 'div.global-scale > div.container > div.moreinfo'] },
    { id: 'rc11', name: 'Customer Stories', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(9)', style: null, blocks: ['carousel-story'], defaultContent: ['div.customer-stories > ul.customer-stories-nav', 'div.customer-stories > div.cta-wrapper'] },
    { id: 'rc12', name: 'Trusted by Organizations', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(10)', style: null, blocks: ['cards-trust'], defaultContent: ['main.ftnt-main.trusted-section > div.container > div.row:nth-of-type(1)', 'main.ftnt-main.trusted-section > div.container > div.cta-wrapper'] },
    { id: 'rc13', name: 'Upcoming Events', selector: 'body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C814-Event-News-Slider.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(11)', style: null, blocks: ['cards-slider'], defaultContent: ['div.events-slider > div.row > div.col.section__head > h2.text-align--center'] },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
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
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
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

    // 4. Execute afterTransform transformers (final cleanup + section breaks/metadata)
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
