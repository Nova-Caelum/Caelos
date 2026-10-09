// The project's worklog as a table the reader arranges: move columns (drag a header,
// or Move left/right in its menu), filter a column by its values, hide and re-show
// columns, freeze one column at the left edge, and sort. The arrangement is saved per
// project in localStorage and restored on reload. Reads `GET /api/worklog?project=`.
import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import {
  ActionMenuCheckboxItem, ActionMenuContent, ActionMenuItem, ActionMenuRoot, ActionMenuSeparator, ActionMenuTrigger,
  Badge, Button, Checkbox, IconButton, Input, Loading, Popover, PopoverContent, PopoverTrigger, Text,
} from "@nova-caelum/ui";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, Columns3, EyeOff, ListFilter,
  MoreHorizontal, Pin, PinOff, RotateCcw,
} from "lucide-react";
import { failureReason } from "./failures";

/** One worklog entry, as the engine's door returns it. */
export type WorklogRow = {
  id: string; author: string; project?: string | null; summary: string; detailed?: string | null;
  tags?: string[] | null; client?: string | null; surface?: string | null; work_item_id?: string | null;
  created_at: string; source_file?: string | null;
};

type ColumnKey = "date" | "author" | "summary" | "tags" | "surface" | "client" | "work_item";
type Sort = { column: ColumnKey; direction: "asc" | "desc" } | null;
type View = {
  order: ColumnKey[];
  hidden: ColumnKey[];
  /** Per column, the values a row must match one of. Absent or empty: no filter. */
  filters: Partial<Record<ColumnKey, string[]>>;
  frozen: ColumnKey | null;
  sort: Sort;
};

const EMPTY = ""; // the filter value for a blank cell, shown as "(blank)"
const dayOf = (iso: string) => (iso || "").slice(0, 10);
const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};
const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, lineHeight: "16px" };

const COLUMNS: Record<ColumnKey, {
  label: string; width: number;
  /** The values a row is filtered by (a row matches when any of them is selected). */
  values: (row: WorklogRow) => string[];
  sortValue: (row: WorklogRow) => string;
  cell: (row: WorklogRow) => ReactNode;
}> = {
  date: {
    label: "Date", width: 176,
    values: row => [dayOf(row.created_at)],
    sortValue: row => row.created_at ?? "",
    cell: row => <span title={row.created_at} style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatDate(row.created_at)}</span>,
  },
  author: {
    label: "Author", width: 136,
    values: row => [row.author ?? EMPTY],
    sortValue: row => row.author ?? "",
    cell: row => row.author,
  },
  summary: {
    label: "Summary", width: 360,
    values: row => [row.summary ?? EMPTY],
    sortValue: row => row.summary ?? "",
    cell: row => row.summary,
  },
  tags: {
    label: "Tags", width: 200,
    values: row => (row.tags?.length ? row.tags : [EMPTY]),
    sortValue: row => (row.tags ?? []).join(", "),
    cell: row => <span className="flex flex-wrap gap-1">{(row.tags ?? []).map(tag => <Badge key={tag}>{tag}</Badge>)}</span>,
  },
  surface: {
    label: "Surface", width: 128,
    values: row => [row.surface ?? EMPTY],
    sortValue: row => row.surface ?? "",
    cell: row => <span style={mono}>{row.surface}</span>,
  },
  client: {
    label: "Client", width: 120,
    values: row => [row.client ?? EMPTY],
    sortValue: row => row.client ?? "",
    cell: row => row.client,
  },
  work_item: {
    label: "Work item", width: 220,
    values: row => [row.work_item_id ?? EMPTY],
    sortValue: row => row.work_item_id ?? "",
    cell: row => <span style={mono} className="block truncate" title={row.work_item_id ?? undefined}>{row.work_item_id}</span>,
  },
};
const DEFAULT_ORDER = Object.keys(COLUMNS) as ColumnKey[];
const DEFAULT_VIEW: View = { order: DEFAULT_ORDER, hidden: [], filters: {}, frozen: null, sort: null };
const isColumn = (value: unknown): value is ColumnKey => typeof value === "string" && value in COLUMNS;
const EXPANDER_WIDTH = 36;

const storageKey = (projectCode: string) => `caelos.worklog.view.v1:${projectCode}`;

