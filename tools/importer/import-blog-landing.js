/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsFeaturedParser from './parsers/cards-featured.js';
import cardsBloglistParser from './parsers/cards-bloglist.js';
import tabsBlogParser from './parsers/tabs-blog.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/blog-cleanup.js';
import sectionsTransformer from './transformers/blog-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-featured': cardsFeaturedParser,
  'cards-bloglist': cardsBloglistParser,
  'tabs-blog': tabsBlogParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (blog-landing)
const PAGE_TEMPLATE = {
  name: 'blog-landing',
  description: 'Fortinet blog landing/listing page: featured posts, latest blogs list, category tabs.',
  urls: ['https://www.fortinet.com/blog'],
  blocks: [
    // tabs-blog first so its nested content is parsed before the top-level
    // cards-bloglist runs; cards-bloglist scoped to the direct grid child only
    // (bare section.b3-blog-list also appears nested inside the tabs).
    { name: 'tabs-blog', instances: ['div.C18-Tabs'] },
    { name: 'cards-featured', instances: ['section.h1-featured'] },
    { name: 'cards-bloglist', instances: ['section.b3-blog-list.aem-GridColumn'] },
  ],
  sections: [
    { id: 'rc3', name: 'Featured Posts', selector: 'section.h1-featured', style: null, blocks: ['cards-featured'], defaultContent: [] },
    { id: 'rc4', name: 'Latest Blogs', selector: 'section.b3-blog-list', style: null, blocks: ['cards-bloglist'], defaultContent: ['section.b3-blog-list h2'] },
    { id: 'rc6', name: 'Blog Topics Tabs', selector: 'div.C18-Tabs', style: null, blocks: ['tabs-blog'], defaultContent: ['div.C18-Tabs h2'] },
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
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/blog',
    );

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
