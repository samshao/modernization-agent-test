# Site nav & footer source

Source documents for the site-wide header (`/nav`) and footer (`/footer`)
fragments used by `blocks/header/header.js` and `blocks/footer/footer.js`.

These are the authoritative source for the fragments published to Document
Authoring (`admin.da.live`) and served at `/nav.plain.html` and
`/footer.plain.html`. The header/footer decorators fetch these via
`loadFragment()`; if they are missing, the decorators throw and the
header/footer do not render.

To update: edit here, then upload + preview + publish to DA:

    curl -X POST -F "data=@nav.html;type=text/html" \
      "https://admin.da.live/source/samshao/modernization-agent-test/nav.html"
    # then POST to admin.hlx.page /preview and /live for /nav and /footer

- `nav.html`   -> published as `/nav`   (brand / sections / tools)
- `footer.html`-> published as `/footer` (columns + copyright)
