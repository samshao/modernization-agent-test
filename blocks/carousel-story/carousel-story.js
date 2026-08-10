import { moveInstrumentation } from '../../scripts/scripts.js';

// Placeholders are not configured for this project; fall back to inline default labels.
async function fetchPlaceholders() {
  return {};
}

function getLogoItems(block) {
  const trailingWrapper = block.closest('.section')?.querySelector(':scope > .default-content-wrapper');
  return trailingWrapper ? [...trailingWrapper.querySelectorAll(':scope > ul > li')] : [];
}

/**
 * Replays the "drop in from the top" entrance animation (see
 * .carousel-story-drop-in in carousel-story.css) on the given element.
 * Re-adding a class an element already carries is a no-op as far as CSS
 * animations are concerned, so this removes it, forces a reflow, then adds
 * it back — that reflow is what makes the animation actually restart each
 * time a slide becomes active rather than only ever playing once.
 * @param {Element} el
 */
function restartAnimation(el) {
  if (!el) return;
  el.classList.remove('carousel-story-drop-in');
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth;
  el.classList.add('carousel-story-drop-in');
}

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel-story');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  // Each slide has its own background color (see the
  // .carousel-story-slide[data-slide-index] rules in carousel-story.css),
  // but the slide itself only spans the centered 1240px content column,
  // not the full-bleed section — .carousel-story is what's actually
  // full-width. Reading the color back off the slide (rather than
  // duplicating the color list here in JS) and applying it to that
  // full-width element too is what makes the color reach the true left
  // and right edges instead of leaving the old color showing as a stripe
  // outside the centered column.
  block.style.backgroundColor = getComputedStyle(slide).backgroundColor;

  // Desktop-only decorative copy of the active slide's photo, positioned to
  // hang past the teal background (see .carousel-story-float-photo in
  // carousel-story.css for why this is a background-image on a ::after
  // rather than the real <img> itself). The image is set via a custom
  // property, not floatPhoto.style.backgroundImage directly, because the
  // visible photo is that ::after pseudo-element — inline styles can't
  // target a pseudo-element, but a custom property set here is inherited
  // by it. Hidden at mobile widths via CSS, so no need to guard this on
  // viewport here.
  const floatPhoto = block.querySelector('.carousel-story-float-photo');
  const img = slide.querySelector('.carousel-story-slide-image img');
  if (floatPhoto) {
    const url = img && (img.currentSrc || img.src);
    floatPhoto.style.setProperty('--carousel-story-photo-url', url ? `url("${url}")` : 'none');
  }

  // Photo (desktop's floating copy, or the real inline image on mobile) and
  // dots (desktop-only) drop in from this section's own top edge each time a
  // slide becomes active — see .carousel-story-drop-in in carousel-story.css.
  restartAnimation(floatPhoto);
  restartAnimation(block.querySelector('.carousel-story-dots'));
  restartAnimation(slide.querySelector('.carousel-story-slide-image'));

  // The quote-block's dark card (its ::before) needs to reach this
  // section's true left border, but the block sits inside the 55%-width
  // content column — the left half of a centered row, not centered itself
  // — so a fixed CSS offset (or the usual left:50%;margin-left:-50vw trick,
  // which only cancels out for an element whose own containing block is
  // what's centered) can't reach it at every viewport width. Measuring the
  // actual gap and cancelling it exactly is what does.
  const quoteBlock = slide.querySelector('.carousel-story-quote-block');
  if (quoteBlock) {
    const offset = quoteBlock.getBoundingClientRect().left - block.getBoundingClientRect().left;
    quoteBlock.style.setProperty('--carousel-story-quote-left-offset', `${-offset}px`);
  }

  const slides = block.querySelectorAll('.carousel-story-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-story-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });

  // The customer-logo strip (fortinet.com's own thumbnail nav) is authored
  // as default content after the block, not part of it — dim every logo
  // except the active story's, matching the source's opacity:1/0.2 toggle.
  const logoItems = getLogoItems(block);
  logoItems.forEach((li, idx) => {
    li.classList.toggle('active', idx === slideIndex);
  });

  // "01 / 04" counter (also authored default content, the paragraph just
  // before the logo <ul>) — keep it in sync with the active slide.
  const counter = logoItems[0]?.closest('ul')?.previousElementSibling;
  if (counter && /^\d+\s*\/\s*\d+$/.test(counter.textContent.trim())) {
    const total = logoItems.length || slides.length;
    counter.textContent = `${String(slideIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  }
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-story-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));

  // Slides are stacked (see .carousel-story-slides in carousel-story.css),
  // not laid out side by side — switching which one has .active crossfades
  // between them via each slide's own opacity transition, rather than
  // scrolling a horizontal track.
  slides.forEach((slide, idx) => slide.classList.toggle('active', idx === realSlideIndex));
  updateActiveSlide(activeSlide);
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-story-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  // Clicking a logo in the thumbnail strip jumps to that story, same as
  // clicking a dot indicator.
  getLogoItems(block).forEach((li, idx) => {
    li.addEventListener('click', () => showSlide(block, idx));
  });
}

/**
 * fortinet.com lays the CTA links ("Read the Case Study" / "Customer Video")
 * out side by side in their own row (a <ul class="customer-links"> with
 * display:flex). Authoring here produces two separate <p> siblings instead
 * — and since their shared parent is itself a column-direction flex
 * container, each one claims its own row no matter what display/order is
 * set directly on them (a flex-direction:column container stacks every
 * direct child vertically; matching `order` values only controls sequence
 * within that stack, not which children share a row). Wrapping them in a
 * dedicated row div, so exactly one item occupies a "row" of that outer
 * column stack, is what actually lets the two links sit side by side.
 * @param {Element} content the slide's content column
 */
function wrapCtaLinks(content) {
  const ctaParagraphs = [...content.querySelectorAll(':scope > p')]
    .filter((p) => p.querySelector('a') && !p.querySelector('strong'));
  if (!ctaParagraphs.length) return;

  const row = document.createElement('div');
  row.className = 'carousel-story-cta-row';
  ctaParagraphs[0].before(row);
  ctaParagraphs.forEach((p) => row.append(p));

  // The source gives its video link a distinct play-button icon instead of
  // the case-study link's arrow — match on the label since that's the only
  // signal authored content gives us to tell the two apart.
  ctaParagraphs.forEach((p) => {
    const a = p.querySelector('a');
    if (/video/i.test(a.textContent)) a.classList.add('carousel-story-cta-video');
  });
}

/**
 * fortinet.com sits the quote and attribution on a dark rounded card behind
 * the text (its own .rectangle div, sized to that card independently of the
 * quote's own text length). Wrapping the two into one div lets a single
 * background/border-radius follow however tall a given story's quote runs,
 * rather than guessing a fixed height that would be wrong for shorter or
 * longer quotes.
 * @param {Element} content the slide's content column
 */
function wrapQuoteBlock(content) {
  const quote = content.querySelector('h2 + p');
  const attribution = quote?.nextElementSibling?.matches('p:has(strong)') ? quote.nextElementSibling : null;
  if (!quote) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-story-quote-block';
  quote.before(wrapper);
  wrapper.append(quote);
  if (attribution) wrapper.append(attribution);
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-story-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-story-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-story-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const content = slide.querySelector('.carousel-story-slide-content');
  if (content) {
    wrapCtaLinks(content);
    wrapQuoteBlock(content);
  }

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-story-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-story-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-story-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-story-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-story-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  let hasImages = false;

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    moveInstrumentation(row, slide);
    // Set synchronously (not deferred like the rest of updateActiveSlide's
    // work below) since this is what makes the first slide visible at all
    // — slides are stacked and only .active is shown (see
    // .carousel-story-slide in carousel-story.css) — so waiting a frame
    // for this specifically would flash an empty carousel first.
    if (idx === 0) slide.classList.add('active');
    slidesWrapper.append(slide);
    if (slide.querySelector('.carousel-story-slide-image')) hasImages = true;

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-story-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);

  // Full-bleed wrapper around the (centered, narrower) container above,
  // purely to clip the crossfade's overlapping stacked slides — see
  // .carousel-story-slides-clip in carousel-story.css for why this can't
  // just be overflow:hidden on .carousel-story-slide itself (that clips at
  // the slide's own centered/narrow box, not this section's true edges,
  // which defeats the quote-block's own escape-to-the-left-border trick in
  // updateActiveSlide below).
  const clipWrapper = document.createElement('div');
  clipWrapper.className = 'carousel-story-slides-clip';
  clipWrapper.append(container);
  block.prepend(clipWrapper);

  // Desktop-only decorative copy of the active slide's photo (see
  // .carousel-story-float-photo in carousel-story.css) — a plain div, not
  // the real <img>, kept in sync by updateActiveSlide.
  if (hasImages) {
    const floatPhoto = document.createElement('div');
    floatPhoto.className = 'carousel-story-float-photo';
    floatPhoto.setAttribute('aria-hidden', 'true');
    block.append(floatPhoto);
  }

  // Dot-grid watermark, right side — fortinet.com renders this as the
  // actual SVG (55 individual <rect> dots), not a CSS tiled background, so
  // this fetches and inlines that same file rather than approximating it.
  // Static (not re-synced per slide like the photo above): every slide
  // shares the same fixed photo top/height (see carousel-story.css), so
  // there's a single position that's correct for all of them.
  //
  // dotsFrame mirrors .carousel-story-float-photo's own outer wrapper — a
  // reference frame matching the centered 1240px content column's own
  // max-width/centering — so dots' own top/right values (set on the real
  // .carousel-story-dots inside it) resolve against the image's actual
  // edge instead of this section's full-bleed one, which only looked
  // right at the specific viewport width it was measured at (see
  // carousel-story.css for the full explanation).
  const dotsFrame = document.createElement('div');
  dotsFrame.className = 'carousel-story-dots-frame';
  const dots = document.createElement('div');
  dots.className = 'carousel-story-dots';
  dots.setAttribute('aria-hidden', 'true');
  dotsFrame.append(dots);
  block.append(dotsFrame);
  fetch(`${window.hlx.codeBasePath}/icons/carousel-story-dots.svg`)
    .then((resp) => (resp.ok ? resp.text() : ''))
    .then((svg) => { dots.innerHTML = svg; })
    .catch(() => {}); // decorative only; leave the div empty on failure

  if (!isSingleSlide) {
    bindEvents(block);
  }

  // Deferred a frame: called synchronously here, the quote-block's own
  // width hasn't necessarily gone through a layout pass yet, and its
  // measured offset (see updateActiveSlide) reads back as 0 rather than
  // its real value.
  const firstSlide = slidesWrapper.querySelector('.carousel-story-slide');
  if (firstSlide) requestAnimationFrame(() => updateActiveSlide(firstSlide));

  // The quote-block's left-offset measurement (see updateActiveSlide) is a
  // real pixel value, not a viewport-relative unit — it goes stale if the
  // window is resized across the desktop/mobile breakpoint or just resized
  // at desktop width, so it's re-measured against whichever slide is
  // current whenever that happens. rAF-throttled since 'resize' can fire
  // many times per second during a drag-resize.
  let resizePending = false;
  window.addEventListener('resize', () => {
    if (resizePending) return;
    resizePending = true;
    requestAnimationFrame(() => {
      resizePending = false;
      const activeSlide = block.querySelector(`.carousel-story-slide[data-slide-index="${block.dataset.activeSlide || 0}"]`);
      if (activeSlide) updateActiveSlide(activeSlide);
    });
  });
}
