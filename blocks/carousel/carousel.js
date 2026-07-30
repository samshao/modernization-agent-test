function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

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

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
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

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

/**
 * Restructures a testimonial slide's authored content into the design layout:
 * - logo, blockquote, attribution (name + title) and CTA stay in the text column
 * - the numeric stat pairs are relocated onto the image as an overlay
 * Purely a DOM re-org; carousel rotation behavior is untouched.
 */
function enhanceTestimonialSlide(slide) {
  const image = slide.querySelector('.carousel-slide-image');
  const content = slide.querySelector('.carousel-slide-content');
  if (!image || !content) return;

  const children = [...content.children];
  const blockquote = content.querySelector('blockquote');
  const bqIndex = blockquote ? children.indexOf(blockquote) : children.length;

  // Logo: first paragraph before the quote that holds an image
  const logo = children.find((el, i) => i < bqIndex && el.tagName === 'P' && el.querySelector('img, picture'));
  if (logo) logo.classList.add('carousel-slide-logo');
  if (blockquote) blockquote.classList.add('carousel-slide-quote');

  // Stat paragraphs = text paragraphs before the quote, excluding the logo.
  // They alternate number, label, number, label…
  const statParas = children.filter((el, i) => (
    i < bqIndex && el.tagName === 'P' && el !== logo && !el.querySelector('img, picture')
  ));

  if (statParas.length >= 2) {
    const overlay = document.createElement('div');
    overlay.classList.add('carousel-slide-stats');
    for (let i = 0; i + 1 < statParas.length; i += 2) {
      const stat = document.createElement('div');
      stat.classList.add('carousel-stat');
      statParas[i].classList.add('carousel-stat-number');
      statParas[i + 1].classList.add('carousel-stat-label');
      stat.append(statParas[i], statParas[i + 1]);
      overlay.append(stat);
    }
    image.append(overlay);
  }

  // Attribution: paragraphs after the quote. The paragraph holding a link is
  // the CTA; the first plain paragraph is the name, the rest are the title.
  const afterQuote = children.filter((el, i) => i > bqIndex && el.tagName === 'P');
  let nameAssigned = false;
  afterQuote.forEach((p) => {
    if (p.querySelector('a')) {
      p.classList.add('carousel-slide-cta');
      p.querySelector('a').classList.add('carousel-cta-link');
    } else if (!nameAssigned) {
      p.classList.add('carousel-attr-name');
      nameAssigned = true;
    } else {
      p.classList.add('carousel-attr-title');
    }
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  enhanceTestimonialSlide(slide);

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
