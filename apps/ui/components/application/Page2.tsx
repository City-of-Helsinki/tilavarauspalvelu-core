import React, { useState } from "react";
import { IconArrowRight, Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import type { ApplicationEventSchedulePriority } from "common/types/common";
import { Priority, type ApplicationNode } from "common/types/gql-types";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import type {
  ApplicationSectionFormValue,
  ApplicationEventScheduleFormType,
  ApplicationFormValues,
  SuitableTimeRangeFormValues,
} from "./Form";
import { getTranslationSafe } from "common/src/common/util";
import {
  convertWeekday,
  transformWeekday,
  type Day,
} from "common/src/conversion";
import { MediumButton } from "@/styles/util";
import { getReadableList } from "@/modules/util";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { TimeSelector } from "./TimeSelector";
import { ButtonContainer } from "../common/common";

type Props = {
  application: ApplicationNode;
  onNext: (appToSave: ApplicationFormValues) => void;
};

type OpeningHourPeriod = {
  begin: string;
  end: string;
} | null;

type DailyOpeningHours =
  | {
      closed: boolean;
      reservableTimes?: OpeningHourPeriod[] | null;
    }[]
  | null;

const StyledNotification = styled(Notification)`
  margin-top: var(--spacing-m);
`;

const cellLabel = (row: number): string => {
  return `${row} - ${row + 1}`;
};

const getListOfApplicationEventTitles = (
  applicationSections: ApplicationSectionFormValue[],
  ids: number[]
): string => {
  return getReadableList(ids.map((id) => `"${applicationSections[id].name}"`));
};

function applicationEventSchedulesToCells(
  schedule: ApplicationEventScheduleFormType[],
  openingHours?: DailyOpeningHours
): Cell[][] {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

  const cells: Cell[][] = [];

  for (let j = 0; j < 7; j += 1) {
    const day = [];
    const dayOpeningHours =
      openingHours?.[j]?.reservableTimes?.map((t) => {
        return {
          begin: t && +t.begin.split(":")[0],
          end: t && +t.end.split(":")[0] === 0 ? 24 : t && +t.end.split(":")[0],
        };
      }) ?? [];
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

  schedule.forEach((applicationEventSchedule) => {
    const { day, priority } = applicationEventSchedule;
    if (day == null) {
      return;
    }
    const hourBegin =
      Number(applicationEventSchedule.begin.substring(0, 2)) - firstSlotStart;

    const hourEnd =
      (Number(applicationEventSchedule.end.substring(0, 2)) || 24) -
      firstSlotStart;

    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day][h];
      cell.state = (priority ?? 100) as ApplicationEventSchedulePriority;
    }
  });

  return cells;
}

const formatNumber = (n: number): string => `0${n > 23 ? 0 : n}`.slice(-2);

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

// TODO improve the typing
type ApplicationEventScheduleType = {
  day: Day;
  begin: string;
  end: string;
  priority: number;
};

// TODO the return type is not good (it's gql type, but it doesn't really match the data)
// better to use a custom type here and convert it when sending / receiving from backend
function cellsToApplicationEventSchedules(
  cells: Cell[][]
): ApplicationEventScheduleType[] {
  const daySchedules: ApplicationEventScheduleType[] = [];
  if (cells.length > 7) {
    throw new Error("Too many days");
  }
  for (let day: Day = 0; day < cells.length; day += 1) {
    const dayCells = cells[day];
    dayCells
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
      .map((cell) => {
        return {
          day,
          begin: `${formatNumber(cell.begin)}:00`,
          end: `${formatNumber(cell.end)}:00`,
          priority: cell.priority,
        };
      })
      .forEach((e) => daySchedules.push(e));
  }
  return daySchedules;
}

