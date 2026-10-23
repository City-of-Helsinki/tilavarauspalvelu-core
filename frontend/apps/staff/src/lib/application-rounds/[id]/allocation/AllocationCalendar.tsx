import React from "react";
import { IconCheck, IconLock, IconSize } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled, { css } from "styled-components";
import { MINUTES_PER_DAY } from "@ui/components/WeeklyPatternCalendar/engine";
import type {
  VisibleHours,
  WeeklyPatternAvailability,
  WeeklyPatternCellInfo,
  WeeklyPatternCellProps,
  WeeklyPatternValue,
} from "@ui/components/WeeklyPatternCalendar/types";
import { WeeklyPatternCalendar } from "@ui/components/WeeklyPatternCalendar/WeeklyPatternCalendar";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import { fontMedium } from "ui/src/styled";
import { ALLOCATION_TIME_FORM_ID } from "@/modules/const";
import { ALLOCATION_STEP_MINUTES } from "./modules/allocationPattern";
import type { AllocationCellData, AllocationHighlight } from "./modules/allocationPattern";
import { useSelectedSlots } from "./SelectedSlotsContext";

type Props = {
  /** What every cell holds, built once by the page. */
  pattern: WeeklyPatternValue<AllocationCellData>;
  /** The hours to draw. At least 07:00-24:00, more when a span or the Selection falls outside it. */
  extent: VisibleHours;
  /** The spans to outline, which are one Application Section's times or one Allocation. */
  highlights: ReadonlyArray<AllocationHighlight>;
};

/** Every cell of the allocation grid is open. Staff may select an allocated or a taken time to read its cards. */
const EVERY_DAY_OPEN: WeeklyPatternAvailability = WEEKDAYS_SORTED.map((weekday) => ({
  weekday,
  beginMinutes: 0,
  endMinutes: MINUTES_PER_DAY,
}));

/** The Demand buckets, which are the thresholds the colours have always used. */
function demandBucket(count: number): string {
  if (count > 10) {
    return "full";
  }
  if (count > 4) {
    return "many";
  }
  if (count > 1) {
    return "few";
  }
  return "one";
}

/**
 * The span that outlines this cell, or null. An Allocation wins over a Suitable Time Range, because it lies
 * inside the section's own ranges and its frame is the one that says where the Allocation is.
 */
function findHighlight(
  highlights: ReadonlyArray<AllocationHighlight>,
  cell: { weekday: AllocationHighlight["weekday"]; beginMinutes: number; endMinutes: number }
): AllocationHighlight | null {
  const covering = highlights.filter(
    (span) =>
      span.weekday === cell.weekday && span.beginMinutes <= cell.beginMinutes && span.endMinutes >= cell.endMinutes
  );
  return covering.find((span) => span.kind === "allocation") ?? covering[0] ?? null;
}

// An allocated and a taken cell may not differ by colour alone, so each one carries its own icon.
function renderCellContent(cell: WeeklyPatternCellInfo<AllocationCellData>): React.ReactNode {
  const state = cell.data;
  if (state == null) {
    return null;
  }
  if (state.state === "allocated") {
    return <IconCheck size={IconSize.ExtraSmall} />;
  }
  if (state.state === "affecting") {
    return <IconLock size={IconSize.ExtraSmall} />;
  }
  return state.count;
}

/**
 * The allocation grid. It is the shared calendar in select mode, so this file only turns the cell states into
 * words, icons and data attributes. The states themselves are resolved by the builder, one per cell.
 */
