Historical record; does not validate the September 10 source changes.

# Validation record

Verified September 9, 2026 against the built package in Chromium.

- Clean dependency installation using the npm lockfile, with no existing dependencies or generated files: passed.
- Panda generation, TypeScript component checking, ESM and declaration output, compiled stylesheet: passed.
- Existing application production build: passed. Its existing large-chunk warning remains; this change does not optimize the application bundle.
- Frozen pnpm workspace lockfile check: passed. This is a lockfile consistency check, not a Linux production deployment test.
- Browser acceptance suite: 15 checks passed, including generated variants; persistent permissions/model/reasoning selection; keyboard reply selection and independent instances; eight-line growth; Enter/Shift+Enter and IME handling; Add callbacks and focus restoration; tooltip typography/material/uniform edges; quiet scrollbar behavior; light portal theme; reduced motion; narrow controls; bottom-edge picker fallback; and absence of runtime errors.
- Full-page rendered output inspected after the checks.
- Package archive contains the public modules, type declarations, stylesheet and documentation; importing public exports and rendering a basic form on the server passed.

Foundry integration verified September 9, 2026: 10 browser checks passed against the existing application Foundry, including a real package rebuild and completed-page refresh. Menus and tooltips rendered above the Foundry overlay; permission/model/reasoning state, reply selection, demo submission, dark/light materials and legacy-control separation passed with no browser runtime errors. The Foundry, composer and tooltip screenshots were inspected. The application production build passed; its existing large-chunk warning remains. Run `node packages/ui/tests/foundry.mjs` with the local Foundry running; see [FOUNDRY.md](FOUNDRY.md).

Run the acceptance suite against `preview:ui` using the instructions in README.md. The tests exercise the built package, so rebuild after component changes.

These checks establish the reusable package implementation, not completion of the application migration. Application data flows, actual voice/model integrations, screen-wide light mode, other browsers and assistive-technology testing remain integration work. The composer's extracted internal JSX retains the approved behavior behind a typed public wrapper; internal JavaScript is not covered by TypeScript's `checkJs`.
