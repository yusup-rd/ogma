# Ogma contributor instructions

These instructions apply throughout the repository. Do ongoing development on `dev`. Use [PLAN.md](PLAN.md) for product scope and [ARCHITECTURE.md](ARCHITECTURE.md) for technical decisions.

## Commit messages

- Use scoped Conventional Commits for every commit: `<type>(<scope>): <summary>`.
- Choose a type that describes the change, such as `feat`, `fix`, `style`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, or `revert`. Use a scope that names the affected feature or area, such as `library`, `editor`, `exports`, `api`, or `contracts`.
- Keep the summary concise and imperative, and group related changes into focused commits. Examples: `fix(library): preserve archived drafts`, `feat(editor): add icon previews`, and `docs(agents): clarify commit conventions`.

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

## Animation & Motion Design Preferences

### Scheduling and scope

- Schedule dedicated animation and motion polish after the functional roadmap and release checks in `PLAN.md` are complete. During the functional milestones, apply the existing immediate-feedback, accessibility, and responsive-editing rules under **Tailwind and UI** and record broader motion improvements for the future phase.
- When the motion phase begins, apply these standards across new components, existing interfaces, interactions, navigation, and interface refactoring. Choose platform-appropriate techniques compatible with the existing stack, architecture, and conventions. Select implementation tools according to the interaction's needs.
- Apply explicit project requirements when they refine these general standards, while preserving motion quality, coordination, accessibility, and correct application state.

### Core philosophy

- Treat purposeful motion as a fundamental part of interface quality. Prioritize smooth, fluid, clean movement, natural and predictable transitions, meaningful feedback, and visual continuity.
- Keep the motion language consistent, subtle, and restrained. Every animation must have a clear purpose and support a cohesive, responsive experience.

### Unified motion and coordinated layout transitions

- Plan the interface as one coordinated motion system. Related components must share a coherent relationship between movement, timing, and state.
- When an interaction animates dimensions, position, visibility, or layout participation, coordinate the affected surrounding elements with that change. An expanding accordion should grow while pushing following sections smoothly. Collapsing it should restore their positions in the same coordinated transition.
- Apply the same spatial continuity to expanding cards, inline panels, inserted or removed content, and responsive layout changes where an appropriate transition preserves orientation. Keep the existing immediate-editing rules applicable to frequent interactions.

### Animation coverage

Consider the following patterns wherever they improve usability, continuity, or feedback. Choose the treatment that fits the interaction and platform.

- Dialogs and modals use coordinated enter and exit transitions, with opacity and scale where appropriate.
- Backdrops change opacity in sync with their associated overlay.
- Accordions and collapsible containers coordinate expansion and collapse with the surrounding layout.
- Dropdown menus use anchored fade, scale, or positional transitions, coordinated with associated indicators.
- Tooltips use subtle fade or scale transitions.
- Tabs coordinate content changes and indicator movement.
- Buttons, icons, checkboxes, switches, and other controls use appropriate state transitions and press feedback.
- Toasts and notifications coordinate entry, exit, and changes in position.
- Pages and screens use transitions appropriate to their navigation relationship.
- Shared content between screens may use shared-element transitions to preserve identity and orientation.
- Lists and collections coordinate item entry, removal, and resulting layout changes.
- Loading indicators may loop while work is pending, and progress indicators follow actual progress.
- Drag-and-drop interactions follow the gesture and may use physical spring behavior within the existing spring-use rule.
- Bottom sheets and drawers use contextual slide transitions and gesture-driven springs where appropriate.
- Scroll-related interactions may use collapsing headers, sticky transitions, progressive reveals, or scroll-linked movement when they clarify the experience.

### Synchronized component animations

- Coordinate the visual elements of a compound interaction. A modal and its backdrop must enter and leave together, with the backdrop changing gradually as the modal moves into or out of view.
- Apply this coordination to navigation menus and backdrops, drawers and surrounding content, dropdown indicators, expandable containers, and associated overlays. Align their timing and interruption behavior.

### Timing, easing, and motion physics

- Use coherent timing and motion characteristics for similar interactions. Select durations and curves according to interaction frequency, movement, scale, and purpose.
- Prefer natural acceleration and deceleration. Keep small feedback interactions fast and give larger spatial transitions sufficient time to communicate their relationship.
- Use easing for controlled, predictable transitions. Apply the existing restriction on springs to direct manipulation that benefits from velocity and interruption. Keep bouncing and overshoot restrained and purposeful.

### Small interactions and feedback

- Give small state changes appropriate treatment, including press and release, icon changes, input validation, copy confirmation, hover, and focus.
- Reflect the actual interaction result immediately. Keep controls available during motion and preserve clear focus and validation feedback throughout the transition.

### Navigation and scroll-based motion

- Match navigation motion to the relationship between source and destination. Use shared-element transitions for an item and its details, subtle fades for unrelated screens, and directional transitions when they communicate hierarchy.
- Coordinate navigation and tab changes with their content. Use scroll-related motion when it supports orientation, reading, or interaction, with appropriate accessibility alternatives.

### Staggered motion

- Use selective staggered timing for related lists, cards, menus, or grouped content when it clarifies hierarchy or progression.
- Keep delays small and preserve interaction with elements as soon as they are available.