export function AllocationCalendar({ pattern, extent, highlights }: Props): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { selection, setSelection } = useSelectedSlots();

  const getStateLabel = (cell: WeeklyPatternCellInfo<AllocationCellData>): string => {
    const state = cell.data;
    const word =
      state == null
        ? t("allocation:calendar.state.free")
        : state.state === "demand"
          ? t("allocation:calendar.state.demand", { count: state.count })
          : t(`allocation:calendar.state.${state.state}`);
    // `aria-selected` already says a cell is in the Selection, so only the Highlight needs a word.
    if (findHighlight(highlights, cell) == null) {
      return word;
    }
    return `${word}, ${t("allocation:calendar.state.highlighted")}`;
  };

  const getCellProps = (cell: WeeklyPatternCellInfo<AllocationCellData>): WeeklyPatternCellProps => {
    const state = cell.data;
    const highlight = findHighlight(highlights, cell);
    return {
      "data-state": state?.state ?? "free",
      "data-demand": state?.state === "demand" ? demandBucket(state.count) : undefined,
      "data-highlight": highlight?.kind,
      "data-highlight-start": highlight != null && highlight.beginMinutes === cell.beginMinutes ? "" : undefined,
      "data-highlight-end": highlight != null && highlight.endMinutes === cell.endMinutes ? "" : undefined,
    };
  };

  return (
    <div>
      <Grid>
        <WeeklyPatternCalendar<AllocationCellData>
          value={pattern}
          selection={selection}
          onSelectionChange={setSelection}
          selectionAnnouncements={{
            chosen: t("allocation:calendar.announcements.chosen"),
            cleared: t("allocation:calendar.announcements.cleared"),
          }}
          step={ALLOCATION_STEP_MINUTES}
          availability={EVERY_DAY_OPEN}
          visibleHours={extent}
          locale={i18n.language}
          weekdayNameStyle="short"
          getStateLabel={getStateLabel}
          getCellProps={getCellProps}
          renderCellContent={renderCellContent}
          alternative={{ id: ALLOCATION_TIME_FORM_ID, label: t("allocation:calendar.skipToForm") }}
          aria-label={t("allocation:calendar.label")}
        />
      </Grid>
      <AllocationLegend />
    </div>
  );
}

/* One colour pair per cell state. The variables are the ones the old grid used. */
const cellStates = css`
  &[data-state="demand"][data-demand="one"] {
    background-color: var(--tilavaraus-allocation-calendar-colour-bg-one);
    color: var(--tilavaraus-allocation-calendar-colour-text-one);
  }

  &[data-state="demand"][data-demand="few"] {
    background-color: var(--tilavaraus-allocation-calendar-colour-bg-few);
    color: var(--tilavaraus-allocation-calendar-colour-text-few);
  }

  &[data-state="demand"][data-demand="many"] {
    background-color: var(--tilavaraus-allocation-calendar-colour-bg-many);
    color: var(--tilavaraus-allocation-calendar-colour-text-many);
  }

  &[data-state="demand"][data-demand="full"] {
    background-color: var(--tilavaraus-allocation-calendar-colour-bg-full);
    color: var(--tilavaraus-allocation-calendar-colour-text-full);
  }

  &[data-state="allocated"] {
    background-color: var(--tilavaraus-allocation-calendar-colour-bg-allocated);
    color: var(--tilavaraus-allocation-calendar-colour-text-allocated);
  }

  &[data-state="affecting"] {
    background-color: var(--tilavaraus-allocation-calendar-colour-bg-allocated-elsewhere);
    color: var(--tilavaraus-allocation-calendar-colour-text-allocated-elsewhere);
  }
`;

/*
  The Selection's tint. Its frame is drawn by the shared calendar, which puts a 3px box shadow around the whole
  run. A tint on top of the state colour has to be an image, because the colour owns the background colour.
*/
const selectionTint = css`
  &[data-selected] {
    background-image: linear-gradient(rgb(0 0 0 / 0.1), rgb(0 0 0 / 0.1));
  }
`;

