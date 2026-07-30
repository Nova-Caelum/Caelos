import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Folder,
  LayoutGrid,
  ListFilter,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Card,
  Chip,
  Input,
  Row,
  type ButtonVariant,
  type CardVariant,
  type ChipTone,
  type ChipVariant,
  type InputVariant,
  type RowVariant,
} from "../primitives";
import "./primitiveGallery.css";

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "text"];
const BUTTON_STATES = ["rest", "hover", "active", "disabled"] as const;
const ROW_VARIANTS: RowVariant[] = ["tab", "sidebar", "list", "crumb"];
const ROW_STATES = ["rest", "hover", "active", "selected"] as const;
const CHIP_VARIANTS: ChipVariant[] = ["status", "category", "count"];
const CHIP_TONES: ChipTone[] = ["danger", "progress", "done", "ready", "atmospheric", "structural", "sage", "neutral"];
const INPUT_VARIANTS: InputVariant[] = ["text", "search"];
const CARD_VARIANTS: CardVariant[] = ["flat", "lifted", "glass"];

function MatrixHeader({ labels }: { labels: readonly string[] }) {
  return (
    <div className="foundry-matrix__header" aria-hidden="true">
      <span>Recipe</span>
      {labels.map((label) => <span key={label}>{label}</span>)}
    </div>
  );
}

function MatrixSection({
  children,
  count,
  defaultOpen = false,
  description,
  title,
}: {
  children: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
  description: string;
  title: string;
}) {
  return (
    <details className="foundry-matrix" open={defaultOpen}>
      <summary>
        <span className="foundry-matrix__title">{title}</span>
        <span className="foundry-matrix__description">{description}</span>
        <Chip variant="count" tone="neutral">{count}</Chip>
        <ChevronRight className="foundry-matrix__chevron" size={14} />
      </summary>
      <div className="foundry-matrix__body">{children}</div>
    </details>
  );
}

