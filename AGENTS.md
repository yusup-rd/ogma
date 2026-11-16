# Ogma contributor instructions

These instructions apply throughout the repository. Do ongoing development on `dev`. Use [PLAN.md](PLAN.md) for product scope and [ARCHITECTURE.md](ARCHITECTURE.md) for technical decisions.

## TypeScript and components

- Use strict TypeScript for `.ts` and `.tsx`. Avoid `any` and type-check suppressions. Validate runtime data at app boundaries.
- Declare React components as `const ComponentName = () => { ... }` with a block body and explicit return. Define `interface ComponentNameProps` after imports and before implementation. Reuse shared models. Follow framework-required declarations for special entry points.
- Read the relevant official documentation before changing an API or build configuration. Use `package.json` and the committed Yarn lockfile as the source of truth for installed versions.
- Use the dependencies already selected for the current milestone. Add further dependencies only when a feature needs them. Reuse existing components and utilities, keep one library per responsibility, and remove unused code and direct dependencies after checking dynamic references and build tooling.

## File organization and code splitting

- Organize code by feature and responsibility. In `apps/web/src`, keep routes, layouts, and framework entry points in `app/`. Keep UI components under `components/`, hooks under `hooks/`, and non-UI models and helpers under `lib/`. Use feature folders within those directories when related files benefit from grouping. Create folders as they gain a real consumer.
- In `apps/api/src`, group Nest modules by feature and keep controllers, services, request schemas, and data access within their owning module. Put shared contracts in `packages/contracts` when both apps need them.
- Follow established software engineering practices and project coding standards. Keep modules focused, dependencies explicit, and interfaces narrow. Reuse existing logic, validate inputs at boundaries, and handle failures where they can be acted on.
- Use route-level code splitting and lazy-load heavy client features such as document previews when first needed. Keep client components and providers scoped to the parts of the tree that need them. Verify the loading and error states of deferred features.

## Antiplagiarism and Unique architecture guardrails

- **No boilerplate signatures.** Adapt starter kits and optional folder structures to Ogma's features. Give project-specific hooks and utilities names that describe their roles. Preserve required framework conventions and third-party attribution.
- **Unique UI and UX identity.** Use Ogma's visual tokens, spacing system, and component hierarchy to give the editor a recognizable identity. Design custom interactions where they clarify the workflow or provide useful feedback.
- **Algorithmic diversification.** Write original helpers and state models for Ogma-specific behavior. Derive the implementation from the domain requirements and use the simplest design that satisfies them. Reuse established libraries for standard behavior.

## Tailwind and UI

- Use Tailwind CSS 4 and configure theme tokens in the Next.js global stylesheet. Use shadcn-style components with Radix primitives and Tailwind, and Sonner for notifications. Add primitives only as needed.
- Prefer parent `gap-*` for sibling spacing and `size-*` for equal width and height. Prefer built-in utilities, dynamic numeric spacing, the standard typography scale, and preset Tailwind breakpoints. Use arbitrary values for dimensions that require them, such as a print measurement.
- Use `dvh` and `dvw` for viewport-based dimensions. Keep class names statically discoverable with complete conditional classes or data and ARIA variants. Use the Prettier Tailwind plugin for class ordering.
- Keep app chrome light, with Inter for UI typography, semantic color tokens, and a deep purple accent. Keep document fonts, palettes, and print dimensions scoped to the CV renderer. Use validated CSS custom properties for user-controlled document values. Keep global defaults, print rules, and complex effects in CSS.
- Apply concentric corners where rounded containers have inset rounded children. Calculate outer radius as inner radius plus the inset and outer border. Recheck the relationship when the inset changes at a breakpoint.
- Use keyboard-accessible controls for disclosures, selects, tabs, sorting, and dialogs. Preserve focus, show meaningful statuses inline, and give touch and keyboard users the same actions as pointer users.
- Give controls immediate press feedback. Prefer short, interruptible property-specific transitions for occasional pointer actions. Anchor popovers to their triggers, keep frequent edits and keyboard actions immediate, and respect reduced motion and transparency preferences. Use springs only when a direct manipulation gesture benefits from velocity and interruption.

## Data and verification

- Preserve pinned library revisions, local overrides, and immutable checkpoints across editor changes. Keep live preview, exports, and analysis on the same resolved document model.
- Keep personal content private. Use synthetic data in fixtures and screenshots. Keep credentials and provider calls server-side. Keep CV text and job descriptions out of logs.
- Keep changes within the active milestone and preserve existing behavior. Keep temporary scripts and screenshots outside the repo. Preserve required third-party license notices.
- Run the relevant formatting, lint, type-check, test, and build scripts after implementation changes. Verify editor changes on desktop and mobile with keyboard and touch where applicable. For document changes, check pagination, text extraction, and the affected export formats using representative fixtures.
