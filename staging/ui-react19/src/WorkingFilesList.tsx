import React, { useRef, useState, type ReactNode } from "react";
import { ChevronRight, Copy, ExternalLink, FileCode2, FileDiff, FolderInput } from "lucide-react";
import { headerControl, workingFiles } from "../styled-system/recipes/index.mjs";
import { IconButton } from "./components";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./overlays";
import { RippleLoader } from "./RippleLoader";
import { InlineCluster, Section, Stack } from "./spacing";
import { Text } from "./foundation";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export interface WorkingFile {
  name: string;
  path: string;
  /** One line under the row when its disclosure is open. */
  summary?: ReactNode;
  /** The diff affordance renders only when the file has changes to show. */
  hasDiff?: boolean;
  /** Shows the small inline loader beside the name while the file is being worked on. */
  active?: boolean;
}

/** The four things the row can ask a host drawer to show. */
export type WorkingFileView = "file" | "diff" | "external" | "move";

export interface WorkingFilesListProps {
  files: WorkingFile[];
  label?: ReactNode;
  /** Scopes this list's context menu so an outside-click on it never closes the header. */
  owner: string;
  /**
   * The drawer hook. The list never opens a panel of its own: it asks, and the host renders
   * whatever surface it wants — `WorkingFileDrawerBody` reproduces the approved contents.
   * `trigger` is the element focus should return to.
   */
  onOpenFile?: (file: WorkingFile, view: WorkingFileView, trigger?: HTMLElement) => void;
  onCopyPath?: (file: WorkingFile) => void;
  /** Controlled row disclosure, by file name. Omit for internal state. */
  expanded?: string | null;
  onExpandedChange?: (name: string | null) => void;
  diffIcon?: ReactNode;
  /** A quiet status line under the list, e.g. "Path copied". */
  notice?: ReactNode;
  className?: string;
}

/**
 * The approved Atlas 2 working-files list. A row is a name you can open, a disclosure for its
 * summary, a flexible dead zone that also toggles the summary, and a diff icon when the file
 * has changes. Right-click (or the context-menu key) opens File viewer / External app / Copy
 * pathname / Move file, and focus returns to the row the menu came from.
 *
 * Presentational: files arrive as props, no workspace is read, and no drawer is rendered here.
 */
