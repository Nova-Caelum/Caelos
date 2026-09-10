# Historical UI source — retired from the application

These are preserved local sources from before the Level 1 shared-component cutover, including pre-existing uncommitted edits. They are historical reference only, excluded from the application import graph and Tailwind source scan. Their original relative imports are intentionally preserved; this is not a runnable component library or an approved alternative.

The old development bookmarks `?lab=1`, `?lab=2`, `?lab=3`, `?locked=1`, and `?primitives=1` now open the shared Foundry review surface. Production builds render the application for those development-only bookmarks. The approved library lives in `packages/ui`; its demonstration imports public exports in `src/app/FoundryPandaGallery.tsx`.

The retired ChatComposer was a preview-only consumer. No live conversation workflow used it. The shared Foundry Composer owns its demonstration state; this migration does not add chat services.
