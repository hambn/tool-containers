# Web UI

This directory builds the repository catalog and every tracked tool and example README
into static HTML. The output in `dist/` needs no application server and can be served by
GitHub Pages, a container, or any static file host.

## Build configuration

The build accepts two independent environment variables:

| Variable | Purpose | Default |
|---|---|---|
| `SITE_URL` | Public URL used by canonical links, structured data, the sitemap, and `robots.txt` | `https://hambn.github.io/tool-containers` |
| `BASE_PATH` | Optional prefix added to internal links and font URLs | Empty |

Keep `BASE_PATH` empty when the site is served at `/`, including a GitHub Pages custom
domain:

```bash
SITE_URL=https://docs.example.com npm run build
```

Set both values when the site is mounted below a path:

```bash
SITE_URL=https://example.com/tool-containers \
BASE_PATH=/tool-containers \
npm run build
```

For a local or container-served build at the domain root:

```bash
SITE_URL=http://localhost:4173 npm run build
python3 -m http.server 4173 --directory dist
```

`SITE_ORIGIN` remains a compatibility alias for `SITE_URL`. New deployments should use
`SITE_URL`.

## Commands

Install dependencies, build the static files, and verify the generated route inventory:

```bash
npm ci
npm run build
npm test
```
