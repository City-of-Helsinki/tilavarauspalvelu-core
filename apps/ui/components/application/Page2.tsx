import React, { useState } from "react";
import {
  Button,
  ButtonVariant,
  IconArrowLeft,
  IconArrowRight,
  Notification,
  NotificationSize,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useForm, useFormContext } from "react-hook-form";
import {
  Priority,
  type ApplicationQuery,
  type ApplicationRoundTimeSlotNode,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import type {
  ApplicationSectionFormValue,
  ApplicationEventScheduleFormType,
  ApplicationFormValues,
  SuitableTimeRangeFormValues,
} from "./Form";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import {
  convertWeekday,
  transformWeekday,
  type Day,
} from "common/src/conversion";
import { getReadableList } from "@/modules/util";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import {
  type ApplicationEventSchedulePriority,
  TimeSelector,
  TimeSelectorFormValues,
} from "./TimeSelector";
import { errorToast, successToast } from "common/src/common/toast";
import { ButtonContainer } from "common/styles/util";
import { getApplicationPath } from "@/modules/urls";

type Node = NonNullable<ApplicationQuery["application"]>;
type Props = {
  application: Node;
  onNext: (appToSave: ApplicationFormValues) => void;
};

type OpeningHourPeriod = {
  begin: string;
  end: string;
} | null;

type DailyOpeningHours = Pick<
  ApplicationRoundTimeSlotNode,
  "weekday" | "closed" | "reservableTimes"
>[];

const StyledNotification = styled(Notification)`
  margin-top: var(--spacing-m);
`;

function cellLabel(row: number): string {
  return `${row} - ${row + 1}`;
}

function getListOfApplicationEventTitles(
  applicationSections: ApplicationSectionFormValue[],
  ids: number[]
): string {
  return getReadableList(ids.map((id) => `"${applicationSections[id].name}"`));
}

function getOpeningHours(
  day: number,
  openingHours?: DailyOpeningHours
): OpeningHourPeriod[] | null {
  if (!openingHours) {
    return null;
  }
  const dayOpeningHours = openingHours.find((oh) => oh.weekday === day);
  if (!dayOpeningHours) {
    return null;
  }
  if (dayOpeningHours.closed) {
    return null;
  }
  return dayOpeningHours.reservableTimes ?? null;
}

function aesToCells(
  schedule: ApplicationEventScheduleFormType[],
  openingHours?: DailyOpeningHours
): Cell[][] {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

  const cells: Cell[][] = [];

  for (let j = 0; j < 7; j += 1) {
    const day: Cell[] = [];
    const openingHoursForADay = getOpeningHours(j, openingHours);
    const dayOpeningHours = filterNonNullable(openingHoursForADay).map((t) => ({
      begin: t && +t.begin.split(":")[0],
      end: t && +t.end.split(":")[0] === 0 ? 24 : t && +t.end.split(":")[0],
    }));
    // state is 50 if the cell is outside the opening hours, 100 if it's inside
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      const isAvailable = dayOpeningHours.some(
        (t) => t.begin != null && t.end != null && t?.begin <= i && t?.end > i
      );
      day.push({
        key: `${i}-${j}`,
        hour: i,
        label: cellLabel(i),
        state: isAvailable ? 100 : 50,
      });
    }
    cells.push(day);
  }

  for (const aes of schedule) {
    const { day, priority } = aes;
    const hourBegin = Number(aes.begin.substring(0, 2)) - firstSlotStart;
    const hourEnd = (Number(aes.end.substring(0, 2)) || 24) - firstSlotStart;
    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day][h];
      if (cell) {
        cell.state = convertPriorityToState(priority);
      }
    }
  }

  return cells;
}

function convertPriorityToState(
  priority: number
): ApplicationEventSchedulePriority {
  switch (priority) {
    case 300:
      return 300;
    case 200:
      return 200;
    default:
      return 100;
  }
}

/// unsafe
function formatNumber(n: number): string {
  if (n < 0) {
    throw new Error("Negative number");
  }
  if (n > 23) {
    return "00";
  }
  if (n < 10) {
    return `0${n}`;
  }
  return `${n}`;
}

type Timespan = {
  begin: number;
  end: number;
  priority: ApplicationEventSchedulePriority;
};

type Cell = {
  hour: number;
  label: string;
  state: ApplicationEventSchedulePriority;
  key: string;
};

