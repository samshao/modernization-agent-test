import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// fortinet.com's decorative dots watermark for this section (.dots-bg) was
// migrated as the first image in a trailing content wrapper, alongside a
// pile of unrelated duplicate/leftover content that CSS hides outright
// (.cards-panel-container > .default-content-wrapper:last-child). Pull just
// that one picture out before the rest gets hidden, so it can be
// repositioned as the section's background decoration.
function extractDotsBackground(block) {
  const section = block.closest('.section');
  if (!section) return null;
  const wrappers = [...section.children].filter((c) => c.classList.contains('default-content-wrapper'));
  const trailingWrapper = wrappers[wrappers.length - 1];
  // Guard against there being only one default-content-wrapper (the eyebrow
  // text before the cards) — that one has no picture to grab anyway.
  if (!trailingWrapper || wrappers.length < 2) return null;
  return trailingWrapper.querySelector('picture');
}

export default function decorate(block) {
  const dotsPicture = extractDotsBackground(block);

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-panel-card-image';
      else div.className = 'cards-panel-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';

  // Prepended ahead of the ul (rather than appended after) so plain DOM
  // stacking order alone keeps it behind the cards — neither element sets
  // an explicit z-index.
  if (dotsPicture) {
    const dotsBg = document.createElement('div');
    dotsBg.className = 'cards-panel-dots-bg';
    dotsBg.append(dotsPicture);
    block.append(dotsBg);
  }
  block.append(ul);
}
