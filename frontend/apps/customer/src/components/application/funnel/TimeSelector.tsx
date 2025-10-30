import React from "react";
import { useTranslation } from "next-i18next";
import { Button, ButtonSize, ButtonVariant, Notification, NotificationSize } from "hds-react";
import { useFormContext } from "react-hook-form";
import { AutoGrid, Flex } from "ui/src/styled";
import { filterNonNullable } from "ui/src/modules/helpers";
import { ControlledSelect } from "ui/src/components/form";
import {
  ApplicationTimeSelector,
  type Cell,
  type CellState,
  isCellEqual,
} from "ui/src/components/ApplicationTimeSelector";
import { successToast } from "ui/src/components/toast";
import { ErrorText } from "ui/src/components/ErrorText";
import { type TimeSelectorFragment } from "@gql/gql-types";
import { gql } from "@apollo/client";
import { aesToCells, covertCellsToTimeRange } from "./timeSelectorModule";
import { type ApplicationPage2FormValues } from "./form";
import { TimePreview } from ".";
import { convertWeekday } from "ui/src/modules/conversion";

export type TimeSelectorProps = {
  index: number;
  reservationUnitOptions: { label: string; value: number }[];
  reservationUnitOpeningHours: Readonly<TimeSelectorFragment[]>;
};

export function TimeSelectorForm({
  index,
  reservationUnitOptions,
  reservationUnitOpeningHours,
}: TimeSelectorProps): JSX.Element | null {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext<ApplicationPage2FormValues>();

  const setSelectorData = (index: number, selected: Readonly<Readonly<Cell[]>[]>) => {
    const formVals = covertCellsToTimeRange(selected);
    setValue(`applicationSections.${index}.suitableTimeRanges`, formVals, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const handleCellUpdate = (selection: Cell, value: CellState) => {
    const { weekday } = selection;
    const dayNumber = convertWeekday(weekday);
    const times = watch(`applicationSections.${index}.suitableTimeRanges`);
    const tmp = aesToCells(times, reservationUnitOpeningHours);
    if (tmp[dayNumber] == null) {
      throw new Error("day not found");
    }
    // TODO this is confusing
    //  the final conversion changes "open" to "unavailable" if needed but it's still confusing
    //  and we rely on the conversion function here
    //  problem: we don't known opening hours at this point
    //  - would have to refactor the cell type to include the open state e.g. separate selection and open state
    const cellIndex = tmp[dayNumber].findIndex((cell) => isCellEqual(cell, selection));
    if (cellIndex === -1) {
      throw new Error("cell not found");
    }
    const cell = tmp[dayNumber][cellIndex];
    if (cell != null) {
      cell.state = value;
      setSelectorData(index, tmp);
    }
  };

  const copyCells = () => {
    const times = watch(`applicationSections.${index}.suitableTimeRanges`);
    const srcCells = aesToCells(times, reservationUnitOpeningHours);
    const others = watch(`applicationSections`);
    for (const i of others.keys()) {
      setSelectorData(i, srcCells);
    }
    successToast({
      text: t("application:Page2.notification.copyCells"),
      dataTestId: "application__page2--notification-success",
    });
  };

  const cells = aesToCells(watch("applicationSections")[index]?.suitableTimeRanges ?? [], reservationUnitOpeningHours);
  const priority = watch(`applicationSections.${index}.priority`);

  const enableCopyCells = filterNonNullable(watch("applicationSections")).length > 1;

  return (
    // NOTE flex inside a grid container breaks overflow-x
    <Flex style={{ display: "grid" }} $marginTop="m">
      <Notification label={t("application:Page2.info")} size={NotificationSize.Small} type="info">
        {t("application:Page2.info")}
      </Notification>
      <OptionSelector reservationUnitOptions={reservationUnitOptions} index={index} />
      <ApplicationTimeSelector
        cells={cells}
        onCellUpdate={handleCellUpdate}
        selectedPriority={priority}
        aria-label={t("application:TimeSelector.calendarLabel")}
      />
      <div data-testid={`time-selector__preview-${index}`}>
        <TimePreview index={index} />
      </div>
      {enableCopyCells && (
        <div>
          <Button
            id={`time-selector__button--copy-cells-${index}`}
            variant={ButtonVariant.Secondary}
            onClick={copyCells}
            size={ButtonSize.Small}
          >
            {t("application:Page2.copyTimes")}
          </Button>
        </div>
      )}
      <ErrorMessage index={index} />
    </Flex>
  );
}

function OptionSelector({
  reservationUnitOptions,
  index,
}: Pick<TimeSelectorProps, "reservationUnitOptions" | "index">) {
  const { t } = useTranslation();
  const { control } = useFormContext<ApplicationPage2FormValues>();

  const priorityOptions = ["primary", "secondary"].map((n) => ({
    label: t(`application:Page2.priorityLabels.${n}`),
    value: n,
  }));

  return (
    <AutoGrid $minWidth="20rem" data-testid={`time-selector__options-${index}`}>
      <ControlledSelect
        name={`applicationSections.${index}.priority`}
        label={t("application:Page2.prioritySelectLabel")}
        control={control}
        options={priorityOptions}
      />
      <ControlledSelect
        name={`applicationSections.${index}.reservationUnitPk`}
        label={t("application:Page2.reservationUnitSelectLabel")}
        control={control}
        options={reservationUnitOptions}
      />
    </AutoGrid>
  );
}

function ErrorMessage({ index }: { index: number }): JSX.Element | null {
  const { t } = useTranslation();
  const fieldName = `applicationSections.${index}.suitableTimeRanges` as const;
  const { getFieldState } = useFormContext<ApplicationPage2FormValues>();
  const state = getFieldState(fieldName);
  if (!state.invalid) {
    return null;
  }
  const errorMsg = state.error?.message;
  const msg = errorMsg ? t(`application:validation.calendar.${errorMsg}`) : t("errors:general_error");

  return (
    <ErrorText
      size={NotificationSize.Medium}
      title={t("application:validation.calendar.title")}
      data-testid="application__page2--notification-min-duration"
    >
      {msg}
    </ErrorText>
  );
}

export const TIME_SELECTOR_FRAGMENT = gql`
  fragment TimeSelector on ApplicationRoundTimeSlotNode {
    id
    weekday
    isClosed
    reservableTimes {
      begin
      end
    }
  }
`;