export default function PrimitiveGallery() {
  const [activeView, setActiveView] = useState("Board");
  const [activeFilter, setActiveFilter] = useState("Ready");
  const [query, setQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState("Atmosphere pass");
  const [actionCount, setActionCount] = useState(0);

  return (
    <div className="primitive-gallery" data-testid="primitive-gallery">
      <section className="primitive-playground" aria-labelledby="primitive-playground-title">
        <div className="primitive-playground__heading">
          <div>
            <span className="primitive-gallery__eyebrow">Live mechanism test</span>
            <h2 id="primitive-playground-title">Interactive instrument panel</h2>
          </div>
          <Chip tone="done"><Check size={10} /> Live</Chip>
        </div>

        <Row.Group variant="pill" aria-label="View selection">
          {["Board", "List", "Signals"].map((view) => (
            <Row
              key={view}
              variant="tab"
              size="sm"
              selected={activeView === view}
              onClick={() => setActiveView(view)}
              leadingIcon={view === "Board" ? <LayoutGrid /> : view === "List" ? <ListFilter /> : <CircleDot />}
            >
              {view}
            </Row>
          ))}
        </Row.Group>

        <div className="primitive-playground__toolbar">
          <Input
            data-testid="primitive-search"
            variant="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Filter foundry specimens"
            aria-label="Filter foundry specimens"
          />
          <Button
            data-testid="primitive-action"
            variant="primary"
            leadingIcon={<Plus />}
            onClick={() => setActionCount((count) => count + 1)}
          >
            Cast sample
          </Button>
        </div>

        <div className="primitive-playground__filters" aria-label="Status filters">
          {(["Ready", "Progress", "Done"] as const).map((filter) => (
            <Chip
              key={filter}
              interactive
              selected={activeFilter === filter}
              tone={filter === "Ready" ? "ready" : filter === "Progress" ? "progress" : "done"}
              variant="category"
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Chip>
          ))}
          <span className="primitive-playground__readout" role="status" data-testid="primitive-readout">
            {query ? `Filtering “${query}”` : `${activeView} · ${activeFilter}`}{actionCount ? ` · ${actionCount} cast` : ""}
          </span>
        </div>

        <div className="primitive-playground__cards">
          {["Atmosphere pass", "Navigation polish"].map((name, index) => (
            <Card
              key={name}
              interactive
              lit={index === 0}
              variant={index === 0 ? "glass" : "lifted"}
              selected={selectedCard === name}
              onClick={() => setSelectedCard(name)}
            >
              <div className="primitive-card-content">
                <span className="primitive-card-content__icon"><Folder size={15} /></span>
                <div>
                  <strong>{name}</strong>
                  <span>{index === 0 ? "3 signals ready" : "2 checks in progress"}</span>
                </div>
                <ArrowRight size={14} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="primitive-gallery__divider">
        <span>Review matrices</span>
        <span>five primitives · authored states</span>
      </div>

      <MatrixSection title="Button" description="variant × size × state" count={24} defaultOpen>
        <div className="foundry-matrix__scroll">
          <MatrixHeader labels={BUTTON_STATES} />
          {BUTTON_VARIANTS.flatMap((variant) => (["sm", "md"] as const).map((size) => (
            <div className="foundry-matrix__row" key={`${variant}-${size}`}>
              <code>{variant} / {size}</code>
              {BUTTON_STATES.map((state) => (
                <Button
                  key={state}
                  variant={variant}
                  size={size}
                  disabled={state === "disabled"}
                  forcedState={state === "disabled" ? "rest" : state}
                  leadingIcon={<Sparkles />}
                  data-align-target={variant === "primary" && size === "md" && state === "rest" ? "button" : undefined}
                >
                  Cast
                </Button>
              ))}
            </div>
          )))}
          <div className="foundry-matrix__subhead">Danger family swap</div>
          <div className="foundry-matrix__row">
            <code>danger / md</code>
            {BUTTON_STATES.map((state) => (
              <Button key={state} danger variant="secondary" forcedState={state === "disabled" ? "rest" : state} disabled={state === "disabled"}>
                Remove
              </Button>
            ))}
          </div>
        </div>
      </MatrixSection>

      <MatrixSection title="Row" description="context × size × state" count={32}>
        <div className="foundry-matrix__scroll">
          <MatrixHeader labels={ROW_STATES} />
          {ROW_VARIANTS.flatMap((variant) => (["sm", "md"] as const).map((size) => (
            <div className="foundry-matrix__row" key={`${variant}-${size}`}>
              <code>{variant} / {size}</code>
              {ROW_STATES.map((state) => (
                <Row
                  key={state}
                  variant={variant}
                  size={size}
                  forcedState={state}
                  leadingIcon={<Folder />}
                  trailing={variant === "list" ? <Chip variant="count">3</Chip> : undefined}
                >
                  Projects
                </Row>
              ))}
            </div>
          )))}
        </div>
      </MatrixSection>

      <MatrixSection title="Chip" description="variant × semantic family" count={24}>
        <div className="foundry-chip-matrix">
          {CHIP_VARIANTS.map((variant) => (
            <div key={variant}>
              <code>{variant}</code>
              <div>
                {CHIP_TONES.map((tone) => <Chip key={tone} variant={variant} tone={tone}>{variant === "count" ? CHIP_TONES.indexOf(tone) + 1 : tone}</Chip>)}
              </div>
            </div>
          ))}
        </div>
      </MatrixSection>

      <MatrixSection title="Input" description="kind × rest/focus/disabled" count={6}>
        <div className="foundry-input-matrix">
          {INPUT_VARIANTS.map((variant) => (
            <div key={variant}>
              <code>{variant}</code>
              <Input variant={variant} placeholder="Rest" aria-label={`${variant} rest specimen`} />
              <Input variant={variant} forcedState="focus" placeholder="Focus" aria-label={`${variant} focus specimen`} />
              <Input variant={variant} disabled placeholder="Disabled" aria-label={`${variant} disabled specimen`} />
            </div>
          ))}
        </div>
      </MatrixSection>

      <MatrixSection title="Card" description="surface × rest/hover" count={6}>
        <div className="foundry-card-matrix">
          {CARD_VARIANTS.flatMap((variant) => (["rest", "hover"] as const).map((state) => (
            <Card key={`${variant}-${state}`} variant={variant} forcedState={state} lit={variant === "glass"}>
              <span className="primitive-gallery__eyebrow">{state}</span>
              <strong>{variant}</strong>
              <span>Token-only surface recipe</span>
            </Card>
          )))}
        </div>
      </MatrixSection>

      <div className="primitive-alignment-probe" data-testid="alignment-probe">
        <span>Alignment probe</span>
        <Button variant="secondary" leadingIcon={<Search />} data-align-probe="icon-label">Baseline</Button>
      </div>
    </div>
  );
}