const getLongestChunks = (selectorData: Cell[][][]): number[] =>
  selectorData.map((n) => {
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

const getApplicationEventsWhichMinDurationsIsNotFulfilled = (
  applicationSections: ApplicationSectionFormValue[],
  selectorData: Cell[][][]
): number[] => {
  const selectedHours = getLongestChunks(selectorData);
  return filterNonNullable(
    applicationSections.map((ae, index) => {
      const minDuration = ae.minDuration ?? 0;
      return selectedHours[index] < minDuration / 3600 ? index : null;
    })
  );
};

const Page2 = ({ application, onNext }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const [reservationUnitPk, setReservationUnitPk] = useState<number>(
    application?.applicationSections?.[0]?.reservationUnitOptions?.[0]
      ?.reservationUnit?.pk ?? 0
  );
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [minDurationMsg, setMinDurationMsg] = useState(true);
  const router = useRouter();
  // TODO why are we taking the first one only here?
  const applicationSection = application?.applicationSections?.[0] ?? null;
  const resUnitOptions = filterNonNullable(
    applicationSection?.reservationUnitOptions
  );
  // TODO check for nulls in the subfields
  const resUnits = filterNonNullable(
    resUnitOptions.map((n) => n?.reservationUnit)
  );
  const reservationUnitOptions = resUnits.map((n) => ({
    value: n?.pk ?? 0,
    label: getTranslationSafe(n, "name", getLocalizationLang(i18n.language)),
  }));
  // TODO why is this done like this?
  const openingHours = filterNonNullable(
    resUnits.find((n) => n.pk === reservationUnitPk)?.applicationRoundTimeSlots
  );

  const { getValues, setValue, watch, handleSubmit } =
    useFormContext<ApplicationFormValues>();

  const applicationSections = filterNonNullable(watch("applicationSections"));

  // TODO type properly the input and move to free function
  const convertToSchedule = (
    b: (typeof applicationSections)[0]
  ): ApplicationEventScheduleFormType[] => {
    return b.suitableTimeRanges.map((range) => {
      return {
        day: range ? convertWeekday(range.dayOfTheWeek) : 0,
        begin: range?.beginTime ?? "",
        end: range?.endTime ?? "",
        priority: range?.priority === Priority.Primary ? 300 : 200,
      };
    });
  };
  const selectorData = applicationSections.map((ae) =>
    applicationEventSchedulesToCells(convertToSchedule(ae), openingHours)
  );
  const setSelectorData = (selected: typeof selectorData) => {
    // So this returns them as:
    // applicationSections (N)
    // - ApplicationEventSchedule[][]: Array(7) (i is the day)
    // - ApplicationEventSchedule[]: Array(M) (j is the continuous block)
    // priority: 200 | 300 (200 is secondary, 300 is primary)
    // priority: 100 (? assuming it's not selected)
    const selectedAppEvents = selected
      .map((cell) => cellsToApplicationEventSchedules(cell))
      .map((aes) =>
        aes.filter((ae) => ae.priority === 300 || ae.priority === 200)
      );
    // this seems to work except
    // TODO: day is incorrect (empty days at the start are missing, and 200 / 300 priority on the same day gets split into two days)
    // TODO refactor the Cell -> ApplicationEventSchedule conversion to use FormTypes
    selectedAppEvents.forEach((appEventSchedule, i) => {
      const val: SuitableTimeRangeFormValues[] = appEventSchedule.map(
        (appEvent) => {
          const { day } = appEvent;
          // debug check
          if (day == null || day < 0 || day > 6) {
            throw new Error("Day is out of range");
          }
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
      setValue(`applicationSections.${i}.suitableTimeRanges`, val);
    });
  };

  const updateCells = (index: number, newCells: Cell[][]) => {
    const updated = [...selectorData];
    updated[index] = newCells;
    setSelectorData(updated);
  };

  // TODO should remove the cell not set a priority
  const resetCells = (index: number) => {
    const updated = [...selectorData];
    updated[index] = selectorData[index].map((n) =>
      n.map((nn) => ({ ...nn, state: 100 }))
    );
    setSelectorData(updated);
  };

  const copyCells = (index: number) => {
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
    setErrorMsg("");
    setSuccessMsg(t("application:Page2.notification.copyCells"));
  };

  const onSubmit = (data: ApplicationFormValues) => {
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
      setSuccessMsg("");
      setErrorMsg("application:error.missingSchedule");
      return;
    }
    onNext(data);
  };

  const applicationEventsForWhichMinDurationIsNotFulfilled: number[] =
    getApplicationEventsWhichMinDurationsIsNotFulfilled(
      applicationSections,
      selectorData
    );

  const shouldShowMinDurationMessage =
    minDurationMsg &&
    applicationEventsForWhichMinDurationIsNotFulfilled.some((d) => d != null);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      {successMsg && (
        <Notification
          type="success"
          label={t(successMsg)}
          aria-label={t(successMsg)}
          position="top-center"
          autoClose
          autoCloseDuration={3000}
          displayAutoCloseProgress={false}
          onClose={() => setSuccessMsg("")}
          dismissible
          closeButtonLabelText={t("common:close")}
          dataTestId="application__page2--notification-success"
        />
      )}
      {errorMsg && (
        <Notification
          type="error"
          label={t(errorMsg)}
          position="top-center"
          autoClose
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg("")}
          dismissible
          closeButtonLabelText={t("common:close")}
          dataTestId="application__page2--notification-error"
        >
          {t(errorMsg)}
        </Notification>
      )}
      {applicationSections.map((event, index) => {
        // TODO there is something funny with this one on the first render
        // (it's undefined and not Array as expected).
        const schedules =
          getValues(`applicationSections.${index}.suitableTimeRanges`) ?? [];
        const summaryDataPrimary = schedules
          .filter((n) => n.priority === Priority.Primary)
          .map((a) => ({
            begin: a.beginTime,
            end: a.endTime,
            priority: 300,
            day: convertWeekday(a.dayOfTheWeek),
          }));
        const summaryDataSecondary = schedules
          .filter((n) => n.priority === Priority.Secondary)
          .map((a) => ({
            begin: a.beginTime,
            end: a.endTime,
            priority: 200,
            day: convertWeekday(a.dayOfTheWeek),
          }));
        return (
          <Accordion
            open={index === 0}
            key={event.pk ?? "NEW"}
            id={`timeSelector-${index}`}
            heading={event.name || undefined}
            theme="thin"
          >
            <StyledNotification
              label={t("application:Page2.info")}
              size="small"
              type="info"
            >
              {t("application:Page2.info")}
            </StyledNotification>
            <TimeSelector
              index={index}
              cells={selectorData[index]}
              updateCells={updateCells}
              copyCells={applicationSections.length > 1 ? copyCells : null}
              resetCells={() => resetCells(index)}
              summaryData={[summaryDataPrimary, summaryDataSecondary]}
              reservationUnitOptions={reservationUnitOptions}
              reservationUnitPk={reservationUnitPk}
              setReservationUnitPk={setReservationUnitPk}
            />
          </Accordion>
        );
      })}
      {shouldShowMinDurationMessage && (
        <Notification
          type="alert"
          label={t("application:Page2.notification.minDuration.title")}
          dismissible
          onClose={() => setMinDurationMsg(false)}
          closeButtonLabelText={t("common:close")}
          dataTestId="application__page2--notification-min-duration"
        >
          {applicationSections?.length === 1
            ? t("application:Page2.notification.minDuration.bodySingle")
            : t("application:Page2.notification.minDuration.body", {
                title: getListOfApplicationEventTitles(
                  applicationSections,
                  applicationEventsForWhichMinDurationIsNotFulfilled
                ),
                count:
                  applicationEventsForWhichMinDurationIsNotFulfilled.length,
              })}
        </Notification>
      )}
      <ButtonContainer>
        <MediumButton
          variant="secondary"
          onClick={() => router.push(`${application.pk}/page1`)}
        >
          {t("common:prev")}
        </MediumButton>
        <MediumButton
          id="button__application--next"
          iconRight={<IconArrowRight />}
          type="submit"
        >
          {t("common:next")}
        </MediumButton>
      </ButtonContainer>
    </form>
  );
};

export default Page2;