### Shared animation architecture

- Inspect the existing architecture and motion conventions before choosing where shared animation logic belongs.
- Centralize reusable motion tokens, durations, easing curves, spring configurations, transition presets, utilities, primitives, and common behaviors where they have real consumers. Keep the system discoverable and consistent with existing feature boundaries and naming conventions.
- Reuse shared configurations for repeated behaviors. Keep component-specific logic close to its component when that is more maintainable, and keep abstractions proportionate to actual reuse.

### Interruption and state consistency

- Always transition toward the latest intended application state. Interrupt, reverse, replace, or redirect active motion as new input arrives.
- Handle rapid sequences predictably, including expanding an accordion, collapsing it before completion, and immediately opening another. Resolve affected elements to the latest correct layout.
- Keep modal, drawer, dropdown, and other overlay states consistent during rapid opening and closing. Prevent competing animations on the same properties and visual states that become stuck between endpoints.
- Clean up obsolete animations and associated resources. Completion callbacks must respect subsequent state changes and avoid applying stale effects.
- Prioritize state correctness and responsiveness throughout the animation lifecycle.

### Performance and accessibility

- Maintain smooth, stable frame rates using efficient properties and platform capabilities. Limit unnecessary layout recalculations, rendering overhead, and simultaneous animations.
- Stop unnecessary motion for hidden or irrelevant elements and clean up resources when an interaction or component ends.
- Respect operating-system reduced-motion preferences, reduced-transparency preferences, and other accessibility settings. Provide immediate or reduced-motion alternatives that retain state feedback and usability.
- Verify that motion preserves focus, keyboard and touch access, reading order, and responsiveness.

### Implementation and verification

1. Inspect existing architecture, animation utilities, and interaction conventions.
2. Reuse the established motion system. Introduce shared configuration or primitives only where current interactions justify them.
3. Select a purposeful motion pattern and account for surrounding layout changes.
4. Define timing, easing, gesture behavior, and accessibility alternatives.
5. Design interruption, state consistency, and resource cleanup from the start.
6. Verify compound interactions stay synchronized, including during rapid reversals and repeated input.
7. Check performance, focus, keyboard and touch behavior, responsive layouts, and reduced-motion behavior before completing the motion work.

## Caching preferences

- Use TanStack Query for reusable client reads of server data. Centralize query keys, options, freshness durations, and mutation cache helpers in `apps/web/src/lib/queries`; keep feature hooks under `hooks/`. Check existing queries before adding a request or another cache.
- Cache validated raw data, including timestamps. Include every response-changing input in the key: archive/filter state, resource ID, and document revision for derived page counts and thumbnails. Add owner or tenant identity to keys if multiple identities can share a client in the future.
- Choose freshness deliberately: lists and Library status 1 minute, checkpoint history 30 seconds, template catalog 1 hour, saved thumbnails 5 minutes. Page counts are immutable for their revision. Retain inactive private document results for at most 5 minutes and other ordinary reads for 10 minutes. Explain deviations alongside query options.
- Hydrate authenticated server reads with a per-request QueryClient. Keep one provider across client navigation; never share a server QueryClient between requests. Preserve server authentication checks and private, no-store HTTP responses. Do not persist CVs or Library data in browser storage. Clear and cancel client queries on sign-out or an expired session.
- After acknowledged writes, cancel competing reads before updating cached data and invalidate all affected lists/status/derived results. Use revision keys to isolate derived results. Test create, save, lock, archive, restore, delete, conflict, and sign-out paths when they affect cached data.
- Pass query cancellation signals to fetch. Retry only bounded transient reads. Keep writes and downloads free of automatic retries. Preserve the editor's ordered autosave and latest-preview queues; never let a background query overwrite unsaved edits, pinned Library revisions, or checkpoints. Keep live previews, exports, authentication, and local form state outside reusable read caches.
- Keep cached content visible during background refreshes and offer an actionable refresh error. Use skeletons for genuinely missing or not-yet-rendered content. Verify cache reuse, stale refresh, invalidation, cancellation, and session isolation with network requests as well as visible UI.

## Formatting preferences

- Check `apps/web/src/lib/formatUtil.ts` before formatting dates, times, numbers, percentages, or document metadata. Reuse its helpers or add a shared helper there instead of duplicating presentation formatting in components.
- Keep raw values in models and query caches. Format at the display boundary. Use an explicit timezone and reference clock for relative dates; keep server and initial client output consistent. Do not replace an absolute-date fallback with a relative label after hydration. Reserve space while browser-only display context is unavailable, and update relative labels as time passes.

## Data and verification

- Preserve pinned library revisions, local overrides, and immutable checkpoints across editor changes. Keep live preview, exports, and analysis on the same resolved document model.
- Keep personal content private. Use synthetic data in fixtures and screenshots. Keep credentials and provider calls server-side. Keep CV text and job descriptions out of logs.
- Keep changes within the active milestone and preserve existing behavior. Keep temporary scripts and screenshots outside the repo. Preserve required third-party license notices.
- Run the relevant formatting, lint, type-check, test, and build scripts after implementation changes. Verify editor changes on desktop and mobile with keyboard and touch where applicable. For document changes, check pagination, text extraction, and the affected export formats using representative fixtures.
