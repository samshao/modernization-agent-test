// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Restructures the flat panel content (h3 + alternating picture/link pairs +
 * trailing "See All" link) into category groups, each holding a grid of post
 * cards plus a "See All" box — matching the Fortinet source layout.
 * @param {Element} content The panel's inner content cell
 */
function buildCategoryGroups(content) {
  const children = [...content.children];
  const groups = [];
  let current = null;
  let pendingImg = null;

  children.forEach((el) => {
    if (el.tagName === 'H3') {
      current = { title: el, cards: [], seeAll: null };
      groups.push(current);
      pendingImg = null;
      return;
    }
    if (!current) return;
    const picture = el.querySelector('picture');
    const link = el.querySelector('a');
    if (picture) {
      pendingImg = picture;
    } else if (link) {
      if (pendingImg) {
        current.cards.push({ picture: pendingImg, link });
        pendingImg = null;
      } else {
        current.seeAll = link;
      }
    }
  });

  content.textContent = '';

  groups.forEach((group) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'tabs-blog-group';

    group.title.classList.add('tabs-blog-cat');
    groupEl.append(group.title);

    const cards = document.createElement('div');
    cards.className = 'tabs-blog-cards';

    group.cards.forEach(({ picture, link }) => {
      const card = document.createElement('a');
      card.className = 'tabs-blog-card';
      card.href = link.getAttribute('href');
      card.append(picture);
      const body = document.createElement('div');
      body.className = 'tabs-blog-card-body';
      const title = document.createElement('p');
      title.className = 'tabs-blog-card-title';
      title.textContent = link.textContent;
      body.append(title);
      card.append(body);
      cards.append(card);
    });

    if (group.seeAll) {
      const seeAll = document.createElement('a');
      seeAll.className = 'tabs-blog-see-all';
      seeAll.href = group.seeAll.getAttribute('href');
      const label = document.createElement('span');
      label.textContent = group.seeAll.textContent;
      seeAll.append(label);
      cards.append(seeAll);
    }

    groupEl.append(cards);
    content.append(groupEl);
  });
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-blog-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-blog-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-blog-tab';
    button.id = `tab-${id}`;

    moveInstrumentation(tab.parentElement, tabpanel.lastElementChild);
    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
    moveInstrumentation(button.querySelector('p'), null);

    // restructure the panel content into category card groups
    const content = tabpanel.firstElementChild;
    if (content) buildCategoryGroups(content);
  });

  block.prepend(tablist);
}
