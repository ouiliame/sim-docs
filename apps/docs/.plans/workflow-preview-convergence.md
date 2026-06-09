# Workflow preview convergence

Goal: stop the docs' workflow preview from diverging from the real app. Branch
scope: the docs-side work (Tier 0/1) + the extraction proposal (Tier 2).

## How the app represents workflows (canonical facts)

- **Shape:** `WorkflowState` from `@sim/workflow-types` (types-only package, no
  runtime deps): `blocks: Record<id, BlockState>` — `type`, `name`, `position`,
  `subBlocks: Record<id, { value }>`, `outputs`, `triggerMode`, container data —
  plus ReactFlow `edges` and `loops`/`parallels` configs.
- **Export:** `exportWorkflowToJson` (`use-export-workflow`) emits sanitized
  workflow JSON in this shape from the editor.
- **The app has two preview renderers already:**
  1. `apps/sim/app/workspace/[workspaceId]/w/components/preview/preview-workflow/`
     — the real one (template/version previews). Renders `WorkflowState`,
     derives canvas rows via the block registry + `getDisplayValue` (imported
     from the editor's `workflow-block.tsx`), uses `useWorkflowMap` (React
     Query), `useVariablesStore`, app theme tokens.
  2. `apps/sim/app/(landing)/components/landing-preview/landing-preview-workflow/`
     — the landing page's hand-authored copy (the ancestor of the docs port;
     same file names).
- **Why docs can't import the real one today:** it's app-internal — full block
  registry (`getBlock` from `@/blocks`; block files import app lib, e.g.
  `getScopesForService`), app stores/queries/routing, app CSS vars. The docs
  pipeline AST-parses block files for exactly this reason.

## Tier 0 — provenance (this branch, trivial)

Header comments in each docs preview file naming the app source it mirrors:
- `preview-block-node.tsx` ← editor `workflow-block.tsx`
- `preview-container-node.tsx` ← `subflows/subflow-node.tsx`
- `output-bundle.tsx` ← terminal `output-panel/structured-output.tsx`
- `block-inspector.tsx` ← editor right-hand panel
- `workflow-preview.tsx` / `workflow-data.ts` ← `(landing)/landing-preview-workflow/`

## Tier 1 — data convergence (this branch, ~hours)

1. Add `@sim/workflow-types` to `apps/docs`.
2. Write `fromWorkflowState(state: WorkflowState): PreviewWorkflow`:
   - block → name/type/position; bgColor + visible rows from
     `BLOCK_DISPLAY_SPECS` (titles) filled with `subBlocks[id].value`
   - container blocks (loop/parallel) → `size`/`parentId`
   - edges pass through; trigger blocks get `hideTargetHandle`
3. Authoring flow becomes: build the example workflow in the editor → export
   JSON → drop in `apps/docs/components/workflow-preview/examples/` → render.
   Hand-authored `PreviewWorkflow` stays supported but is no longer the default.

## Tier 2 — code convergence (proposal for the app team, separate PR)

Extract the real renderer into `packages/workflow-preview`:
- props-only data (no stores/queries/routing) — `WorkflowState` in, canvas out
- split the registry's *display* facts (icon, color, visible sub-blocks per
  state) from its runtime imports, so the package doesn't drag app lib
- parameterize theme tokens
- consumers: editor template/version previews, the landing page, the docs —
  three currently-divergent copies become one.

Blast radius: touches `workflow-block.tsx` (`getDisplayValue`) and the
registry's import graph. Needs an apps/sim owner; this doc is the ask.
