# File structure

The repository has three meaningful levels: **category → tool → files**.

## Placeholders

| Placeholder | Means |
|-------------|-------|
| `<owner>` | registry namespace, such as a GitHub user or organization |
| `<category>` | top-level catalog directory, such as `ai`, `ci`, or `sandboxes` |
| `<tool>` | one self-contained image project inside a category |
| `<variant>` | one buildable image profile, such as `standard`, `minimal`, or `full` |
| `<upstream>` | upstream tool packaged by the image |
| `<version>` | resolved upstream version of `<upstream>` |

## Tree

```text
tool-containers/
├── README.md                       # root catalog
├── AGENTS.md                       # points to .agents/README.md
├── CLAUDE.md                       # points to .agents/README.md
├── .agents/                        # canonical agent workspace
├── .github/workflows/
│   └── <category>-<tool>.yml       # one workflow per tool
└── <category>/                     # e.g. ai, ci, sandboxes
    └── <tool>/                     # one self-contained image project
        ├── README.md
        ├── images/
        │   └── <variant>/Dockerfile
        └── deployment/
            ├── docker/
            ├── docker-compose/
            ├── podman/
            ├── docker-swarm/
            ├── kubernetes/
            └── helm/
```

## Rules

- A category is a top-level catalog directory; add categories as the catalog grows.
- A tool owns its README, image variants, and deployment examples.
- Every tool has `README.md`, `images/`, and `deployment/`.
- Each variant is a directory under `images/` with its own Dockerfile.
- Each deployment platform has runnable examples and a README.
- CI stays in `.github/workflows/<category>-<tool>.yml`; one workflow serves one tool.

## Adding a tool

Copy the shape of an existing tool, rename it, edit every image and deployment file,
add the matching workflow, and add exactly one row to the root README catalog.
