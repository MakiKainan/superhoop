# Phathouse font

`src/index.css` declares an `@font-face` for **Phathouse** — the House Industries
face used in the NBA Street logo — and `.font-street` prefers it.

The font file is **not** committed to this repo. Until you add one, every
`.font-street` element silently falls back to Bangers (loaded from Google
Fonts), so the app looks fine and nothing breaks.

## Adding it

Put the file here, named exactly one of:

```
public/fonts/Phathouse.woff2   <- preferred
public/fonts/Phathouse.ttf     <- also works
```

Hard refresh (Ctrl+Shift+R) and it takes effect. No code changes needed.

If you only have a `.ttf`, converting to `.woff2` cuts it to roughly a third of
the size. Any offline converter works; it is not required.

## Licensing

Phathouse is a commercial release from House Industries (© 1993). The many
"free download" sites hosting it are not authorised redistributors.

For a non-commercial university coursework demo this is low-risk, but it is
your call to make, not something this repo decides for you. If SuperHoop ever
gets shown publicly, published, or entered into anything commercial, buy the
licence from House Industries — or just delete the file and keep Bangers, which
is SIL Open Font Licensed and free for any use.

## Wanting Phathouse on the score numerals too

By default the big TIME / SCORE digits use **Anton**, not Phathouse. That is
deliberate: Anton stays legible across a room through a projector, and heavy
graffiti faces tend not to. If you want Phathouse there anyway, edit
`.font-score` in `src/index.css`:

```css
.font-score {
  font-family: 'Phathouse', 'Anton', 'Impact', sans-serif;
}
```
