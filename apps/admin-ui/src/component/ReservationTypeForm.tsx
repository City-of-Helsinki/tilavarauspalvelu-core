import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Notification, RadioButton, SelectionGroup, TextArea } from "hds-react";
import {
  Authentication,
  type Maybe,
  ReservationTypeChoice,
  type ReservationTypeFormFieldsFragment,
} from "@gql/gql-types";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { type ReservationFormType, ReservationTypes } from "@/schemas";
import { ShowAllContainer } from "common/src/components/";
import {
  ReservationMetadataSetForm,
  ReserverMetadataSetForm,
} from "./MetadataSetForm";
import { BufferToggles } from "./BufferToggles";
import ShowTOS from "./ShowTOS";
import { HR } from "@/component/Table";
import { Element } from "@/styled";
import { gql } from "@apollo/client";

const CommentsTextArea = styled(TextArea)`
  grid-column: 1 / -1;
  max-width: var(--prose-width);
`;

const StyledShowAllContainer = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
`;

function TypeSelect({ isDisabled }: { isDisabled?: boolean }) {
  const {
    watch,
    control,
    formState: { errors },
  } = useFormContext<ReservationFormType>();
  const { t } = useTranslation();

  const type = watch("type");

  if (type === ReservationTypeChoice.Normal) {
    return <p>{t("reservationApplication:clientReservationCantBeChanged")}</p>;
  }

  const allowedTypesChoices = ReservationTypes.filter(
    (x) =>
      x !== ReservationTypeChoice.Normal && x !== ReservationTypeChoice.Seasonal
  );

  return (
    <Controller
      name="type"
      control={control}
      render={({ field }) => (
        <SelectionGroup
          required
          disabled={isDisabled}
          label={t("reservationApplication:type")}
          errorText={
            errors.type?.message != null
              ? t(`reservationForm:errors.${errors.type?.message}`)
              : ""
          }
          tooltipText={t("reservationApplication:typeSelection.tooltip")}
        >
          {allowedTypesChoices.map((v) => (
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
}

// TODO are buffers in different places for Recurring and Single reservations? Check the UI spec
function ReservationTypeForm({
  reservationUnit,
  children,
  disableBufferToggle,
  disableTypeSelect,
}: {
  reservationUnit: Maybe<ReservationTypeFormFieldsFragment> | undefined;
  children?: React.ReactNode;
  disableBufferToggle?: boolean;
  disableTypeSelect?: boolean;
}): JSX.Element | null {
  const { t } = useTranslation();

  const { watch, register } = useFormContext<ReservationFormType>();
  const type = watch("type");

  if (reservationUnit == null) {
    return null;
  }

  const showAuthWarning =
    type === ReservationTypeChoice.Behalf &&
    reservationUnit.authentication === Authentication.Strong;

  return (
    <>
      <Element $wide>
        <TypeSelect isDisabled={disableTypeSelect} />
      </Element>
      {type === ReservationTypeChoice.Blocked && (
        <CommentsTextArea
          label={t("reservationApplication:comment")}
          id="reservationApplication:comment"
          {...register("comments")}
        />
      )}
      {type !== ReservationTypeChoice.Blocked && (
        <>
          {showAuthWarning && (
            <Element $wide>
              <Notification
                label={t("reservationApplication:strongAuthentication.label")}
                type="info"
              >
                {t("reservationApplication:strongAuthentication.info")}
              </Notification>
            </Element>
          )}
          {!disableBufferToggle && (
            <BufferToggles
              before={reservationUnit.bufferTimeBefore ?? 0}
              after={reservationUnit.bufferTimeAfter ?? 0}
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
            {type === ReservationTypeChoice.Staff ? (
              <StyledShowAllContainer
                showAllLabel={t("MyUnits.ReservationForm.showReserver")}
                maximumNumber={0}
              >
                <ReserverMetadataSetForm reservationUnit={reservationUnit} />
                <HR style={{ gridColumn: "1 / -1" }} />
                <ShowTOS reservationUnit={reservationUnit} />
              </StyledShowAllContainer>
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
}

export default ReservationTypeForm;

export const RESERVATION_TYPE_FORM_FRAGMENT = gql`
  fragment ReservationTypeFormFields on ReservationUnitNode {
    ...MetadataSets
    authentication
    bufferTimeBefore
    bufferTimeAfter
    ...ShowTOS
  }
`;
