import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Featured posts block: one large "main" card + stacked "secondary" cards.
 * Each card is an image with the category eyebrow overlaid top-left and the
 * linked title overlaid bottom-left. Descriptions authored in the table are
 * intentionally not rendered (they are not shown in the source design).
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row, i) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    li.className = i === 0
      ? 'cards-featured-card cards-featured-card-main'
      : 'cards-featured-card cards-featured-card-secondary';

    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const bodyCell = cells.find((c) => c !== imageCell) || cells[cells.length - 1];

    const picture = imageCell ? imageCell.querySelector('picture') : null;
    // A usable image has a real src — not empty, a data: URI, or a blob: placeholder.
    // Note: the importer can wrap a blob: placeholder inside a CDN URL
    // (e.g. https://cdn.example/.../blob:https://site/uuid?...), so match `blob:`
    // ANYWHERE in the src, not just as a prefix.
    const rawImg = picture ? picture.querySelector('img') : null;
    const rawSrc = rawImg ? (rawImg.getAttribute('src') || '') : '';
    const hasRealImage = !!rawImg
      && rawSrc !== ''
      && !rawSrc.startsWith('data:')
      && !rawSrc.includes('blob:');

    const kicker = bodyCell ? bodyCell.querySelector('p') : null;
    const heading = bodyCell ? bodyCell.querySelector('h1, h2, h3, h4, h5, h6') : null;
    const titleLink = heading ? heading.querySelector('a') : null;
    const href = (titleLink && titleLink.getAttribute('href'))
      || (bodyCell && bodyCell.querySelector('a') && bodyCell.querySelector('a').getAttribute('href'))
      || '#';

    const link = document.createElement('a');
    link.className = 'cards-featured-card-link';
    link.href = href;

    if (hasRealImage) {
      const optimized = createOptimizedPicture(rawImg.src, rawImg.alt, i === 0, [{ width: '750' }]);
      moveInstrumentation(rawImg, optimized.querySelector('img'));
      const imageWrap = document.createElement('div');
      imageWrap.className = 'cards-featured-card-image';
      imageWrap.append(optimized);
      link.append(imageWrap);
    } else {
      // No usable image (source served a lazy/placeholder asset). Flag the card
      // so CSS renders a branded gradient fallback instead of a bare black box.
      li.classList.add('cards-featured-card-no-image');
    }

    if (kicker) {
      kicker.className = 'cards-featured-card-kicker';
      link.append(kicker);
    }

    if (heading) {
      // flatten the nested title link into plain heading text
      heading.textContent = (titleLink ? titleLink.textContent : heading.textContent).trim();
      const textWrap = document.createElement('div');
      textWrap.className = 'cards-featured-card-text';
      textWrap.append(heading);
      link.append(textWrap);
    }

    li.append(link);
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
