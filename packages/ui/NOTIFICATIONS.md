# Notifications

`NotificationCard`, `NotificationButton`, `NotificationProvider`, and `useNotifications`
are exported by `@nova-caelum/ui`. The Panda `notification` slot recipe is included in
the preset and packaged stylesheet. It composes the existing Alert, Button, Input,
and circular tonal navigation recipes.

| Kind | Treatment |
| --- | --- |
| `error` | Danger icon, fill and glow |
| `permission` | Progress/amber icon, fill and glow |
| `question` | Blue action icon and glow, readable elevated backing |
| `ready` | Sage green icon, fill and glow |
| `attention` | Progress/amber icon, fill and glow |

Mount one provider above every surface and place `NotificationButton` in each
surface's toolbar. Publish stable event IDs to update an existing item without
duplicating it:

```tsx
const { publish } = useNotifications();
publish({
  id: `brief:${brief.id}`,
  kind: "ready",
  title: "Your project brief is ready",
  source: "Caelos",
  actions: [{ id: "open", label: "Open brief", primary: true, run: openBrief }],
});
```

Cards have rest and expanded states, details disclosure, hover/focus actions,
and inline answer/clarification input. Touch reveals actions without hover.
`choices` plus `onReply(value, mode)` enable question replies. Host callbacks own
actual operations; the component never invents a successful backend response.
Actions resolve on success unless `resolves: false` or the callback returns false.
Thrown/rejected actions show an inline error and remain unaddressed. Clarification
does not resolve the original request.

Popups expire after six seconds by default. Hover, focus, expansion and pending
operations pause expiry. Dismiss/Escape closes the popup, retaining its inbox item
and answer draft. New arrivals do not interrupt an active interaction. Reduced
motion disables entry and disclosure animation. Inbox icons match each kind.

The provider is session memory: items and drafts survive SPA surface navigation,
but not full reloads. Durable storage and remote synchronization belong to the
host. Do not serialize action callbacks or permission grants into browser storage.

## In this package (React 18)

Ported from the React 19 `caelos-chat-react19` package. Three differences, all
in `src/Notification.tsx`: the collapsed detail is made `inert` with the string
attribute (React 18 drops a boolean `inert`, so the detail was never inert);
the `tooltip={false}` props are dropped because this package's `IconButton`
always carries its tooltip; and the bell is the tonal `IconButton` made circular
inline, because the `chatNavigationControl` recipe does not exist here. The
package preview's "Error surfaces" card and `tests/browser.mjs` ("Error
surfaces render under React 18") exercise the card, its `inert` detail and the
bell under React 18.
