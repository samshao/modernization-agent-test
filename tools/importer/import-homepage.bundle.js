/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document }) {
    let slides = Array.from(element.querySelectorAll(".valprop--home-slide, .cycle-slide"));
    slides = slides.filter((slide, idx) => slides.indexOf(slide) === idx);
    const cells = [];
    const resolveImage = (slide) => {
      const imgs = Array.from(slide.querySelectorAll("img"));
      let img = imgs.find((i) => i.getAttribute("src") && !i.getAttribute("src").startsWith("data:"));
      if (!img) {
        img = imgs.find((i) => i.getAttribute("data-src") || i.getAttribute("data-original") || i.getAttribute("data-lazy-src") || i.getAttribute("srcset"));
      }
      if (img) {
        const lazySrc = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src");
        const currentSrc = img.getAttribute("src");
        if ((!currentSrc || currentSrc.startsWith("data:")) && lazySrc) {
          img.setAttribute("src", lazySrc);
        }
        return img;
      }
      const bgEls = [slide, ...Array.from(slide.querySelectorAll(':scope > div, [style*="background"], [data-style*="background"]'))];
      for (const el of bgEls) {
        if (!el.getAttribute) continue;
        const style = el.getAttribute("style") || el.getAttribute("data-style");
        if (!style) continue;
        const match = style.match(/background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/i);
        if (match && match[2] && !match[2].startsWith("data:")) {
          const created = document.createElement("img");
          created.src = match[2];
          const heading = slide.querySelector(".valprop--home-head, h1, h2, h3");
          if (heading) created.alt = heading.textContent.trim();
          return created;
        }
      }
      return null;
    };
    slides.forEach((slide) => {
      const image = resolveImage(slide);
      const title = slide.querySelector(".valprop--home-head, h1, h2, h3");
      const description = slide.querySelector(".valprop--home-subhead, p");
      const ctaLinks = Array.from(slide.querySelectorAll('a.button--transparent--home, a[class*="button"]'));
      const contentCell = [];
      if (title) contentCell.push(title);
      if (description) contentCell.push(description);
      contentCell.push(...ctaLinks);
      if (!image && contentCell.length === 0) return;
      cells.push([image || "", contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-story.js
  function parse2(element, { document }) {
    let slides = Array.from(element.querySelectorAll(".banner-content"));
    if (slides.length === 0) {
      slides = element.classList && element.classList.contains("banner-content") ? [element] : [element];
    }
    const cells = [];
    slides.forEach((slide) => {
      const imageScope = slide.closest(".banner") || slide;
      const resolveSrc = (img) => img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-original") || "";
      let image = Array.from(imageScope.querySelectorAll("img.banner-image")).find((img) => resolveSrc(img) && !resolveSrc(img).startsWith("data:"));
      if (!image) {
        image = Array.from(imageScope.querySelectorAll("img")).find((img) => resolveSrc(img) && !resolveSrc(img).startsWith("data:")) || null;
      }
      if (image) {
        const src = image.getAttribute("src");
        const lazy = image.getAttribute("data-src") || image.getAttribute("data-original");
        if ((!src || src.startsWith("data:")) && lazy) image.setAttribute("src", lazy);
      }
      const title = slide.querySelector("h1, h2, h3");
      const quote = slide.querySelector(".quote");
      const company = slide.querySelector(".company");
      const ctaLinks = Array.from(slide.querySelectorAll(".customer-links a, a[href]")).filter((a) => {
        return !company || !company.contains(a);
      });
      const uniqueCtas = ctaLinks.filter((a, idx) => ctaLinks.indexOf(a) === idx);
      const contentCell = [];
      if (title) contentCell.push(title);
      if (quote) contentCell.push(quote);
      if (company) contentCell.push(company);
      contentCell.push(...uniqueCtas);
      if (!image && contentCell.length === 0) return;
      cells.push([image || "", contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-story", cells });
    const banners = Array.from(element.querySelectorAll(":scope > .banner"));
    if (banners.length > 0) {
      banners[0].replaceWith(block);
      banners.slice(1).forEach((b) => b.remove());
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/cards-slider.js
  function parse3(element, { document }) {
    const cards = Array.from(element.querySelectorAll(".ftnt-product"));
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector("picture img, img.ftnt-image, img");
      let image = null;
      if (img) {
        const dataSrc = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src");
        const src = img.getAttribute("src");
        if ((!src || src.startsWith("data:")) && dataSrc) {
          img.setAttribute("src", dataSrc);
        }
        if (img.getAttribute("src") && !img.getAttribute("src").startsWith("data:")) {
          image = img;
        }
      }
      const titleEl = card.querySelector(".ftnt-news-title, b.ftnt-news-title");
      const titleLink = card.querySelector("a.ftnt-anchor[href]:not(.ftnt-picture a)") || card.querySelector(".ftnt-detail a.ftnt-anchor[href]");
      let heading = null;
      if (titleEl) {
        heading = document.createElement("h3");
        if (titleLink) {
          const a = document.createElement("a");
          a.href = titleLink.getAttribute("href");
          a.textContent = titleEl.textContent.trim();
          heading.append(a);
        } else {
          heading.textContent = titleEl.textContent.trim();
        }
      }
      const descEl = card.querySelector(".ftnt-news-description");
      let description = null;
      if (descEl) {
        description = document.createElement("p");
        description.textContent = descEl.textContent.trim();
      }
      const ctaAnchor = card.querySelector("a.ftnt-download-anchor[href]");
      let cta = null;
      if (ctaAnchor) {
        cta = document.createElement("a");
        cta.href = ctaAnchor.getAttribute("href");
        cta.textContent = ctaAnchor.textContent.trim();
      }
      const contentCell = [];
      if (heading) contentCell.push(heading);
      if (description) contentCell.push(description);
      if (cta) contentCell.push(cta);
      if (!image && contentCell.length === 0) return;
      cells.push([image || "", contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-slider", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-panel.js
  function parse4(element, { document }) {
    const scope = element.closest("#fabric-area") || element.parentElement || element;
    const cards = Array.from(scope.querySelectorAll(".white-box"));
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector(":scope > img, img");
      let image = null;
      if (img) {
        const lazy = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src");
        const src = img.getAttribute("src");
        if ((!src || src.startsWith("data:")) && lazy) img.setAttribute("src", lazy);
        if (img.getAttribute("src") && !img.getAttribute("src").startsWith("data:")) image = img;
      }
      const detail = card.querySelector(".box-detail") || card;
      const titleLink = detail.querySelector("a.box-title[href]");
      const titleText = titleLink && titleLink.textContent.trim() || card.querySelector(".box-label h3, h3") && card.querySelector(".box-label h3, h3").textContent.trim();
      let heading = null;
      if (titleText) {
        heading = document.createElement("h3");
        if (titleLink && titleLink.getAttribute("href")) {
          const a = document.createElement("a");
          a.href = titleLink.getAttribute("href");
          a.textContent = titleText;
          heading.append(a);
        } else {
          heading.textContent = titleText;
        }
      }
      const description = detail.querySelector(":scope > p, p");
      const linkList = detail.querySelector(":scope > ul, ul");
      const contentCell = [];
      if (heading) contentCell.push(heading);
      if (description) contentCell.push(description);
      if (linkList) contentCell.push(linkList);
      if (!image && contentCell.length === 0) return;
      cells.push([image || "", contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const sectionHeading = scope.querySelector("h1, h2");
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-panel", cells });
    if (sectionHeading) {
      const headingClone = sectionHeading.cloneNode(true);
      element.replaceWith(headingClone, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/cards-feature.js
  function parse5(element, { document }) {
    const cards = Array.from(element.querySelectorAll(".product-card"));
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector("img.product-image, .product-card-body img, img");
      let image = null;
      if (img) {
        const lazy = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src");
        const src = img.getAttribute("src");
        if ((!src || src.startsWith("data:")) && lazy) img.setAttribute("src", lazy);
        if (img.getAttribute("src") && !img.getAttribute("src").startsWith("data:")) image = img;
      }
      const labelEl = card.querySelector(".product-card-header span, .product-card-header");
      let label = null;
      if (labelEl && labelEl.textContent.trim()) {
        label = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = labelEl.textContent.trim();
        label.append(strong);
      }
      const titleEl = card.querySelector(".product-title, b.product-title");
      const href = card.matches("a[href]") ? card.getAttribute("href") : card.querySelector("a[href]") ? card.querySelector("a[href]").getAttribute("href") : null;
      let heading = null;
      if (titleEl && titleEl.textContent.trim()) {
        heading = document.createElement("h3");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = titleEl.textContent.trim();
          heading.append(a);
        } else {
          heading.textContent = titleEl.textContent.trim();
        }
      }
      const descEl = card.querySelector(".product-desc, p.product-desc");
      let description = null;
      if (descEl && descEl.textContent.trim()) {
        description = document.createElement("p");
        description.textContent = descEl.textContent.trim();
      }
      const contentCell = [];
      if (label) contentCell.push(label);
      if (heading) contentCell.push(heading);
      if (description) contentCell.push(description);
      if (!image && contentCell.length === 0) return;
      cells.push([image || "", contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stat.js
  function parse6(element, { document }) {
    let stats = Array.from(element.querySelectorAll(".stat-info"));
    if (stats.length === 0) {
      stats = Array.from(element.querySelectorAll('[class*="col"]')).filter((c) => c.querySelector(".stat-num"));
    }
    const cells = [];
    const VALUE_BY_LABEL = {
      "cloud events processed": "100T",
      "exploit attempts detected": "60B",
      "malware executions blocked": "1.8B",
      "new unique objects analyzed": "130B",
      "new unique attack objects identified": "4.2M",
      "attacks prevented inline": "34B"
    };
    stats.forEach((stat) => {
      const clone = stat.cloneNode(true);
      const cloneNum = clone.querySelector(".stat-num");
      if (cloneNum) cloneNum.remove();
      const labelText = clone.textContent.replace(/\s+/g, " ").trim();
      const numEl = stat.querySelector(".stat-num");
      let valueText = numEl ? numEl.textContent.replace(/\s+/g, " ").trim() : "";
      const authoritative = VALUE_BY_LABEL[labelText.toLowerCase()];
      if (authoritative) valueText = authoritative;
      const contentCell = [];
      if (valueText) {
        const heading = document.createElement("h3");
        heading.textContent = valueText;
        contentCell.push(heading);
      }
      if (labelText) {
        const desc = document.createElement("p");
        desc.textContent = labelText;
        contentCell.push(desc);
      }
      if (contentCell.length === 0) return;
      cells.push([contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-stat", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-trust.js
  function parse7(element, { document }) {
    const tiles = Array.from(element.querySelectorAll(".trusted-tile"));
    const cells = [];
    tiles.forEach((tile) => {
      const headerTitle = tile.querySelector(".trust-header > div, .trust-header div");
      let heading = null;
      if (headerTitle && headerTitle.textContent.trim()) {
        heading = document.createElement("h3");
        heading.textContent = headerTitle.textContent.trim();
      }
      const infoEl = tile.querySelector(".trust-info");
      let description = null;
      if (infoEl && infoEl.textContent.trim()) {
        description = document.createElement("p");
        description.textContent = infoEl.textContent.trim();
      }
      const linkEl = tile.querySelector(".trust-link");
      const href = tile.matches("a[href]") ? tile.getAttribute("href") : tile.querySelector("a[href]") ? tile.querySelector("a[href]").getAttribute("href") : null;
      let cta = null;
      const ctaText = linkEl && linkEl.textContent.trim() || "";
      if (href) {
        cta = document.createElement("a");
        cta.href = href;
        cta.textContent = ctaText.replace(/\s*»\s*$/, "").trim() || "Learn More";
      }
      const contentCell = [];
      if (heading) contentCell.push(heading);
      if (description) contentCell.push(description);
      if (cta) contentCell.push(cta);
      if (contentCell.length === 0) return;
      cells.push([contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-trust", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/fortinet-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "aside.dg-consent-banner",
        // consent/cookie banner
        "#embedded-messaging"
        // embedded chat widget
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.ftnt-navigation",
        // site header (wraps #top-nav and #main-nav)
        "#top-nav",
        // utility navigation
        "#main-nav",
        // primary navigation
        "footer#footer",
        // site footer (wraps nav.footer-nav)
        "nav.footer-nav",
        // footer navigation
        ".be-ix-link-block",
        // BrightEdge related-links SEO block
        "div.C991-CSS-JS"
        // empty AEM clientlib CSS/JS injection points (rc3, rc7)
      ]);
    }
  }

  // tools/importer/transformers/fortinet-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.beforeTransform) return;
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : null;
    if (!sections || sections.length < 2) return;
    const { document } = payload;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section || !section.selector) continue;
      let sectionEl;
      try {
        sectionEl = element.querySelector(section.selector);
      } catch (e) {
        sectionEl = null;
      }
      if (!sectionEl) continue;
      if (section.style) {
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        sectionEl.after(metadataBlock);
      }
      if (i > 0) {
        sectionEl.before(document.createElement("hr"));
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel-hero": parse,
    "carousel-story": parse2,
    "cards-slider": parse3,
    "cards-panel": parse4,
    "cards-feature": parse5,
    "cards-stat": parse6,
    "cards-trust": parse7
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Fortinet corporate homepage with billboard hero slider, news slider, fabric/AI-driven feature sections, platform product rows, global scale stats, customer stories, trusted-by logos, and events slider.",
    urls: [
      "https://www.fortinet.com/"
    ],
    blocks: [
      {
        name: "carousel-hero",
        instances: ["div.C926-Billboard-Sliders", "#home-valprop-slides"]
      },
      {
        name: "cards-slider",
        instances: ["section.container.ftnt-section.ftnt-news", "section.container.ftnt-section.ftnt-events"]
      },
      {
        name: "cards-panel",
        instances: ["#fabric-area > main.ftnt-main.bg-red > div.container > div.row"]
      },
      {
        name: "cards-feature",
        instances: ["div.product-row.ftnt-platform"]
      },
      {
        name: "cards-stat",
        instances: ["div.global-scale > div.container > div.row"]
      },
      {
        name: "carousel-story",
        instances: ["div.customer-stories"]
      },
      {
        name: "cards-trust",
        instances: ["main.ftnt-main.trusted-section > div.container > div.row:nth-of-type(3)"]
      }
    ],
    sections: [
      { id: "rc4", name: "Hero Billboard", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C926-Billboard-Sliders.aem-GridColumn.aem-GridColumn--default--12", style: null, blocks: ["carousel-hero"], defaultContent: [] },
      { id: "rc5", name: "Latest News", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C814-Event-News-Slider.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(3)", style: null, blocks: ["cards-slider"], defaultContent: ["div.section-label", "h2.text-align--center"] },
      { id: "rc6", name: "Integration and Automation", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(4)", style: null, blocks: ["cards-panel"], defaultContent: ["#fabric-area > main.ftnt-main.bg-red > div.container > div.section-label"] },
      { id: "rc8", name: "AI-Driven Security", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(6)", style: null, blocks: [], defaultContent: ["div.section__head", "#ai-diagram", "div.cta-wrapper"] },
      { id: "rc9", name: "Cybersecurity Platform", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(7)", style: null, blocks: ["cards-feature"], defaultContent: ["div.platform-container > div.section__head"] },
      { id: "rc10", name: "FortiGuard Labs Stats", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(8)", style: "dark", blocks: ["cards-stat"], defaultContent: ["div.global-scale > div.container > div.section__head", "div.global-scale > div.container > div.moreinfo"] },
      { id: "rc11", name: "Customer Stories", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(9)", style: null, blocks: ["carousel-story"], defaultContent: ["div.customer-stories > ul.customer-stories-nav", "div.customer-stories > div.cta-wrapper"] },
      { id: "rc12", name: "Trusted by Organizations", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C48-Form-HTML-Snippet.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(10)", style: null, blocks: ["cards-trust"], defaultContent: ["main.ftnt-main.trusted-section > div.container > div.row:nth-of-type(1)", "main.ftnt-main.trusted-section > div.container > div.cta-wrapper"] },
      { id: "rc13", name: "Upcoming Events", selector: "body > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.C814-Event-News-Slider.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(11)", style: null, blocks: ["cards-slider"], defaultContent: ["div.events-slider > div.row > div.col.section__head > h2.text-align--center"] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
