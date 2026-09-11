# Research and design judgment

## Reading Daniel’s taste

The desired effect is calm, tactile depth: enough light and translucency to suggest a material, while text remains easy to scan. Space and rounded inset highlights should establish hierarchy before visible outlines do. Motion should explain attention, selection and disclosure. The live primary button provides an approved visual anchor; it should not be redesigned simply for consistency with weaker components.

Recommended first decisions: diffuse protected panels, soft sidebar selection, generous chip insets, and distinct styling for read-only badges versus editable statuses. The pointer light and inspector motion are the surgical ambition alternatives. Avoid perpetual sheen, exaggerated springs, and turning every surface into glass.

## Research ledger

The gallery contains direct links and a specific take/leave decision for each source. They are references for individual qualities, not a claim that every library or every demo was exhaustively tested.

- [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials): protective material behind dense content; stronger depth on floating layers. CSS here does not reproduce native adaptive luminance or refraction.
- [Park UI](https://park-ui.com/): Panda/Ark architecture and recipe discipline. Preserve the Caelos visual language.
- [Animate UI dropdown](https://animate-ui.com/docs/primitives/radix/dropdown-menu): continuous highlight and menu motion. Use the behavior as a reference; its React 19 guidance is not a reason to replace the existing React 18 stack.
- [Motion layout](https://motion.dev/docs/react-layout-animations): shared geometry and expansion using the installed runtime.
- [Motion Primitives toolbar](https://motion-primitives.com/docs/toolbar-dynamic): progressive disclosure near the point of work.
- [React Aria TagGroup](https://react-aria.adobe.com/TagGroup): separate selection from removal. The gallery uses native buttons, not a TagGroup implementation.
- [Radix Themes Badge](https://www.radix-ui.com/themes/docs/components/badge): quiet tint and proportion for facts.
- [HeroUI Chip](https://heroui.com/en/docs/react/components/chip): deliberate leading, label and trailing slots.
- [Base UI Menu](https://base-ui.com/react/components/menu): menu structure and selection behavior; no runtime migration proposed.
- [Radix dropdown](https://www.radix-ui.com/primitives/docs/components/dropdown-menu): installed keyboard and dismissal behavior.
- [Radix tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip): contextual explanation on hover and focus.
- [shadcn sidebar](https://ui.shadcn.com/docs/components/base/sidebar): navigation/action/count anatomy.
- [Magic UI card](https://magicui.design/docs/components/magic-card): optional restrained pointer light for one focal surface.
- [Aceternity hover](https://ui.aceternity.com/components/card-hover-effect): a moving backplate adapted to compact rows.
- [VLLNT liquid glass](https://ui.vllnt.com/components/liquid-glass): boundary reference; continuous sheen was not selected.

Apple and Animate UI were also opened and visually inspected in the browser. Remaining source findings are documentation-led. The live Caelos screen was captured and inspected before building. The complete original Linear corpus was not available at its referenced path; surviving structural directives, craft audit and chip research were used instead.

## Candidate Panda boundaries after review

| Recipe | Slots / variants | Behavior ownership |
| --- | --- | --- |
| surface | root, content; quiet / diffuse / focal; panel / floating | CSS material tokens; optional pointer light |
| navigationRow | root, backplate, icon, label, count, action; selected / hover / focus | Navigation state + Motion shared backplate; Radix tooltip |
| taskRow | root, completion, title, metadata, status, assignee | Task state; semantic separate controls |
| chip | root, leading, label, trailing; filter / removable | Native button selection; independent remove button |
| badge | root, indicator, label; semantic status | Read-only fact |
| statusControl | trigger, indicator, label, chevron | Radix radio menu |
| menu | content, context, item, indicator, separator | Radix keyboard, dismissal and focus return |
| button | root, icon, label; primary / tonal / text | Preserve primary source; approve supporting styles |

Do not promote every prototype measurement automatically. First review directions, then map approved geometry and material roles into semantic tokens and Panda slot recipes. Validate them in real taskgraph compositions before standardizing across future subplatforms.

## Prototype material and motion model

The diffuse base opacity runs from 0.94 to 0.66 as the glass slider moves from 0 to 100. Blur ranges from 12px to 36px. Material variants add their own reading protection. Opaque mode replaces translucency. Text opacity is independent of glass intensity. This is a design study, not a claim of contrast compliance across arbitrary production backdrops.

Motion targets are 130ms for hover, 200ms for selection, and 240ms for expansion, with a reduced-motion alternative. Keyboard focus remains visible. Exact timing remains a review decision, especially in the actual product’s denser screens.