/** A saved view, checked field by field — anything unknown or malformed falls back to
 * the default, so a stale or hand-edited entry can never break the tab. */
function readView(projectCode: string): View {
  let saved: Partial<View> | null = null;
  try { saved = JSON.parse(localStorage.getItem(storageKey(projectCode)) ?? "null"); } catch { saved = null; }
  if (!saved || typeof saved !== "object") return DEFAULT_VIEW;
  const order = Array.isArray(saved.order) ? saved.order.filter(isColumn) : [];
  const fullOrder = [...new Set([...order, ...DEFAULT_ORDER])];
  const hidden = Array.isArray(saved.hidden) ? [...new Set(saved.hidden.filter(isColumn))] : [];
  const filters: View["filters"] = {};
  if (saved.filters && typeof saved.filters === "object") {
    for (const [key, values] of Object.entries(saved.filters)) {
      if (isColumn(key) && Array.isArray(values)) {
        const kept = values.filter((v): v is string => typeof v === "string");
        if (kept.length) filters[key] = kept;
      }
    }
  }
  const frozen = isColumn(saved.frozen) ? saved.frozen : null;
  const sort = saved.sort && isColumn(saved.sort.column) && (saved.sort.direction === "asc" || saved.sort.direction === "desc")
    ? { column: saved.sort.column, direction: saved.sort.direction } : null;
  return { order: fullOrder, hidden, filters, frozen, sort };
}

