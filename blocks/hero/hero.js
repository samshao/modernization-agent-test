/**
 * Hero block
 * Purely visual. The only behavioral tweak: tag the standalone primary CTA
 * (a paragraph whose sole child is the link) so it can be styled as a button,
 * without catching inline links that sit inside a sentence (e.g. "Privacy Notice").
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  block.querySelectorAll('p').forEach((p) => {
    const link = p.querySelector(':scope > a');
    if (link && p.childNodes.length === 1 && p.firstChild === link) {
      link.classList.add('hero-cta');
    }
  });
}
