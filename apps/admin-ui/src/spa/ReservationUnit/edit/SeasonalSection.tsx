import React from "react";
import { Button, Checkbox, IconMinus, IconPlus } from "hds-react";
import styled, { css } from "styled-components";
import { Controller, UseFormReturn } from "react-hook-form";
import { TimeInput } from "common/src/components/form/TimeInput";
import { IconButton } from "common/src/components";
import { breakpoints } from "common";
import { fontBold } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import { ReservationUnitEditFormValues, getTranslatedError } from "./form";
import { Accordion } from "@/component/Accordion";

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
  @media (width > ${breakpoints.xl}) {
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
  align-items: end;
  display: grid;
  grid: subgrid / subgrid;
  grid-area: a;

  /* use more margin instead of gap because we have invisible columns (mobile is vertical layout) */
  margin-bottom: var(--spacing-xs);
  gap: var(--spacing-2-xs);

  @media (width > ${breakpoints.xl}) {
    grid-column-end: unset;
    grid-row: 1 / -1;
    margin: 0 var(--spacing-l);
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
  align-self: end;
`;
const AndSpan = styled.span`
  ${alignToInput}
  display: none;
  @media (width > ${breakpoints.xl}) {
    display: inline-block;
  }
`;

const DayLabel = styled.span`
  ${fontBold}
  ${alignToInput}
  font-size: var(--fontsize-body-xl);
  grid-area: day;
  margin-bottom: var(--spacing-xs);
  @media (width > ${breakpoints.xl}) {
    margin-bottom: 0;
  }
`;

const Controls = styled.div`
  grid-area: controls;
  display: grid;
  padding-bottom: 0.25rem;
  grid: subgrid / subgrid;
  align-items: end;
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
  const { control, unregister, register, setValue, trigger, watch, formState } =
    form;
  const { errors } = formState;
  const { t } = useTranslation();

  const day = watch(`seasons.${index}`);

  const handleAddTime = () => {
    const times = day.reservableTimes;
    const i = times.length;
    register(`seasons.${index}.reservableTimes.${i}.begin`);
    register(`seasons.${index}.reservableTimes.${i}.end`);
    setValue(`seasons.${index}.reservableTimes.${i}.begin`, "", {
      shouldTouch: true,
      shouldDirty: true,
    });
    setValue(`seasons.${index}.reservableTimes.${i}.end`, "", {
      shouldTouch: true,
      shouldDirty: true,
    });
  };

  const handleRemoveTime = () => {
    const times = day.reservableTimes;
    const i = times.length - 1;
    // no other way to dirty the form when unregistering
    setValue(`seasons.${index}.reservableTimes.${i}.begin`, "invalid", {
      shouldTouch: true,
      shouldDirty: true,
    });
    setValue(`seasons.${index}.reservableTimes.${i}.end`, "invalid", {
      shouldTouch: true,
      shouldDirty: true,
    });
    unregister(`seasons.${index}.reservableTimes.${i}`);
  };

  const isClosed = watch(`seasons.${index}.closed`);

  return (
    <SeasonRowWrapper>
      <DayLabel>{t(`dayLong.${day.weekday}`)}</DayLabel>
      {day.reservableTimes.map((time, i) => {
        if (time?.begin == null || time.end == null) {
          return null;
        }
        // we only have two fields but unregister makes i > 1
        const area = i > 0 ? `a1` : "a0";
        return (
          <>
            {i !== 0 && <AndSpan>{t("common.and")}</AndSpan>}
            {/* eslint-disable-next-line react/no-array-index-key -- TODO key */}
            <SeasonalTimeWrapper key={i} style={{ gridArea: area }}>
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
                    // id={`seasons.${index}.begin`}
                    disabled={isClosed}
                    label={t("ReservationUnitEditor.label.openingTime")}
                    error={getTranslatedError(
                      errors.seasons?.[index]?.reservableTimes?.[i]?.begin
                        ?.message,
                      t
                    )}
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
                    // id={`seasons.${index}.end`}
                    disabled={isClosed}
                    label={t("ReservationUnitEditor.label.closingTime")}
                    error={getTranslatedError(
                      errors.seasons?.[index]?.reservableTimes?.[i]?.end
                        ?.message,
                      t
                    )}
                  />
                )}
              />
            </SeasonalTimeWrapper>
          </>
        );
      })}
      <Controls>
        <Controller
          control={control}
          name={`seasons.${index}.closed`}
          render={({ field: { value, onChange, onBlur } }) => (
            <Checkbox
              id={`seasons.${index}.closed`}
              label={t("ReservationUnitEditor.closed")}
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
        {day.reservableTimes.filter((v) => v != null).length < 2 ? (
          <IconButton
            onClick={handleAddTime}
            disabled={isClosed}
            label={t("ReservationUnitEditor.addSeasonalTime")}
            icon={<IconPlus />}
          />
        ) : (
          <IconButton
            onClick={handleRemoveTime}
            disabled={isClosed}
            label={t("ReservationUnitEditor.removeSeasonalTime")}
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
  @media (width > ${breakpoints.xl}) {
    gap: var(--spacing-2-xl);
  }
`;

export function SeasonalSection({
  form,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
}): JSX.Element {
  const { t } = useTranslation();
  const { setValue, watch } = form;

  const seasons = watch("seasons");
  if (seasons.length !== 7) {
    // eslint-disable-next-line no-console
    console.warn("Seasons should always have 7 days");
  }

  const handleClear = () => {
    const val = Array.from(Array(7)).map((_, i) => ({
      pk: 0,
      weekday: i,
      closed: false,
      reservableTimes: [{ begin: "", end: "" }],
    }));
    setValue("seasons", val, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <Accordion
      open={false}
      heading={t("ReservationUnitEditor.seasonalTimesTitle")}
    >
      <SeasonalInnerWrapper>
        <p>{t("ReservationUnitEditor.seasonalTimesDescription")}</p>
        {seasons.map((day, index) => (
          <SeasonRow key={day.weekday} form={form} index={index} />
        ))}
        <div>
          <Button variant="secondary" theme="black" onClick={handleClear}>
            {t("ReservationUnitEditor.clearSeasonalTimes")}
          </Button>
        </div>
      </SeasonalInnerWrapper>
    </Accordion>
  );
}
