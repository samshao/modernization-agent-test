import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-feature
 * Authored rows: [ icon-cell ][ body-cell: label <p><strong>, <h3><a>Title, <p>desc ]
 * Rendered card: colored header bar (label) on top, then icon, product title, description.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-feature-card-image';
      } else {
        div.className = 'cards-feature-card-body';
      }
    });

    const body = li.querySelector('.cards-feature-card-body');
    if (body) {
      // Lift the category label (<p><strong>…</strong></p>) into a top header bar.
      const strong = body.querySelector('strong');
      const label = strong ? strong.textContent.trim() : '';
      const labelParagraph = strong ? strong.closest('p') : null;
      if (labelParagraph) labelParagraph.remove();

      if (label) {
        const header = document.createElement('div');
        header.className = 'cards-feature-card-header';
        const span = document.createElement('span');
        span.textContent = label;
        header.append(span);
        li.prepend(header);
      }
    }

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
