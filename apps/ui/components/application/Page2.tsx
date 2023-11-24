import React, { useState } from "react";
import { IconArrowRight, Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import type { ApplicationEventSchedulePriority } from "common/types/common";
import type {
  ApplicationEventScheduleNode,
  ApplicationNode,
  Query,
  QueryReservationByPkArgs,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { useQuery } from "@apollo/client";
import { MediumButton } from "@/styles/util";
import { getReadableList } from "@/modules/util";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { TimeSelector } from "./TimeSelector";
import { ButtonContainer } from "../common/common";
import type {
  ApplicationEventFormValue,
  ApplicationEventScheduleFormType,
  ApplicationFormValues,
} from "./Form";
import { RESERVATION_UNIT } from "@/modules/queries/reservationUnit";

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

const SubHeading = styled.p`
  margin-top: var(--spacing-2-xs);
`;

const StyledNotification = styled(Notification)`
  margin-top: var(--spacing-m);
`;

const cellLabel = (row: number): string => {
  return `${row} - ${row + 1}`;
};

const getListOfApplicationEventTitles = (
  applicationEvents: ApplicationEventFormValue[],
  ids: number[]
): string => {
  return getReadableList(ids.map((id) => `"${applicationEvents[id].name}"`));
};

const applicationEventSchedulesToCells = (
  applicationEventSchedules: ApplicationEventScheduleFormType[],
  openingHours?: DailyOpeningHours
): Cell[][] => {
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
    // state is 50 if the cell is outside of the opening hours, 100 if it's inside
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

  applicationEventSchedules.forEach((applicationEventSchedule) => {
    const { day } = applicationEventSchedule;
    if (day == null) {
      return;
    }
    const hourBegin =
      Number(applicationEventSchedule.begin.substring(0, 2)) - firstSlotStart;

    const hourEnd =
      (Number(applicationEventSchedule.end.substring(0, 2)) || 24) -
      firstSlotStart;

    const { priority } = applicationEventSchedule;
    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day][h];
      cell.state = (priority ?? 100) as ApplicationEventSchedulePriority;
    }
  });

  return cells;
};

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

// TODO the return type is not good (it's gql type, but it doesn't really match the data)
// better to use a custom type here and convert it when sending / receiving from backend
const cellsToApplicationEventSchedules = (
  cells: Cell[][]
): ApplicationEventScheduleNode[] => {
  const daySchedules: ApplicationEventScheduleNode[] = [];
  for (let day = 0; day < cells.length; day += 1) {
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
          id: "",
          priority: cell.priority,
          declined: false,
        };
      })
      .forEach((e) => daySchedules.push(e));
  }
  return daySchedules;
};

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
  applicationEvents: ApplicationEventFormValue[],
  selectorData: Cell[][][]
): number[] => {
  const selectedHours = getLongestChunks(selectorData);
  return applicationEvents
    .map((applicationEvent, index) => {
      const minDuration =
        applicationEvent.minDuration ??
        0; /* applicationEvent.minDuration != null
        ? convertHMSToSeconds(applicationEvent.minDuration)
        : 0 */
      return selectedHours[index] < minDuration / 3600 ? index : null;
    })
    .filter((n): n is NonNullable<typeof n> => n != null);
};

const Page2 = ({ application, onNext }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { data: applicationRound } = useQuery<Query, QueryReservationByPkArgs>(
    RESERVATION_UNIT,
    {
      variables: {
        pk: application.applicationRound.pk ?? 0,
      },
      skip: !application.applicationRound.pk,
      fetchPolicy: "no-cache",
    }
  );
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [minDurationMsg, setMinDurationMsg] = useState(true);
  const router = useRouter();
  const openingHours =
    applicationRound?.reservationUnitByPk?.applicationRoundTimeSlots ?? [];

  const { getValues, setValue, watch, handleSubmit } =
    useFormContext<ApplicationFormValues>();

  const applicationEvents = filterNonNullable(watch("applicationEvents"));

  const selectorData = applicationEvents.map((ae) =>
    applicationEventSchedulesToCells(ae.applicationEventSchedules, openingHours)
  );
  const setSelectorData = (selected: typeof selectorData) => {
    // So this returns them as:
    // applicationEvents (N)
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
      const val = appEventSchedule.map((appEvent) => {
        const { day } = appEvent;
        // debug check
        if (day == null || day < 0 || day > 6) {
          throw new Error("Day is out of range");
        }
        return {
          begin: appEvent.begin,
          end: appEvent.end,
          // The default will never happen (it's already filtered)
          // TODO type this better
          priority: appEvent.priority,
          day: day as Day,
        };
      });
      setValue(`applicationEvents.${i}.applicationEventSchedules`, val);
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
      applicationEvents,
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
      {applicationEvents.map((event, index) => {
        // TODO there is something funny with this one on the first render
        // (it's undefined and not Array as expected).
        const schedules =
          getValues(`applicationEvents.${index}.applicationEventSchedules`) ??
          [];
        const summaryDataPrimary = schedules.filter((n) => n.priority === 300);
        const summaryDataSecondary = schedules.filter(
          (n) => n.priority === 200
        );
        return (
          <Accordion
            open={index === 0}
            key={event.pk ?? "NEW"}
            id={`timeSelector-${index}`}
            heading={event.name || undefined}
            theme="thin"
          >
            <SubHeading>{t("application:Page2.subHeading")}</SubHeading>
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
              copyCells={applicationEvents.length > 1 ? copyCells : null}
              resetCells={() => resetCells(index)}
              summaryData={[summaryDataPrimary, summaryDataSecondary]}
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
          {applicationEvents?.length === 1
            ? t("application:Page2.notification.minDuration.bodySingle")
            : t("application:Page2.notification.minDuration.body", {
                title: getListOfApplicationEventTitles(
                  applicationEvents,
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
