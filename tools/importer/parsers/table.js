/* eslint-disable */
/* global WebImporter */
/**
 * Parser for `table` block (Block Collection convention).
 * Source: Fortinet press-release spec comparison table
 *         (div.C05-Container:nth-of-type(2) table).
 *
 * Follows the Table convention: row 1 = block name + variant; each subsequent
 * row = one data row; cells hold data points / headers / labels. A raw <table>
 * in EDS content is otherwise auto-named from its first cell ("Specification"),
 * producing an unstyled div block — this parser promotes it to the styled
 * `table (bordered)` block. Header cells keep <strong> so header rows read
 * clearly. Empty cells are preserved to keep column alignment (the source has
 * one empty Threat Protection cell).
 */
export default function parse(element, { document }) {
  const table = element.matches && element.matches('table') ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  Array.from(table.querySelectorAll('tr')).forEach((tr) => {
    const rowCells = Array.from(tr.children).map((cell) => {
      const text = cell.textContent.trim();
      if (cell.tagName === 'TH') {
        const strong = document.createElement('strong');
        strong.textContent = text;
        return strong;
      }
      const span = document.createElement('span');
      span.textContent = text;
      return span;
    });
    if (rowCells.length) cells.push(rowCells);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // 'bordered' variant → clear grid lines for a dense comparison spec table.
  const block = WebImporter.Blocks.createBlock(document, { name: 'table (bordered)', cells });
  table.replaceWith(block);
}
