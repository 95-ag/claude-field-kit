# Research

How to read web sources — especially reference pages — completely and reliably.

## Reading a reference page in full

- Check the whole page, not just the top — below-the-fold content is easy to miss. Scroll through
  the entire page (or capture its full height) before drawing conclusions from it.
- Client-rendered (SPA) pages: `WebFetch` returns only the app shell, so the real content comes back
  empty or unreadable. Fetch the raw source instead — often a GitHub (or similar) mirror, which
  `WebSearch` will surface — rather than the SPA URL.