function writeView(projectCode: string, view: View) {
  try { localStorage.setItem(storageKey(projectCode), JSON.stringify(view)); } catch { /* storage full or blocked: the view still works for this visit */ }
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function WorklogTab({ projectCode, load }: {
  projectCode: string;
  /** Reads a project's worklog entries. */
  load: (projectCode: string) => Promise<WorklogRow[]>;
}) {
  const [rows, setRows] = useState<WorklogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>(() => readView(projectCode));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<ColumnKey | null>(null);
  const [dropTarget, setDropTarget] = useState<ColumnKey | null>(null);

  function fetchRows() {
    setRows(null); setError(null);
    load(projectCode).then(setRows).catch(e => setError(failureReason(e)));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- one read per project
  useEffect(fetchRows, [projectCode]);
  useEffect(() => { writeView(projectCode, view); }, [projectCode, view]);

  const visible = view.order.filter(key => !view.hidden.includes(key));
  const frozen = view.frozen && visible.includes(view.frozen) ? view.frozen : null;
  // A frozen column is pinned at the left edge; the rest keep their order.
  const columns = frozen ? [frozen, ...visible.filter(key => key !== frozen)] : visible;
  // Empty value lists are never stored (setFilter and readView drop them), so every entry is active.
  const activeFilters = useMemo(() => Object.entries(view.filters) as [ColumnKey, string[]][], [view.filters]);

  const distinct = useMemo(() => {
    const result = {} as Record<ColumnKey, { value: string; count: number }[]>;
    for (const key of DEFAULT_ORDER) {
      const counts = new Map<string, number>();
      for (const row of rows ?? []) for (const value of new Set(COLUMNS[key].values(row))) counts.set(value, (counts.get(value) ?? 0) + 1);
      result[key] = [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value));
    }
    return result;
  }, [rows]);

  const shown = useMemo(() => {
    const kept = (rows ?? []).filter(row => activeFilters.every(([key, values]) => COLUMNS[key].values(row).some(v => values.includes(v))));
    if (!view.sort) return kept;
    const { column, direction } = view.sort;
    const sign = direction === "asc" ? 1 : -1;
    return [...kept].sort((a, b) =>
      sign * COLUMNS[column].sortValue(a).localeCompare(COLUMNS[column].sortValue(b), undefined, { numeric: true, sensitivity: "base" })
      || (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [rows, activeFilters, view.sort]);

  const update = (patch: Partial<View>) => setView(current => ({ ...current, ...patch }));
  const setSort = (column: ColumnKey, direction: "asc" | "desc" | null) => update({ sort: direction ? { column, direction } : null });
  const cycleSort = (column: ColumnKey) => {
    const current = view.sort?.column === column ? view.sort.direction : null;
    setSort(column, current === null ? "asc" : current === "asc" ? "desc" : null);
  };
  const moveBy = (column: ColumnKey, step: -1 | 1) => {
    // Step over hidden columns so a visible move always changes what the reader sees.
    const target = visible[visible.indexOf(column) + step];
    if (target) update({ order: moveItem(view.order, view.order.indexOf(column), view.order.indexOf(target)) });
  };
  const hide = (column: ColumnKey) => update({
    hidden: [...view.hidden, column],
    frozen: view.frozen === column ? null : view.frozen,
  });
  const setFilter = (column: ColumnKey, values: string[]) => {
    const filters = { ...view.filters };
    if (values.length) filters[column] = values; else delete filters[column];
    update({ filters });
  };

  function onDragStart(event: DragEvent<HTMLTableCellElement>, column: ColumnKey) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", column);
    setDragging(column);
  }
  function onDragOver(event: DragEvent<HTMLTableCellElement>, column: ColumnKey) {
    if (!dragging || dragging === column) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTarget !== column) setDropTarget(column);
  }
  function onDrop(event: DragEvent<HTMLTableCellElement>, column: ColumnKey) {
    event.preventDefault();
    const source = dragging ?? event.dataTransfer.getData("text/plain");
    if (isColumn(source) && source !== column) {
      // The dragged column takes the target's place, whichever side it came from.
      update({ order: moveItem(view.order, view.order.indexOf(source), view.order.indexOf(column)) });
    }
    setDragging(null); setDropTarget(null);
  }

  const lefts: Partial<Record<ColumnKey, number>> = frozen ? { [frozen]: EXPANDER_WIDTH } : {};
  const stickyCell = (key: ColumnKey | "expander", head: boolean): CSSProperties => {
    const left = key === "expander" ? 0 : lefts[key];
    const base: CSSProperties = head ? { position: "sticky", top: 0, zIndex: 2, background: "var(--nc-opaque)" } : {};
    if (left === undefined) return base;
    return { ...base, position: "sticky", left, zIndex: head ? 3 : 1, background: "var(--nc-opaque)",
      ...(key !== "expander" ? { boxShadow: "inset -1px 0 0 var(--sys-hair-2)" } : {}) };
  };

  return (
    <div data-worklog-panel="" className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0 flex-wrap">
        <Text as="span" variant="small" tone="muted" data-worklog-count="">
          {rows === null ? "Reading the worklog…" : `Showing ${shown.length} of ${rows.length} ${rows.length === 1 ? "entry" : "entries"}`}
        </Text>
        {activeFilters.map(([key, values]) => (
          <Badge key={key} tone="ready">{COLUMNS[key].label}: {values.map(v => v || "(blank)").join(", ")}</Badge>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {activeFilters.length > 0 && <Button variant="text" size="sm" onClick={() => update({ filters: {} })}>Clear filters</Button>}
          <ActionMenuRoot>
            <ActionMenuTrigger asChild>
              <Button variant="tonal" size="sm" aria-label="Show or hide columns" leadingIcon={<Columns3 size={13} />}>Columns</Button>
            </ActionMenuTrigger>
            <ActionMenuContent align="end" aria-label="Columns">
              {view.order.map(key => (
                <ActionMenuCheckboxItem key={key} checked={!view.hidden.includes(key)} onSelect={e => e.preventDefault()}
                  onCheckedChange={checked => checked
                    ? update({ hidden: view.hidden.filter(k => k !== key) })
                    : hide(key)}>
                  {COLUMNS[key].label}
                </ActionMenuCheckboxItem>
              ))}
            </ActionMenuContent>
          </ActionMenuRoot>
          <IconButton variant="text" size="sm" label="Reset the table to its default layout" icon={<RotateCcw size={13} />}
            onClick={() => setView(DEFAULT_VIEW)} />
        </div>
      </div>

      {error ? (
        <div className="px-5 py-6 flex items-center gap-3" data-worklog-error="">
          <Text as="p" tone="muted">Couldn't read the worklog: {error}</Text>
          <Button variant="text" onClick={fetchRows}>Retry</Button>
        </div>
      ) : rows === null ? (
        <div className="px-5 py-6"><Loading /></div>
      ) : rows.length === 0 ? (
        <Text as="p" tone="muted" className="px-5 py-6">No worklog entries for this project yet.</Text>
      ) : (
        <div className="flex-1 overflow-auto" style={{ minHeight: 0, borderTop: "1px solid var(--sys-hair-1)" }}>
          <table data-worklog-table="" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", width: "max-content", minWidth: "100%", fontSize: 13, lineHeight: "19.5px" }}>
            <colgroup>
              <col style={{ width: EXPANDER_WIDTH }} />
              {columns.map(key => <col key={key} style={{ width: COLUMNS[key].width }} />)}
            </colgroup>
            <thead>
              <tr>
                <th aria-label="Detail" style={{ ...stickyCell("expander", true), borderBottom: "1px solid var(--sys-hair-2)" }} />
                {columns.map(key => {
                  const column = COLUMNS[key];
                  const sorted = view.sort?.column === key ? view.sort.direction : null;
                  const filterValues = view.filters[key] ?? [];
                  const index = visible.indexOf(key);
                  const sticky = stickyCell(key, true);
                  return (
                    <th key={key} scope="col" data-column={key} draggable
                      data-frozen={frozen === key ? "true" : undefined}
                      data-filtered={filterValues.length ? "true" : undefined}
                      data-drop-target={dropTarget === key ? "true" : undefined}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                      onDragStart={e => onDragStart(e, key)} onDragOver={e => onDragOver(e, key)}
                      onDragLeave={() => { if (dropTarget === key) setDropTarget(null); }}
                      onDrop={e => onDrop(e, key)} onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                      style={{
                        ...sticky, textAlign: "left", fontWeight: 500, padding: "6px 6px 6px 12px",
                        borderBottom: "1px solid var(--sys-hair-2)", cursor: "grab",
                        opacity: dragging === key ? 0.5 : 1,
                        boxShadow: dropTarget === key ? "inset 2px 0 0 var(--sys-accent)" : sticky.boxShadow,
                      }}>
                      <div className="flex items-center gap-1 min-w-0">
                        <button type="button" onClick={() => cycleSort(key)} className="flex items-center gap-1.5 min-w-0"
                          aria-label={`Sort by ${column.label}`}
                          style={{ background: "none", border: 0, padding: 0, font: "inherit", color: "var(--il-muted)", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11 }}>
                          {frozen === key && <Pin size={11} aria-hidden="true" />}
                          <span className="truncate">{column.label}</span>
                          {sorted === "asc" ? <ArrowUp size={11} aria-hidden="true" /> : sorted === "desc" ? <ArrowDown size={11} aria-hidden="true" /> : <ArrowUpDown size={11} aria-hidden="true" style={{ opacity: 0.35 }} />}
                        </button>
                        <div className="ml-auto flex items-center flex-shrink-0">
                          <ColumnFilter label={column.label} options={distinct[key]} selected={filterValues} onChange={values => setFilter(key, values)} />
                          <ActionMenuRoot>
                            <ActionMenuTrigger asChild>
                              <IconButton variant="text" size="sm" label={`Column options: ${column.label}`} icon={<MoreHorizontal size={13} />} style={{ width: 26, height: 26 }} />
                            </ActionMenuTrigger>
                            <ActionMenuContent align="end" aria-label={`${column.label} column`}>
                              <ActionMenuItem onSelect={() => setSort(key, "asc")}><ArrowUp size={13} /> Sort ascending</ActionMenuItem>
                              <ActionMenuItem onSelect={() => setSort(key, "desc")}><ArrowDown size={13} /> Sort descending</ActionMenuItem>
                              {sorted && <ActionMenuItem onSelect={() => setSort(key, null)}><ArrowUpDown size={13} /> Clear sort</ActionMenuItem>}
                              <ActionMenuSeparator />
                              <ActionMenuItem disabled={index <= 0} onSelect={() => moveBy(key, -1)}><ArrowLeft size={13} /> Move left</ActionMenuItem>
                              <ActionMenuItem disabled={index >= visible.length - 1} onSelect={() => moveBy(key, 1)}><ArrowRight size={13} /> Move right</ActionMenuItem>
                              <ActionMenuSeparator />
                              {frozen === key
                                ? <ActionMenuItem onSelect={() => update({ frozen: null })}><PinOff size={13} /> Unfreeze column</ActionMenuItem>
                                : <ActionMenuItem onSelect={() => update({ frozen: key })}><Pin size={13} /> Freeze column</ActionMenuItem>}
                              <ActionMenuItem disabled={visible.length <= 1} onSelect={() => hide(key)}><EyeOff size={13} /> Hide column</ActionMenuItem>
                            </ActionMenuContent>
                          </ActionMenuRoot>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="px-5 py-6"><Text tone="muted">No entries match these filters.</Text></td></tr>
              )}
              {shown.map(row => {
                const open = expanded.has(row.id);
                const cellStyle: CSSProperties = { padding: "8px 12px", verticalAlign: "top", borderBottom: "1px solid var(--sys-hair-1)", overflowWrap: "anywhere" };
                return [
                  <tr key={row.id} data-worklog-row={row.id}>
                    <td style={{ ...cellStyle, ...stickyCell("expander", false), padding: "4px 0 4px 6px" }}>
                      <IconButton variant="text" size="sm" label={open ? "Hide detail" : "Show detail"} aria-expanded={open}
                        icon={open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} style={{ width: 26, height: 26 }}
                        onClick={() => setExpanded(current => { const next = new Set(current); if (open) next.delete(row.id); else next.add(row.id); return next; })} />
                    </td>
                    {columns.map(key => (
                      <td key={key} data-column={key} style={{ ...cellStyle, ...stickyCell(key, false) }}>{COLUMNS[key].cell(row)}</td>
                    ))}
                  </tr>,
                  open && (
                    <tr key={`${row.id}:detail`} data-worklog-detail={row.id}>
                      <td colSpan={columns.length + 1} style={{ padding: "4px 12px 14px 0", borderBottom: "1px solid var(--sys-hair-1)" }}>
                        {/* Pinned to the left edge so the body stays readable when the table is scrolled sideways. */}
                        <div style={{ position: "sticky", left: 48, width: "min(78ch, 60vw)", paddingLeft: 48 - EXPANDER_WIDTH + 12 }}>
                          <Text as="p" variant="small" tone={row.detailed ? "default" : "muted"} style={{ whiteSpace: "pre-wrap" }}>
                            {row.detailed || "No detail recorded."}
                          </Text>
                          {row.source_file && <Text as="p" variant="mono" tone="dim" className="mt-2">{row.source_file}</Text>}
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ColumnFilter({ label, options, selected, onChange }: {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const listed = needle ? options.filter(o => (o.value || "(blank)").toLowerCase().includes(needle)) : options;
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  return (
    <Popover onOpenChange={open => { if (!open) setQuery(""); }}>
      <PopoverTrigger asChild>
        <IconButton variant="text" size="sm" label={`Filter: ${label}`} icon={<ListFilter size={13} />}
          style={{ width: 26, height: 26, color: selected.length ? "var(--sys-accent)" : undefined }} />
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={`Filter ${label}`} style={{ width: 260 }}>
        <div className="flex items-center justify-between mb-2">
          <Text variant="label">Filter {label}</Text>
          {selected.length > 0 && <Button variant="text" size="sm" onClick={() => onChange([])}>Clear filter</Button>}
        </div>
        {options.length > 8 && (
          <Input variant="search" aria-label={`Search ${label} values`} placeholder="Search values…" value={query}
            onChange={e => setQuery(e.target.value)} wrapperClassName="mb-2" />
        )}
        <div className="flex flex-col gap-0.5" style={{ maxHeight: 260, overflowY: "auto" }}>
          {listed.length === 0 && <Text as="p" variant="small" tone="muted">No matching values.</Text>}
          {listed.map(option => (
            <label key={option.value} className="flex items-center gap-2 py-1 cursor-pointer min-w-0">
              <Checkbox aria-label={option.value || "(blank)"} checked={selected.includes(option.value)} onChange={() => toggle(option.value)} />
              <Text as="span" variant="small" className="flex-1 min-w-0 truncate" tone={option.value ? "default" : "muted"}>{option.value || "(blank)"}</Text>
              <Text as="span" variant="small" tone="dim" aria-hidden="true" style={{ fontVariantNumeric: "tabular-nums" }}>{option.count}</Text>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
