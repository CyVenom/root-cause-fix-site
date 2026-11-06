# Root-Cause-Fix: website

The landing page and interactive demo for [Root-Cause-Fix](https://github.com/CyVenom/Root-Cause-Fix), a tool that finds why a deploy failed and verifies every quoted piece of evidence before it answers.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## What's here

| File | Purpose |
|---|---|
| `index.html` | The page |
| `styles.css` | Styling |
| `app.js` | Demo, evidence check, redaction playground |
| `data.js` | The 9 failure cases (real logs and diffs from the engine's eval suite) |
| `vercel.json` | Security headers and clean URLs |

## About the demo

The logs and diffs come from the engine's eval cases. The answers shown are reference answers for each case. **The page never calls a model.** The evidence check and the redaction playground run in your browser, using the same logic as the engine.

## Run locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Deploy on Vercel

Import this repo. Leave Framework Preset as **Other**, with no build command and no output directory. Deploy.

## Keeping it in sync

`data.js` is generated from `packages/evals/cases` in the engine repo. If you add eval cases there, regenerate the data to match.

## License

MIT, same as the engine.
