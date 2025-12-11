import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { gql } from "@apollo/client";
import { Notification, RadioButton, SelectionGroup, TextArea } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ShowAllContainer } from "@ui/components";
import { ReservationFormGeneralSection, ReservationFormReserveeSection } from "@ui/components/reservation-form";
import { ReservationTypes } from "@ui/schemas";
import type { CreateStaffReservationFormValues } from "@ui/schemas";
import { HR } from "@ui/styled";
import type { OptionsRecord } from "@ui/types";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { Element } from "@/styled";
import { AuthenticationType, ReservationTypeChoice } from "@gql/gql-types";
import type { ReservationTypeFormFieldsFragment } from "@gql/gql-types";
import { BufferToggles } from "./BufferToggles";
import { ShowTOS } from "./ShowTOS";

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
  } = useFormContext<CreateStaffReservationFormValues>();
  const { t } = useTranslation();

  const type = watch("type");

  if (type === ReservationTypeChoice.Normal) {
    return <p>{t("reservationApplication:clientReservationCantBeChanged")}</p>;
  }

  const allowedTypesChoices = ReservationTypes.filter(
    (x) => x !== ReservationTypeChoice.Normal && x !== ReservationTypeChoice.Seasonal
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
          errorText={errors.type?.message != null ? t(`reservationForm:errors.${errors.type?.message}`) : ""}
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

type ReservationTypeFormProps = {
  reservationUnit: ReservationTypeFormFieldsFragment;
  children?: React.ReactNode;
  disableBufferToggle?: boolean;
  disableTypeSelect?: boolean;
};

export function ReservationTypeForm({
  reservationUnit,
  children,
  disableBufferToggle,
  disableTypeSelect,
}: ReservationTypeFormProps): JSX.Element | null {
  const { t } = useTranslation();

  const {
    watch,
    register,
    formState: { errors },
  } = useFormContext<CreateStaffReservationFormValues>();
  const type = watch("type");

  const { ageGroups, reservationPurposes } = useFilterOptions();

  const options: OptionsRecord = {
    ageGroup: ageGroups,
    purpose: reservationPurposes,
  };

  const showAuthWarning =
    type === ReservationTypeChoice.Behalf && reservationUnit.authentication === AuthenticationType.Strong;

  return (
    <>
      <Element $wide>
        <TypeSelect isDisabled={disableTypeSelect} />
      </Element>
      {type === ReservationTypeChoice.Blocked ? (
        <CommentsTextArea
          label={t("reservationApplication:comment")}
          id="reservationApplication:comment"
          {...register("comments")}
          errorText={errors.comments?.message != null ? t(`forms:errors.${errors.comments.message}`) : undefined}
        />
      ) : (
        <>
          {showAuthWarning && (
            <Element $wide>
              <Notification label={t("reservationApplication:strongAuthentication.label")} type="info">
                {t("reservationApplication:strongAuthentication.info")}
              </Notification>
            </Element>
          )}
          {!disableBufferToggle && (
            <BufferToggles before={reservationUnit.bufferTimeBefore} after={reservationUnit.bufferTimeAfter} />
          )}
          {children}
          <CommentsTextArea
            id="reservationApplication:comment"
            label={t("reservationApplication:comment")}
            {...register("comments")}
            errorText={errors.comments?.message != null ? t(`forms:errors.${errors.comments.message}`) : undefined}
          />
          <HR style={{ gridColumn: "1 / -1" }} />
          <Element $wide>
            <div style={{ marginBottom: 48 }}>
              <ReservationFormGeneralSection reservationUnit={reservationUnit} options={options} />
            </div>
            {type === ReservationTypeChoice.Staff ? (
              <StyledShowAllContainer showAllLabel={t("myUnits:ReservationForm.showReserver")} maximumNumber={0}>
                <ReserveeFormPart reservationUnit={reservationUnit} />
              </StyledShowAllContainer>
            ) : (
              <ReserveeFormPart reservationUnit={reservationUnit} />
            )}
          </Element>
        </>
      )}
    </>
  );
}

function ReserveeFormPart({ reservationUnit }: Pick<ReservationTypeFormProps, "reservationUnit">): React.ReactElement {
  return (
    <>
      <ReservationFormReserveeSection reservationUnit={reservationUnit} />
      <HR style={{ gridColumn: "1 / -1" }} />
      <ShowTOS reservationUnit={reservationUnit} />
    </>
  );
}

export const RESERVATION_TYPE_FORM_FRAGMENT = gql`
  fragment ReservationTypeFormFields on ReservationUnitNode {
    reservationForm
    minPersons
    maxPersons
    authentication
    bufferTimeBefore
    bufferTimeAfter
    serviceSpecificTerms {
      id
      textFi
      nameFi
    }
    paymentTerms {
      id
      textFi
      nameFi
    }
    pricingTerms {
      id
      textFi
      nameFi
    }
    cancellationTerms {
      id
      textFi
      nameFi
    }
  }
`;