/*
  The Highlight's frame, drawn on a pseudo element so it takes no space and leaves the focus outline on top. A
  Suitable Time Range is dashed and an Allocation is double, so the two never differ by colour alone.
*/
const highlightFrame = css`
  &[data-highlight] {
    --highlight-width: 2px;
    --highlight-style: dashed;
    --highlight-colour: var(--color-bus);
  }

  &[data-highlight="allocation"] {
    --highlight-width: 4px;
    --highlight-style: double;
    --highlight-colour: var(--color-black);
  }

  &[data-highlight]::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 0 var(--highlight-style) var(--highlight-colour);
    border-inline-width: var(--highlight-width);
  }

  &[data-highlight][data-highlight-start]::after {
    border-top-width: var(--highlight-width);
  }

  &[data-highlight][data-highlight-end]::after {
    border-bottom-width: var(--highlight-width);
  }
`;

const cellContent = css`
  padding: 0;
  text-align: center;
  vertical-align: middle;
  font-size: var(--fontsize-body-s);
  line-height: 1;
  ${fontMedium};
`;

/*
  The grid's size and its colours. The sizes are the three custom properties the shared calendar reads: rows of
  24px, which is the smallest target WCAG 2.5.8 allows, 68 of them, and no inner scroll, so the page carries the
  whole day.

  The state rules are repeated for a hovered cell. The shared calendar washes a hovered cell grey, which would
  otherwise hide the Demand colour and the icons. A cell with no Demand keeps that wash, so the pointer still
  gets an answer from the grid.
*/
const Grid = styled.div`
  --weekly-pattern-height: auto;
  --weekly-pattern-step-height: 24px;
  --weekly-pattern-day-min-width: 60px;
  --weekly-pattern-selection-color: var(--color-black);

  margin-top: var(--spacing-l);

  &&& tbody td {
    ${cellContent};
    ${cellStates};
    ${selectionTint};
    ${highlightFrame};
  }

  &&& tbody td:hover {
    ${cellStates};
    ${selectionTint};
  }
`;

const LegendList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: var(--spacing-2-xs);
  margin: var(--spacing-xs) 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--fontsize-body-s);
`;

const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
`;

const LegendBox = styled.div`
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-black-50);
  background-color: var(--color-white);
  ${cellStates};
  ${highlightFrame};

  /* The swatch has no run around it, so it carries the whole frame of the Selection itself. */
  &[data-selected] {
    box-shadow: inset 0 0 0 3px var(--color-black);
    ${selectionTint};
  }
`;

type LegendRow = { key: string; attributes: WeeklyPatternCellProps; icon?: React.ReactElement };

const LEGEND_ROWS: ReadonlyArray<LegendRow> = [
  { key: "demandOne", attributes: { "data-state": "demand", "data-demand": "one" } },
  { key: "demandFew", attributes: { "data-state": "demand", "data-demand": "few" } },
  { key: "demandMany", attributes: { "data-state": "demand", "data-demand": "many" } },
  { key: "demandFull", attributes: { "data-state": "demand", "data-demand": "full" } },
  {
    key: "allocated",
    attributes: { "data-state": "allocated" },
    icon: <IconCheck size={IconSize.ExtraSmall} />,
  },
  {
    key: "affecting",
    attributes: { "data-state": "affecting" },
    icon: <IconLock size={IconSize.ExtraSmall} />,
  },
  { key: "selection", attributes: { "data-selected": "" } },
  {
    key: "highlightRange",
    attributes: { "data-highlight": "range", "data-highlight-start": "", "data-highlight-end": "" },
  },
  {
    key: "highlightAllocation",
    attributes: { "data-highlight": "allocation", "data-highlight-start": "", "data-highlight-end": "" },
  },
];

/**
 * What every colour, icon and frame in the grid means. An allocated and a taken cell share a shape of their own,
 * so the legend is not optional.
 */
function AllocationLegend(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <LegendList data-testid="allocation-calendar__legend">
      {LEGEND_ROWS.map(({ key, attributes, icon }) => (
        <LegendItem key={key}>
          <LegendBox {...attributes} aria-hidden="true">
            {icon}
          </LegendBox>
          <span>{t(`allocation:calendar.legend.${key}`)}</span>
        </LegendItem>
      ))}
    </LegendList>
  );
}