type ApplicationEventScheduleType = {
  day: Day;
  begin: string;
  end: string;
  priority: number;
};

function cellsToApplicationEventSchedules(
  cells: Cell[][]
): ApplicationEventScheduleType[] {
  const daySchedules: ApplicationEventScheduleType[] = [];
  if (cells.length > 7) {
    throw new Error("Too many days");
  }
  const range = [0, 1, 2, 3, 4, 5, 6] as const;
  for (const day of range) {
    const dayCells = cells[day];
    const transformedDayCells = dayCells
      .filter((cell) => cell.state)
      .map((cell) => ({
        begin: cell.hour,
        end: cell.hour + 1,
        priority: cell.state,
      }))
      .reduce<Timespan[]>((prev, current) => {
        if (!prev.length) {
          return [current];
        }
        if (
          prev[prev.length - 1].end === current.begin &&
          prev[prev.length - 1].priority === current.priority
        ) {
          return [
            ...prev.slice(0, prev.length - 1),
            {
              begin: prev[prev.length - 1].begin,
              end: prev[prev.length - 1].end + 1,
              priority: prev[prev.length - 1].priority,
            },
          ];
        }
        return [...prev, current];
      }, [])
      .map((cell) => ({
        day,
        begin: `${formatNumber(cell.begin)}:00`,
        end: `${formatNumber(cell.end)}:00`,
        priority: cell.priority,
      }));
    daySchedules.push(...transformedDayCells);
  }
  return daySchedules;
}

function getLongestChunks(selectorData: Cell[][][]): number[] {
  return selectorData.map((n) => {
    const primarySchedules = cellsToApplicationEventSchedules(
      n.map((nn) => nn.filter((nnn) => nnn.state === 300))
    );
    const secondarySchedules = cellsToApplicationEventSchedules(
      n.map((nn) => nn.filter((nnn) => nnn.state === 200))
    );

    return [...primarySchedules, ...secondarySchedules].reduce((acc, cur) => {
      const start = parseInt(cur.begin, 10);
      const end = cur.end === "00:00" ? 24 : parseInt(cur.end, 10);
      const length = end - start;
      return length > acc ? length : acc;
    }, 0);
  });
}

function getApplicationEventsWhichMinDurationsIsNotFulfilled(
  applicationSections: ApplicationSectionFormValue[]
): number[] {
  const selected = applicationSections.map((ae) =>
    aesToCells(convertToSchedule(ae))
  );
  const selectedHours = getLongestChunks(selected);
  return filterNonNullable(
    applicationSections.map((ae, index) => {
      const minDuration = ae.minDuration ?? 0;
      return selectedHours[index] < minDuration / 3600 ? index : null;
    })
  );
}

function convertToSchedule(
  b: NonNullable<NonNullable<ApplicationFormValues["applicationSections"]>[0]>
): ApplicationEventScheduleFormType[] {
  return (
    b.suitableTimeRanges?.map((range) => {
      return {
        day: range ? convertWeekday(range.dayOfTheWeek) : 0,
        begin: range?.beginTime ?? "",
        end: range?.endTime ?? "",
        priority: range?.priority === Priority.Primary ? 300 : 200,
      };
    }) ?? []
  );
}

function covertCellsToTimeRange(
  cells: Cell[][][]
): SuitableTimeRangeFormValues[][] {
  // So this returns them as:
  // applicationSections (N)
  // - ApplicationEventSchedule[][]: Array(7) (i is the day)
  // - ApplicationEventSchedule[]: Array(M) (j is the continuous block)
  // priority: 200 | 300 (200 is secondary, 300 is primary)
  // priority: 100 (? assuming it's not selected)
  const selectedAppEvents = cells
    .map((cell) => cellsToApplicationEventSchedules(cell))
    .map((aes) =>
      aes.filter((ae) => ae.priority === 300 || ae.priority === 200)
    );
  // this seems to work except
  // TODO: day is incorrect (empty days at the start are missing, and 200 / 300 priority on the same day gets split into two days)
  // TODO refactor the Cell -> ApplicationEventSchedule conversion to use FormTypes
  return selectedAppEvents.map((appEventSchedule) => {
    const val: SuitableTimeRangeFormValues[] = appEventSchedule.map(
      (appEvent) => {
        const { day } = appEvent;
        return {
          beginTime: appEvent.begin,
          endTime: appEvent.end,
          // The default will never happen (it's already filtered)
          // TODO type this better
          priority:
            appEvent.priority === 300 ? Priority.Primary : Priority.Secondary,
          dayOfTheWeek: transformWeekday(day),
        };
      }
    );
    return val;
  });
}

