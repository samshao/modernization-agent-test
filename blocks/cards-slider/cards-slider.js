import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Advance the slider by exactly one card (matching fortinet.com's
// .ftnt-slide-prev/.ftnt-slide-next behavior), not a full page of visible
// cards. Re-reads the gap each time instead of caching it, since it differs
// between the mobile and desktop breakpoints.
function scrollByCard(ul, direction) {
  const card = ul.querySelector('li');
  if (!card) return;
  const gap = parseFloat(getComputedStyle(ul).gap) || 0;
  const amount = (card.getBoundingClientRect().width + gap) * direction;
  ul.scrollBy({ left: amount, behavior: 'smooth' });
}

// fortinet.com's own progress track (.ftnt-progress) is a disabled
// <input type="range"> whose red "fill" is actually its ::-webkit-slider-thumb
// — a fixed-width (30% of the track) red bar that the browser slides between
// the track's two ends as the range value changes. It's not a fill that
// grows from the left, so this reproduces the same thumb-width and travel
// distance with a plain positioned div instead of a real range input, since
// theirs is disabled/non-interactive too.
const PROGRESS_THUMB_PERCENT = 30;

// fortinet.com's control bar below the cards: round prev/next buttons that
// reuse a single right-pointing arrow icon (prev is just that same icon
// rotated 180deg), disabled/dimmed at either end of the slider, plus that
// progress track between them showing how far through the list you are.
function createControls(ul) {
  const controls = document.createElement('div');
  controls.className = 'cards-slider-controls';
  controls.innerHTML = `
    <button type="button" class="cards-slider-prev" aria-label="Previous"></button>
    <div class="cards-slider-progress" role="presentation">
      <div class="cards-slider-progress-thumb"></div>
    </div>
    <button type="button" class="cards-slider-next" aria-label="Next"></button>
  `;

  const prevButton = controls.querySelector('.cards-slider-prev');
  const nextButton = controls.querySelector('.cards-slider-next');
  const progressThumb = controls.querySelector('.cards-slider-progress-thumb');

  const updateControlsState = () => {
    const maxScroll = ul.scrollWidth - ul.clientWidth;
    prevButton.disabled = ul.scrollLeft <= 1;
    nextButton.disabled = ul.scrollLeft >= maxScroll - 1;
    const percent = maxScroll > 0 ? (ul.scrollLeft / maxScroll) * 100 : 0;
    // A thumb of width W can travel from left:0% to left:(100-W)%, same as a
    // native range thumb, so it never overhangs either end of the track.
    progressThumb.style.left = `${(percent * (100 - PROGRESS_THUMB_PERCENT)) / 100}%`;
  };

  prevButton.addEventListener('click', () => scrollByCard(ul, -1));
  nextButton.addEventListener('click', () => scrollByCard(ul, 1));
  ul.addEventListener('scroll', updateControlsState, { passive: true });
  // A single call here would run before images load and the block settles
  // into its final layout, when scrollWidth/clientWidth are both still 0 —
  // that reads as "no room to scroll" and disables next permanently, since
  // nothing but a scroll event re-checks it, and the user can't scroll a
  // disabled button in the first place. Watch for layout changes instead.
  new ResizeObserver(updateControlsState).observe(ul);

  return controls;
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-slider-card-image';
      else div.className = 'cards-slider-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
  block.append(createControls(ul));
}
