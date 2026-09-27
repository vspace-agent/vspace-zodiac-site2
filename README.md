# V🌔Space Zodiac — Site 2 / Markdown Loader

Static local browser instrument. No backend, account, cloud upload, database, or AI runtime.

## Flow

`.md` → local parser → schema validation → `window.VSPACE_BOOK` content model → the same Site 1 r4 V🌔Space runtime.

The selected Markdown remains in the visitor's browser memory and is not uploaded.

## Accepted content grammar

```md
# BOOK TITLE

*Optional subtitle*

> Optional introductory quotation.

## CHAPTER --- Motive question

### SUB-UNIT

#### BRIEF
Short content.

#### DETAILED
Long content.
```

Runtime validation requires 1–12 chapters and 2–16 sub-units per chapter. Every sub-unit requires both BRIEF and DETAILED.

## Use

Open `index.html`, choose/drag a `.md` file or use Paste instead. After validation, the loader disappears and the V🌔Space experience begins.