export function WorkingFilesList({
  files,
  label = "Working Files",
  owner,
  onOpenFile,
  onCopyPath,
  expanded,
  onExpandedChange,
  diffIcon,
  notice,
  className,
}: WorkingFilesListProps) {
  const styles = workingFiles();
  const [ownExpanded, setOwnExpanded] = useState<string | null>(null);
  // Controlled when `expanded` is supplied; internal otherwise. The callback always fires.
  const open = expanded !== undefined ? expanded : ownExpanded;
  const setOpen = (next: string | null) => {
    if (expanded === undefined) setOwnExpanded(next);
    onExpandedChange?.(next);
  };
  const menuTrigger = useRef<HTMLElement | null>(null);
  const pendingView = useRef<{ file: WorkingFile; view: WorkingFileView } | null>(null);

  return (
    <Section
      className={cx(styles.root, className)}
      level={3}
      aria-label="Working Files"
      title={
        <InlineCluster className={styles.heading}>
          <Text variant="small" tone="muted">{label}</Text>
          <Text variant="small" tone="dim">{files.length}</Text>
        </InlineCluster>
      }
    >
      <Stack className={styles.list}>
        {files.map(file => (
          <Stack key={file.name} className={styles.file}>
            <div className={styles.row}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <button
                    className={styles.open}
                    onContextMenu={event => { menuTrigger.current = event.currentTarget; }}
                    onKeyDown={event => {
                      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))
                        menuTrigger.current = event.currentTarget;
                    }}
                    onClick={event => onOpenFile?.(file, "file", event.currentTarget)}
                    aria-label={`Open ${file.name}`}
                  >
                    <FileCode2 size={16} aria-hidden="true" />
                    {file.active && <RippleLoader size={12} label={`${file.name} in progress`} />}
                    <span>{file.name}</span>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent
                  data-header-owner={owner}
                  data-nc-header-control=""
                  className={headerControl({ kind: "fileMenu" })}
                  onCloseAutoFocus={event => {
                    if (pendingView.current) {
                      event.preventDefault();
                      const next = pendingView.current;
                      pendingView.current = null;
                      requestAnimationFrame(() =>
                        onOpenFile?.(next.file, next.view, menuTrigger.current ?? undefined),
                      );
                    }
                  }}
                >
                  <div className={styles.menuLabel}>Open in</div>
                  <ContextMenuItem onSelect={() => { pendingView.current = { file, view: "file" }; }}>
                    <FileCode2 size={15} />File viewer
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => { pendingView.current = { file, view: "external" }; }}>
                    <ExternalLink size={15} />External app
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => onCopyPath?.(file)}>
                    <Copy size={15} />Copy pathname
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => { pendingView.current = { file, view: "move" }; }}>
                    <FolderInput size={15} />Move file
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
              <button
                className={styles.disclosure}
                aria-label={`Details for ${file.name}`}
                aria-expanded={open === file.name}
                aria-controls={`file-detail-${owner}-${file.name}`}
                onClick={() => setOpen(open === file.name ? null : file.name)}
              >
                <ChevronRight size={13} aria-hidden="true" />
              </button>
              <button
                className={styles.space}
                aria-label={`Toggle details for ${file.name}`}
                tabIndex={-1}
                onClick={() => setOpen(open === file.name ? null : file.name)}
              />
              <span className={styles.diff}>
                {file.hasDiff && (
                  <IconButton
                    size="sm"
                    variant="text"
                    data-nc-header-control=""
                    className={headerControl({ kind: "fileDiffButton" })}
                    label={`View changes to ${file.name}`}
                    icon={diffIcon ?? <FileDiff size={16} />}
                    onClick={event => onOpenFile?.(file, "diff", event.currentTarget)}
                  />
                )}
              </span>
            </div>
            {open === file.name && (
              <Stack className={styles.detail} id={`file-detail-${owner}-${file.name}`}>
                {file.summary != null && (
                  <Text as="p" variant="small" tone="muted">{file.summary}</Text>
                )}
                <Text as="p" variant="mono" tone="dim">{file.path}</Text>
              </Stack>
            )}
          </Stack>
        ))}
        {notice != null && (
          <Text as="p" variant="small" tone="muted" role="status">{notice}</Text>
        )}
      </Stack>
    </Section>
  );
}

export interface WorkingFileDrawerBodyProps {
  name: ReactNode;
  path: ReactNode;
  /** Marks the body so the header's outside-click handler treats it as its own layer. */
  owner: string;
  children?: ReactNode;
  className?: string;
}

/**
 * The approved body of the file panel, for a host `Drawer`. Carries `data-agent-file-layer`,
 * which is what tells the conversation header this is one of its own surfaces rather than an
 * outside click.
 */
export function WorkingFileDrawerBody({
  name, path, owner, children, className,
}: WorkingFileDrawerBodyProps) {
  const styles = workingFiles();
  return (
    <div data-agent-file-layer data-header-owner={owner} className={cx(styles.drawerBody, className)}>
      <Text className={styles.fileTitle}>{name}</Text>
      <Text as="p" variant="mono" tone="muted" className={styles.filePath}>{path}</Text>
      {children}
    </div>
  );
}

export interface FileCodeProps {
  children?: ReactNode;
  /** Renders each line with the approved added / removed tones instead of plain code. */
  diff?: string[];
  className?: string;
}

/** Plain pre-formatted file text, or a previous-to-current comparison. */
export function FileCode({ children, diff, className }: FileCodeProps) {
  const styles = workingFiles();
  if (diff) {
    return (
      <pre className={cx(styles.fileCode, className)}>
        {diff.map((line, i) => (
          <span
            key={i}
            className={styles.diffLine}
            data-change={line[0] === "+" ? "added" : line[0] === "-" ? "removed" : "same"}
          >
            {line}{"\n"}
          </span>
        ))}
      </pre>
    );
  }
  return <pre className={cx(styles.fileCode, className)}><code>{children}</code></pre>;
}

/** The move-file form's layout, for a host that wires its own submit. */
export function FileMoveForm({
  className, ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  const styles = workingFiles();
  return <form {...props} className={cx(styles.moveForm, className)} />;
}
