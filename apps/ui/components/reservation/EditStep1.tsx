import {
  type ReservationEditPageQuery,
  type ReservationUnitPageQuery,
} from "@gql/gql-types";
import {
  Button,
  ButtonVariant,
  IconArrowLeft,
  IconCross,
  LoadingSpinner,
} from "hds-react";
import { breakpoints } from "common/src/common/style";
import React, { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import {
  ApplicationFields,
  GeneralFields,
  OptionsRecord,
} from "./SummaryFields";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { ReservationInfoCard } from "./ReservationInfoCard";
import { PendingReservationFormType } from "../reservation-unit/schema";
import { type UseFormReturn } from "react-hook-form";
import { convertReservationFormToApi } from "@/modules/reservation";
import { AcceptTerms } from "./AcceptTerms";
import { getReservationPath } from "@/modules/urls";

type ReservationUnitNodeT = NonNullable<
  ReservationUnitPageQuery["reservationUnit"]
>;
type ReservationNodeT = NonNullable<ReservationEditPageQuery["reservation"]>;
type Props = {
  reservation: ReservationNodeT;
  reservationUnit: ReservationUnitNodeT;
  options: OptionsRecord;
  onBack: () => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  form: UseFormReturn<PendingReservationFormType>;
};

// TODO move this to general styles: ButtonContainer
// test different variantions of it (one, two, three buttons)
const Actions = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: var(--spacing-m);
  & > * {
    flex-grow: 1;
  }
  & > :last-child {
    width: 100%;
    order: 1;
  }
  & > :not(:last-child) {
    order: 2;
  }

  @media (min-width: ${breakpoints.s}) {
    & > * {
      flex-grow: unset;
      order: unset;
    }
    & > :not(:last-child) {
      order: unset;
    }
    & > :last-child {
      margin-left: auto;
      width: auto;
      order: unset;
    }
  }
`;

const StyledReservationInfoCard = styled(ReservationInfoCard)`
  grid-row: 2;
  @media (min-width: ${breakpoints.m}) {
    grid-row: 1 / span 2;
  }
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  @media (min-width: ${breakpoints.m}) {
    grid-row: 2 / -1;
    grid-column: 1 / span 1;
  }
`;

export function EditStep1({
  reservation,
  reservationUnit,
  options,
  onBack,
  handleSubmit,
  isSubmitting,
  form,
}: Props): JSX.Element {
  const { t } = useTranslation();

  // But why? shouldn't it be an error if the reservationUnit doesn't match the reservation?
  // should we even be querying reservation.reservationUnit in the first place if we are making a separate
  // query for the reservationUnit itself? and are we making or
  // is it just reservationUnit = reservation.reservationUnit in the parent component?
  const frozenReservationUnit = useMemo(() => {
    return (
      reservation.reservationUnits?.find((n) => n?.pk === reservationUnit.pk) ??
      undefined
    );
  }, [reservation, reservationUnit]);

  const [isTermsAccepted, setIsTermsAccepted] = useState({
    space: false,
    service: false,
  });

  const handleTermsAcceptedChange = (
    key: "service" | "space",
    val: boolean
  ) => {
    setIsTermsAccepted({ ...isTermsAccepted, [key]: val });
  };

  const supportedFields = filterNonNullable(
    frozenReservationUnit?.metadataSet?.supportedFields
  );

  const { watch } = form;

  const apiValues = convertReservationFormToApi(watch());
  const modifiedReservation = {
    ...reservation,
    begin: apiValues?.begin ?? reservation.begin,
    end: apiValues?.end ?? reservation.end,
  };

  const termsAccepted = isTermsAccepted.space && isTermsAccepted.service;
  return (
    <>
      <StyledReservationInfoCard
        reservation={modifiedReservation}
        type="pending"
      />
      <StyledForm
        onSubmit={(e) => {
          e.preventDefault();
          if (!termsAccepted) {
            errorToast({
              text: t("reservationCalendar:errors.termsNotAccepted"),
            });
          } else {
            handleSubmit();
          }
        }}
      >
        <GeneralFields
          supportedFields={supportedFields}
          reservation={reservation}
          options={options}
        />
        <ApplicationFields
          supportedFields={supportedFields}
          reservation={reservation}
          options={options}
        />
        <AcceptTerms
          reservationUnit={reservationUnit}
          isTermsAccepted={isTermsAccepted}
          setIsTermsAccepted={handleTermsAcceptedChange}
        />
        <Actions>
          <Button
            variant={ButtonVariant.Secondary}
            iconStart={<IconArrowLeft aria-hidden="true" />}
            onClick={onBack}
            data-testid="reservation-edit__button--back"
          >
            {t("common:prev")}
          </Button>
          <ButtonLikeLink
            href={getReservationPath(reservation.pk)}
            size="large"
            data-testid="reservation-edit__button--cancel"
          >
            <IconCross aria-hidden="true" />
            {t("common:stop")}
          </ButtonLikeLink>
          <Button
            type="submit"
            variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
            iconStart={isSubmitting ? <LoadingSpinner small /> : undefined}
            disabled={isSubmitting || !termsAccepted}
            data-testid="reservation__button--continue"
          >
            {t("reservations:saveNewTime")}
          </Button>
        </Actions>
      </StyledForm>
    </>
  );
}
