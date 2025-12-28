# The Bodyguard Group — Layout Demo

This demo provides a simple layout where the header and footer are permanent, and the main content is kept in separate page fragments under `pages/` and loaded into `index.html` dynamically.

Quick start (serve from the project root):

```bash
python -m http.server 8000
# then open http://localhost:8000/
```

Notes:
- The JS uses `fetch()` so opening `index.html` via `file://` may fail in some browsers — use a static server as shown above.
