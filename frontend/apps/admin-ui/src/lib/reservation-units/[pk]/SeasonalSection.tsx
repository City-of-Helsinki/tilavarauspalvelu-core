import React, { Fragment } from "react";
import { Button, ButtonVariant, Checkbox, IconMinus, IconPlus } from "hds-react";
import styled, { css } from "styled-components";
import { Controller, useFieldArray, UseFormReturn } from "react-hook-form";
import { TimeInput } from "common/src/components/form/TimeInput";
import { IconButton } from "common/src/components";
import { fontBold } from "common/src/styled";
import { breakpoints, WEEKDAYS_SORTED } from "common/src/modules/const";
import { useTranslation } from "next-i18next";
import { ReservationUnitEditFormValues } from "./form";
import { Accordion } from "@/components/Accordion";
import { getTranslatedError } from "@/modules/util";

const SeasonRowWrapper = styled.div`
  display: grid;

  /* mobile layout is row heavy */
  grid-template-areas:
    "day day"
    "a0 a0"
    "a0 a0"
    "a0 a0"
    "a1 a1"
    "a1 a1"
    "a1 a1"
    "controls controls"
    "controls controls";

  grid-template-columns: repeat(2, auto);
  /* stylelint-disable-next-line declaration-block-no-redundant-longhand-properties */
  grid-template-rows:
    [day] auto
    [a0] auto auto auto
    [a1] auto auto auto
    [controls] auto auto;

  /* can't use gap because it applies to invisible columns also so it creates 3 x gap for some columns
   * can't use row gap either because that creates weird 1rem spacing on mobile
   */
  gap: 0;

  /* difference between xl and l is huge, but l is not enough here
   * container query or responsive grid would fix the responsiveness */
  @media (min-width: ${breakpoints.xl}) {
    grid-template-areas:
      ".   a0 a0 . a1 a1 . ."
      "day a0 a0 b a1 a1 controls controls"
      ".   a0 a0 . a1 a1 . .";

    /* three rows used by the subgrid, label + content + error */
    grid-template-rows: auto auto 1fr;

    /* stylelint-disable-next-line declaration-block-no-redundant-longhand-properties */
    grid-template-columns:
      [day] 11ch
      [a0] min-content
      [a0] min-content
      [b] min-content
      [a1] min-content
      [a1] min-content
      [controls] max-content
      [controls] max-content;
  }
`;

const SeasonalTimeWrapper = styled.div`
  align-items: start;
  display: grid;
  grid: subgrid / subgrid;
  grid-area: a;

  /* use more margin instead of gap because we have invisible columns (mobile is vertical layout) */
  margin-bottom: var(--spacing-s);
  column-gap: var(--spacing-2-xs);

  @media (min-width: ${breakpoints.xl}) {
    grid-column-end: unset;
    grid-row: 1 / -1;
    margin: 0 var(--spacing-m);
  }
`;

const StyledTimeInput = styled(TimeInput)`
  & {
    display: grid;
    grid: subgrid / subgrid;
    grid-row-end: span 3;

    /* increase min-width for error message */

    & > input {
      min-width: 11ch;
    }
  }
`;

// first row is for input labels, align this with the input field itself
const alignToInput = css`
  grid-row-start: 2;
  align-self: center;
`;
const AndSpan = styled.span`
  ${alignToInput};
  display: none;
  @media (min-width: ${breakpoints.xl}) {
    display: inline-block;
  }
`;

const DayLabel = styled.span`
  ${fontBold}
  ${alignToInput}
  font-size: var(--fontsize-body-xl);
  grid-area: day;
  margin-bottom: var(--spacing-xs);
  @media (min-width: ${breakpoints.xl}) {
    margin-bottom: 0;
  }
`;

const Controls = styled.div`
  grid-area: controls;
  display: grid;
  padding-bottom: 0.25rem;
  grid: subgrid / subgrid;
  align-items: center;
  gap: var(--spacing-m);
  justify-content: space-between;

  /* hack to get the IconButton to bottom align */

  & > button > div {
    margin: 0;
    padding: 0;

    > div {
      margin: 0;
      padding: 0;
    }
  }
`;