function Page2({ application, onNext }: Props): JSX.Element {
  const { t } = useTranslation();

  const [minDurationMsg, setMinDurationMsg] = useState(true);
  const router = useRouter();
  const { watch, handleSubmit } = useFormContext<ApplicationFormValues>();

  const onSubmit = (data: ApplicationFormValues) => {
    const selectorData = filterNonNullable(data.applicationSections).map((ae) =>
      aesToCells(convertToSchedule(ae))
    );
    // TODO test the checking of that there is at least one primary or secondary
    // TODO this should be a form refinement, but we need separate refinements
    // for pages or a Page specific checker
    const selectedAppEvents = selectorData
      .map((cell) => cellsToApplicationEventSchedules(cell))
      .map((aes) =>
        aes.filter((ae) => ae.priority === 300 || ae.priority === 200)
      )
      .flat();
    if (selectedAppEvents.length === 0) {
      errorToast({
        label: t("application:error.missingSchedule"),
        text: t("application:error.missingSchedule"),
        dataTestId: "application__page2--notification-error",
      });
      return;
    }
    onNext(data);
  };

  const applicationSections = filterNonNullable(watch("applicationSections"));
  const sectionsNotFullfilled: number[] =
    getApplicationEventsWhichMinDurationsIsNotFulfilled(applicationSections);

  const shouldShowMinDurationMessage =
    minDurationMsg && sectionsNotFullfilled.length > 0;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      {applicationSections.map((section, index) =>
        application?.applicationSections?.[index] != null ? (
          <ApplicationSectionTimePicker
            // TODO if we gonna use this as a key we need to create negative pks for new sections
            key={section.pk ?? 0}
            index={index}
            section={application?.applicationSections[index]}
            enableCopyCells={applicationSections.length > 1}
          />
        ) : null
      )}
      {shouldShowMinDurationMessage && (
        <Notification
          type="alert"
          label={t("application:Page2.notification.minDuration.title")}
          dismissible
          onClose={() => setMinDurationMsg(false)}
          closeButtonLabelText={t("common:close")}
          data-testid="application__page2--notification-min-duration"
          style={{ marginBottom: "var(--spacing-m)" }}
        >
          {applicationSections.length === 1
            ? t("application:Page2.notification.minDuration.bodySingle")
            : t("application:Page2.notification.minDuration.body", {
                title: getListOfApplicationEventTitles(
                  applicationSections,
                  sectionsNotFullfilled
                ),
                count: sectionsNotFullfilled.length,
              })}
        </Notification>
      )}
      <ButtonContainer>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={() =>
            router.push(getApplicationPath(application.pk, "page1"))
          }
          iconStart={<IconArrowLeft />}
        >
          {t("common:prev")}
        </Button>
        <Button
          id="button__application--next"
          iconEnd={<IconArrowRight aria-hidden="true" />}
          type="submit"
        >
          {t("common:next")}
        </Button>
      </ButtonContainer>
    </form>
  );
}

