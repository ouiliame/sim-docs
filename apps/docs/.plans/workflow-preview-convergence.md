# RFC: `@sim/workflow-preview` — a dependency-free workflow renderer for the monorepo

**Ask:** extract a shared, props-only workflow renderer into `packages/` so docs,
Academy, the landing page, and the app's own previews stop maintaining divergent
copies. Owner needed on the apps/sim side; the docs team will be the first
migration and has already done the groundwork below.

## The problem: four renderers, one canvas

| Copy | Where | Data source | Why it can't be shared today |
| --- | --- | --- | --- |
| **Editor preview** (the real one) | `apps/sim/app/workspace/.../w/components/preview/preview-workflow/` | live `WorkflowState` | imports `getBlock` from `@/blocks` (the full 240-block registry, whose block files import app lib, e.g. oauth utils), `getDisplayValue` from the editor's `workflow-block.tsx`, `useWorkflowMap` (React Query), `useVariablesStore` (Zustand), `useParams` (Next routing), app CSS vars |
| **Landing page** | `apps/sim/app/(landing)/.../landing-preview-workflow/` | hand-authored | a fork of the canvas styling; drifts silently |
| **Docs** | `apps/docs/components/workflow-preview/` | hand-authored `PreviewWorkflow` | a port of the landing fork, since hand-matched to the canvas |
| **Hero/inspector facsimiles** | `apps/docs` (`BlockPreview`, `OutputBundle`, `BlockInspector`) | hand-authored specs | same story, per-surface |

Every UI change to the canvas (colors, handles, container chrome) silently
strands three copies. The docs reorg spent a full cycle re-matching: container
subflows, per-branch condition/router handles, tool chips, the run inspector,
and a light/dark token mirror — all hand-ported, all re-divergeable.

## What the docs copy has already proven (and pre-aligned)

The docs renderer is the de-facto prototype of the package API:

- **Read-only ReactFlow canvas** from a plain data object: blocks, edges,
  containers (Loop/Parallel subflows with the internal Start pill), tool chips,
  per-branch source handles, error ports.
- **Handle ids already match the app's representation verbatim** —
  `condition-<id>` per condition row, `router-<routeId>` ports — verified
  against `workflow-block.tsx` and the executor's DAG tests, so real exported
  edges render with zero translation.
- **Theme-parameterized**: all chrome flows through `--wp-*` tokens whose
  light/dark values mirror `apps/sim/app/_styles/globals.css`.
- **Interaction extras** Academy will want for interactive examples:
  highlight/dim a block or edge, selection ring, click-to-inspect read-only
  block inspector, full-screen lightbox with zoom/pan.
- ~40 hand-authored example workflows in use across the docs reference.

What it can't do without the package: derive any of this from a **real**
workflow. Rows, icons, colors, and branch labels are hand-authored because the
display knowledge lives inside the app registry's import graph.

## How the app represents workflows (canonical facts)

- **Shape:** `WorkflowState` from `@sim/workflow-types` (types-only package, no
  runtime deps): `blocks: Record<id, BlockState>` — `type`, `name`, `position`,
  `subBlocks: Record<id, { value }>`, `outputs`, `triggerMode`, container data —
  plus ReactFlow `edges` and `loops`/`parallels` configs.
- **Export:** `exportWorkflowToJson` (`use-export-workflow`) emits sanitized
  workflow JSON in this shape from the editor.
- **Edges:** `sourceHandle` carries the canvas handle ids (`condition-<id>`,
  `router-<routeId>`, `error`, `source`, loop/parallel continue/exit handles).

## The package

`packages/workflow-preview` (name negotiable):

1. **Props-only API.** `WorkflowState` in, canvas out. No stores, no React
   Query, no routing, no network. Anything live (workflow-name resolution for
   workflow-selector subBlocks, variables) is passed in by the consumer or
   omitted.
2. **Dependency-free in the sense that matters:** peer deps `react` +
   `reactflow` only. Animation optional (CSS or an injectable wrapper) so
   framer-motion isn't dragged in. CI-enforced with a prune-graph check, the
   same mechanism that keeps `apps/realtime` clean.
3. **A registry-free display layer.** The hard part. The registry's *display
   facts* — icon, color, which subBlocks show on canvas in which state, and
   `getDisplayValue` (today defined inside the editor's `workflow-block.tsx`) —
   must be consumable without executing block files (they import app lib).
   Two viable shapes, app team's call:
   - **(a) `@sim/block-display`:** split display facts out of `BlockConfig`
     into a pure-data module per block that both the app registry and the
     package import. Single source, no codegen.
   - **(b) codegen:** generate the display-facts module from the registry at
     build time (the docs pipeline already AST-parses block files for exactly
     this reason — icons + display specs).
4. **Theme tokens as a contract.** The package ships the token names; each
   consumer maps them to its theme (the app to its globals, docs/Academy to
   their mirror).

## Consumers, day one

- **App:** template gallery, version-snapshot preview, diff preview (replaces
  the editor-preview component's rendering core; live-state lookups become
  props).
- **Landing:** replaces its fork.
- **Docs:** replaces `apps/docs/components/workflow-preview` rendering; docs
  keeps its authoring affordances (lightbox, inspector) as thin wrappers or
  upstreams them.
- **Academy:** interactive examples — render a real exported workflow, then
  highlight/step through it per lesson. This is the consumer that makes
  "interactive" a requirement, not a nice-to-have.

## Migration sketch

1. **Phase A — display layer** (app team): extract or generate the
   registry-free display facts; the editor consumes it too, so it cannot drift.
2. **Phase B — renderer** (app team + docs): lift the editor preview's
   rendering core into the package behind the props-only API; port the docs
   extras (containers, branch handles, highlight, inspector) upstream.
3. **Phase C — consumers**: app previews → landing → docs swap their copies
   for the package. Each swap deletes a fork.
4. **Phase D — docs/Academy authoring**: examples become exported workflow
   JSON (`exportWorkflowToJson` → drop in the repo → render), with a small
   `fromWorkflowState()` shim until Phase B lands (this branch is staged for
   exactly that).

## Acceptance criteria

- Importable from any monorepo app with no transitive `apps/sim` imports
  (CI prune-graph check).
- Renders an `exportWorkflowToJson` payload 1:1 with the canvas — same
  handles, same rows, same colors — light and dark.
- No runtime data fetching; deterministic for SSG (docs/Academy prerender).
- The editor's own preview uses it, so canvas changes break the package's
  tests, not the downstream copies.

## Why now

- Three forks already exist and a fourth consumer (Academy) is planned.
- The docs cycle just demonstrated the drift cost concretely (a full session
  of re-matching) and pre-paid part of the work: AST-aligned handles, theme
  tokens, the interaction layer, and a working props-only API shape.
- `@sim/workflow-types` proves the pattern: types-only, zero-dep, shared
  everywhere.