function SeasonRow({
  form,
  index,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  index: number;
}): JSX.Element {
  const { t } = useTranslation();
  const { control, trigger, watch, formState } = form;
  const { errors } = formState;
  const {
    fields: reservableTimes,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `seasons.${index}.reservableTimes`,
  });
  const day = watch(`seasons.${index}`);

  const handleAddTime = () => {
    append({
      begin: "",
      end: "",
    });
  };

  const handleRemoveTime = () => {
    // Remove always deletes the last item
    remove(reservableTimes.length - 1);
  };

  const isClosed = watch(`seasons.${index}.closed`);

  return (
    <SeasonRowWrapper>
      <DayLabel>{t(`translation:dayLong.${day.weekday}`)}</DayLabel>
      {reservableTimes.map((time, i) => {
        if (time.begin == null || time.end == null) {
          return null;
        }
        return (
          <Fragment key={time.id}>
            {i > 0 && <AndSpan>{t("common:and")}</AndSpan>}
            <SeasonalTimeWrapper style={{ gridArea: `a${i}` }}>
              <Controller
                control={control}
                name={`seasons.${index}.reservableTimes.${i}.begin`}
                render={({ field: { onBlur, ...field } }) => (
                  <StyledTimeInput
                    {...field}
                    onBlur={() => {
                      onBlur();
                      trigger();
                    }}
                    disabled={isClosed}
                    label={t("reservationUnitEditor:label.openingTime")}
                    error={getTranslatedError(t, errors.seasons?.[index]?.reservableTimes?.[i]?.begin?.message)}
                  />
                )}
              />
              <Controller
                control={control}
                name={`seasons.${index}.reservableTimes.${i}.end`}
                render={({ field: { onBlur, ...field } }) => (
                  <StyledTimeInput
                    {...field}
                    onBlur={() => {
                      onBlur();
                      trigger();
                    }}
                    disabled={isClosed}
                    label={t("reservationUnitEditor:label.closingTime")}
                    error={getTranslatedError(t, errors.seasons?.[index]?.reservableTimes?.[i]?.end?.message)}
                  />
                )}
              />
            </SeasonalTimeWrapper>
          </Fragment>
        );
      })}

      <Controls>
        <Controller
          control={control}
          name={`seasons.${index}.closed`}
          render={({ field: { value, onChange, onBlur } }) => (
            <Checkbox
              id={`seasons.${index}.closed`}
              label={t("reservationUnitEditor:closed")}
              checked={value}
              onChange={(e) => {
                onChange(e.target.checked);
                // need to trigger validation manually because this affects the whole day row
                form.trigger();
              }}
              onBlur={onBlur}
            />
          )}
        />
        {reservableTimes.length < 2 ? (
          <IconButton
            onClick={handleAddTime}
            disabled={isClosed}
            label={t("reservationUnitEditor:addSeasonalTime")}
            icon={<IconPlus />}
          />
        ) : (
          <IconButton
            onClick={handleRemoveTime}
            disabled={isClosed}
            label={t("reservationUnitEditor:removeSeasonalTime")}
            icon={<IconMinus />}
          />
        )}
      </Controls>
    </SeasonRowWrapper>
  );
}

const SeasonalInnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  @media (min-width: ${breakpoints.xl}) {
    gap: var(--spacing-2-xl);
  }
`;

export function SeasonalSection({ form }: { form: UseFormReturn<ReservationUnitEditFormValues> }): JSX.Element {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = form;
  const { fields: days, replace } = useFieldArray({ control, name: "seasons" });

  if (days.length !== 7) {
    // eslint-disable-next-line no-console
    console.warn("Seasons should always have 7 days");
  }

  const handleClear = () => {
    // Generate 7 empty days and replace the current seasons
    const val = WEEKDAYS_SORTED.map((weekday) => ({
      pk: 0,
      weekday: weekday,
      closed: false,
      reservableTimes: [{ begin: "", end: "" }],
    }));

    replace(val);
  };

  return (
    <Accordion open={errors.seasons != null} heading={t("reservationUnitEditor:seasonalTimesTitle")}>
      <SeasonalInnerWrapper>
        <p>{t("reservationUnitEditor:seasonalTimesDescription")}</p>

        {days.map((day, index) => (
          <SeasonRow key={day.id} form={form} index={index} />
        ))}

        <div>
          <Button variant={ButtonVariant.Secondary} onClick={handleClear}>
            {t("reservationUnitEditor:clearSeasonalTimes")}
          </Button>
        </div>
      </SeasonalInnerWrapper>
    </Accordion>
  );
}