function ApplicationSectionTimePicker({
  index: sectionIndex,
  section,
  enableCopyCells = true,
}: {
  index: number;
  section: NonNullable<Node["applicationSections"]>[0];
  enableCopyCells?: boolean;
}): JSX.Element {
  const { setValue, getValues, watch } =
    useFormContext<ApplicationFormValues>();

  const initialReservationUnitPk =
    section.reservationUnitOptions[0].reservationUnit.pk ?? 0;

  const timeSelectorForm = useForm<TimeSelectorFormValues>({
    defaultValues: {
      reservationUnitPk: initialReservationUnitPk,
      priority: 300,
    },
  });

  const { t, i18n } = useTranslation();
  const language = convertLanguageCode(i18n.language);

  const { watch: timeSelectorWatch } = timeSelectorForm;
  const allOpeningHours = section.reservationUnitOptions.map((ruo) => ({
    pk: ruo.reservationUnit.pk ?? 0,
    openingHours: ruo.reservationUnit.applicationRoundTimeSlots,
  }));

  const reservationUnitOpeningHours =
    allOpeningHours.find((n) => n.pk === timeSelectorWatch("reservationUnitPk"))
      ?.openingHours ?? [];

  const setSelectorData = (selected: Cell[][][]) => {
    const formVals = covertCellsToTimeRange(selected);
    for (const i of formVals.keys()) {
      setValue(`applicationSections.${i}.suitableTimeRanges`, formVals[i]);
    }
  };

  const updateCells = (index: number, newCells: Cell[][]) => {
    const applicationSections = filterNonNullable(watch("applicationSections"));
    const selectorData = applicationSections.map((ae) =>
      aesToCells(convertToSchedule(ae), reservationUnitOpeningHours)
    );
    const updated = [...selectorData];
    updated[index] = newCells;
    setSelectorData(updated);
  };

  // TODO should remove the cell not set a priority
  const resetCells = (index: number) => {
    const applicationSections = filterNonNullable(watch("applicationSections"));
    const selectorData = applicationSections.map((ae) =>
      aesToCells(convertToSchedule(ae), reservationUnitOpeningHours)
    );

    const updated = [...selectorData];
    updated[index] = selectorData[index].map((n) =>
      n.map((nn) => ({ ...nn, state: 100 }))
    );
    setSelectorData(updated);
  };

  const copyCells = (index: number) => {
    const applicationSections = filterNonNullable(watch("applicationSections"));
    const selectorData = applicationSections.map((ae) =>
      aesToCells(convertToSchedule(ae), reservationUnitOpeningHours)
    );

    const updated = [...selectorData];
    const srcCells = updated[index];
    srcCells.forEach((day, i) => {
      day.forEach((cell, j) => {
        const { state } = cell;
        for (let k = 0; k < updated.length; k += 1) {
          if (k !== index) {
            updated[k][i][j].state = state;
          }
        }
      });
    });
    setSelectorData(updated);
    successToast({
      text: t("application:Page2.notification.copyCells"),
      dataTestId: "application__page2--notification-success",
    });
  };

  // TODO there is something funny with this one on the first render
  // (it's undefined and not Array as expected).
  const schedules =
    getValues(`applicationSections.${sectionIndex}.suitableTimeRanges`) ?? [];
  const summaryDataPrimary = schedules
    .filter((n) => n.priority === Priority.Primary)
    .map((a) => ({
      begin: a.beginTime,
      end: a.endTime,
      priority: 300 as const,
      day: convertWeekday(a.dayOfTheWeek),
    }));
  const summaryDataSecondary = schedules
    .filter((n) => n.priority === Priority.Secondary)
    .map((a) => ({
      begin: a.beginTime,
      end: a.endTime,
      priority: 200 as const,
      day: convertWeekday(a.dayOfTheWeek),
    }));

  const reservationUnitOptions = filterNonNullable(
    section.reservationUnitOptions
  )
    .map((n) => n.reservationUnit)
    .map((n) => ({
      value: n?.pk ?? 0,
      label: getTranslationSafe(n, "name", language),
    }));

  const applicationSections = filterNonNullable(watch("applicationSections"));
  const selectorData = applicationSections.map((ae) =>
    aesToCells(convertToSchedule(ae), reservationUnitOpeningHours)
  );

  return (
    <Accordion
      open={sectionIndex === 0}
      key={watch(`applicationSections.${sectionIndex}.pk`) ?? "NEW"}
      id={`timeSelector-${sectionIndex}`}
      heading={watch(`applicationSections.${sectionIndex}.name`) ?? ""}
      theme="thin"
    >
      <StyledNotification
        label={t("application:Page2.info")}
        size={NotificationSize.Small}
        type="info"
      >
        {t("application:Page2.info")}
      </StyledNotification>
      <TimeSelector
        index={sectionIndex}
        cells={selectorData[sectionIndex]}
        updateCells={(cells) => updateCells(sectionIndex, cells)}
        copyCells={enableCopyCells ? () => copyCells(sectionIndex) : undefined}
        resetCells={() => resetCells(sectionIndex)}
        summaryData={[summaryDataPrimary, summaryDataSecondary]}
        reservationUnitOptions={reservationUnitOptions}
        form={timeSelectorForm}
      />
    </Accordion>
  );
}

export default Page2;
