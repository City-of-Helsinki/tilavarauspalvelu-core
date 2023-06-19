import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Accordion, RadioButton, SelectionGroup, TextArea } from "hds-react";
import type { ReservationUnitType } from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { type ReservationFormType, ReservationTypes } from "app/schemas";
import {
  ReservationMetadataSetForm,
  ReserverMetadataSetForm,
} from "./MetadataSetForm";
import BufferToggles from "./BufferToggles";
import { Element } from "./MyUnitRecurringReservation/commonStyling";
import ShowTOS from "./ShowTOS";
import { HR } from "../lists/components";

const CommentsTextArea = styled(TextArea)`
  grid-column: 1 / -1;
  max-width: var(--prose-width);
`;

const ButtonLikeAccordion = styled(Accordion)`
  && {
    border: none;
  }
  & > div:first-of-type {
    margin: 0;
    padding: 0;
  }
  & > div:first-of-type > div > div {
    justify-content: left;
    gap: 1rem;
    color: var(--color-bus);
    font-weight: 500;
    & span {
      font-size: 1rem;
    }
  }
`;

const TypeSelect = ({
  reservationUnit,
}: {
  reservationUnit: ReservationUnitType;
}) => {
  const {
    watch,
    control,
    formState: { errors },
  } = useFormContext<ReservationFormType>();
  const { t } = useTranslation();

  const type = watch("type");

  if (type === "NORMAL") {
    return <p>{t("reservationApplication:clientReservationCantBeChanged")}</p>;
  }

  return (
    <Controller
      name="type"
      control={control}
      render={({ field }) => (
        <SelectionGroup
          required
          disabled={reservationUnit == null}
          label={t("reservationApplication:type")}
          errorText={
            errors.type?.message != null
              ? t(`reservationForm:errors.${errors.type?.message}`)
              : ""
          }
        >
          {ReservationTypes.filter((x) => x !== "NORMAL").map((v) => (
            <RadioButton
              key={v}
              id={v}
              checked={v === field.value}
              label={t(`reservationApplication:reservationType.${v}`)}
              onChange={() => field.onChange(v)}
            />
          ))}
        </SelectionGroup>
      )}
    />
  );
};

// TODO are buffers in different places for Recurring and Single reservations? Check the UI spec
const ReservationTypeForm = ({
  reservationUnit,
  children,
}: {
  reservationUnit: ReservationUnitType;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();

  const { watch, register } = useFormContext<ReservationFormType>();

  const type = watch("type");

  return (
    <>
      <Element $wide>
        <TypeSelect reservationUnit={reservationUnit} />
      </Element>
      {type === "BLOCKED" && (
        <CommentsTextArea
          label={t("reservationApplication:comment")}
          id="reservationApplication:comment"
          {...register("comments")}
        />
      )}
      {type !== undefined && type !== "BLOCKED" && (
        <>
          {(reservationUnit.bufferTimeBefore ||
            reservationUnit.bufferTimeAfter) && (
            <BufferToggles
              before={reservationUnit.bufferTimeBefore ?? undefined}
              after={reservationUnit.bufferTimeAfter ?? undefined}
            />
          )}
          {children}
          <CommentsTextArea
            id="reservationApplication:comment"
            label={t("reservationApplication:comment")}
            {...register("comments")}
          />
          <HR style={{ gridColumn: "1 / -1" }} />
          <Element $wide>
            <div style={{ marginBottom: 48 }}>
              <ReservationMetadataSetForm reservationUnit={reservationUnit} />
            </div>
            {type === "STAFF" ? (
              <ButtonLikeAccordion
                size="s"
                heading={t("MyUnits.ReservationForm.showReserver")}
              >
                <ReserverMetadataSetForm reservationUnit={reservationUnit} />
                <HR style={{ gridColumn: "1 / -1" }} />
                <ShowTOS reservationUnit={reservationUnit} />
              </ButtonLikeAccordion>
            ) : (
              <>
                <ReserverMetadataSetForm reservationUnit={reservationUnit} />
                <HR style={{ gridColumn: "1 / -1" }} />
                <ShowTOS reservationUnit={reservationUnit} />
              </>
            )}
          </Element>
        </>
      )}
    </>
  );
};

export default ReservationTypeForm;
