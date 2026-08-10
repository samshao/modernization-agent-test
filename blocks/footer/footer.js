import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// fortinet.com's own icon per platform name (self-hosted, fetched from its DAM
// the same way carousel-story-dots.svg and the footer-legal badges were —
// matched by the link's own visible text, not its href, since "X"/"Twitter"
// share one icon and this is simpler than pattern-matching every platform's
// possible URL shape).
const SOCIAL_ICONS = {
  linkedin: { file: 'footer-social-linkedin.svg', label: 'LinkedIn' },
  x: { file: 'footer-social-twitter.svg', label: 'X' },
  twitter: { file: 'footer-social-twitter.svg', label: 'X' },
  youtube: { file: 'footer-social-youtube.svg', label: 'YouTube' },
  instagram: { file: 'footer-social-instagram.svg', label: 'Instagram' },
  facebook: { file: 'footer-social-facebook.svg', label: 'Facebook' },
  rss: { file: 'footer-social-rss.svg', label: 'RSS' },
};

function fetchIcon(el, file) {
  fetch(`${window.hlx.codeBasePath}/icons/${file}`)
    .then((resp) => (resp.ok ? resp.text() : ''))
    .then((svg) => { el.innerHTML = svg; })
    .catch(() => {}); // decorative only; leave empty on failure
}

/**
 * fortinet.com's "Connect With Us" column ends with a row of icon-only
 * social links (LinkedIn, X, YouTube, Instagram, Facebook, RSS) in their own
 * list, separate from the column's own text links above them. Authored here
 * as plain links naming the platform (e.g. "LinkedIn") anywhere in the given
 * column, since that's the only signal available — this finds them by that
 * visible text, moves them into their own list, and swaps in the real icon.
 * @param {Element} column the column to search for and relocate social links within
 */
function buildSocialRow(column) {
  const socialLinks = [...column.querySelectorAll('a')]
    .filter((a) => a.textContent.trim().toLowerCase() in SOCIAL_ICONS);
  if (!socialLinks.length) return;

  const ul = document.createElement('ul');
  ul.className = 'footer-social';

  socialLinks.forEach((a) => {
    const { file, label } = SOCIAL_ICONS[a.textContent.trim().toLowerCase()];
    const oldLi = a.closest('li');
    a.textContent = '';
    a.setAttribute('aria-label', label);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    const li = document.createElement('li');
    li.append(a); // moves `a` out of oldLi
    ul.append(li);
    if (oldLi && !oldLi.children.length) oldLi.remove();
    fetchIcon(a, file);
  });

  column.append(ul);
}

/**
 * fortinet.com pairs an email signup form with the "Connect With Us" column
 * — not expressible as authored link content (it's a real form, not a
 * link), so built here instead. No real subscription backend exists for
 * this site yet: fortinet.com posts this to its own Eloqua marketing-
 * automation account (site/campaign/form IDs baked into hidden fields),
 * which isn't something this site has or should submit to. Placeholder
 * behavior only, pending a decision on where this should actually go.
 * @param {Element} column the column to prepend the form to
 */
function buildEmailForm(column) {
  const form = document.createElement('form');
  form.className = 'footer-subscribe-form';
  form.innerHTML = `
    <div class="footer-subscribe-control">
      <label for="footer-subscribe-email">Enter Email Address</label>
      <input type="email" id="footer-subscribe-email" name="emailAddress" placeholder="Enter Email Address" required>
      <button type="submit" aria-label="Submit"></button>
    </div>
    <p class="footer-subscribe-status" role="status" hidden>Subscription successful!</p>
    <div class="footer-subscribe-consent">
      <label for="footer-subscribe-consent">
        <input type="checkbox" id="footer-subscribe-consent" name="consent" required aria-label="Consent agreement">
      </label>
      <p>I want to receive news and product emails. Read our <a href="https://www.fortinet.com/corporate/about-us/privacy">privacy policy</a>.</p>
    </div>
  `;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.querySelector('.footer-subscribe-status').hidden = false;
    form.reset();
  });

  column.prepend(form);
  fetchIcon(form.querySelector('button[type="submit"]'), 'footer-submit-arrow.svg');
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const connectHeading = [...footer.querySelectorAll('h3')]
    .find((h) => h.textContent.trim().toLowerCase() === 'connect with us');
  if (connectHeading) {
    const connectColumn = connectHeading.parentElement;
    buildSocialRow(connectColumn);
    buildEmailForm(connectColumn);
  }

  block.append(footer);
}
