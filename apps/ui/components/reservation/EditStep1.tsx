import {
  type ReservationQuery,
  type ReservationUnitPageQuery,
} from "@gql/gql-types";
import { Button, IconArrowLeft, IconCross, LoadingSpinner } from "hds-react";
import { breakpoints } from "common/src/common/style";
import React, { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import TermsBox from "common/src/termsbox/TermsBox";
import { getTranslation } from "@/modules/util";
import Sanitize from "../common/Sanitize";
import { reservationsPrefix } from "@/modules/const";
import { filterNonNullable } from "common/src/helpers";
import { useGenericTerms } from "common/src/hooks/useGenericTerms";
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

type ReservationUnitNodeT = NonNullable<
  ReservationUnitPageQuery["reservationUnit"]
>;
type ReservationNodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationNodeT;
  reservationUnit: ReservationUnitNodeT;
  options: OptionsRecord;
  onBack: () => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  form: UseFormReturn<PendingReservationFormType>;
};

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: var(--spacing-layout-m) 0 var(--spacing-layout-l);
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

const BylineSection = styled.div`
  grid-row: 3;
  @media (min-width: ${breakpoints.m}) {
    grid-row: 2 / -1;
  }

  /*
  grid-row: 2;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 3;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-row: 1 / span 2;
    grid-column: -3 / span 2;
  }
*/
`;

const StyledForm = styled.form`
  @media (min-width: ${breakpoints.m}) {
    grid-column: 1 / -2;
    grid-row-start: 3;
  }
`;

const CancelActions = styled(Actions)`
  margin: 0;
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

  // TODO should use SSR for this
  const genericTerms = useGenericTerms();
  const hasTermsOfUse = genericTerms != null;

  // But why? shouldn't it be an error if the reservationUnit doesn't match the reservation?
  // should we even be querying reservation.reservationUnit in the first place if we are making a separate
  // query for the reservationUnit itself? and are we making or
  // is it just reservationUnit = reservation.reservationUnit in the parent component?
  const frozenReservationUnit = useMemo(() => {
    return (
      reservation.reservationUnit?.find((n) => n?.pk === reservationUnit.pk) ??
      undefined
    );
  }, [reservation, reservationUnit]);

  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areServiceSpecificTermsAccepted, setAreServiceSpecificTermsAccepted] =
    useState(false);

  const supportedFields = filterNonNullable(
    frozenReservationUnit?.metadataSet?.supportedFields
  );

  if (hasTermsOfUse == null) {
    return <LoadingSpinner />;
  }

  const { watch } = form;

  const apiValues = convertReservationFormToApi(watch());
  const modifiedReservation = {
    ...reservation,
    begin: apiValues?.begin ?? reservation.begin,
    end: apiValues?.end ?? reservation.end,
  };

  const termsAccepted =
    areTermsSpaceAccepted && areServiceSpecificTermsAccepted;
  return (
    <>
      <BylineSection>
        <ReservationInfoCard
          reservation={modifiedReservation}
          type="confirmed"
        />
      </BylineSection>
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
        <TermsBox
          id="cancellation-and-payment-terms"
          heading={t(
            `reservationCalendar:heading.${
              reservationUnit.cancellationTerms && reservationUnit.paymentTerms
                ? "cancellationPaymentTerms"
                : reservationUnit.cancellationTerms
                  ? "cancellationTerms"
                  : "paymentTerms"
            }`
          )}
          body={
            <>
              {reservationUnit.cancellationTerms != null && (
                <Sanitize
                  html={getTranslation(
                    reservationUnit.cancellationTerms,
                    "text"
                  )}
                />
              )}
              <br />
              {reservationUnit.paymentTerms != null && (
                <Sanitize
                  html={getTranslation(reservationUnit.paymentTerms, "text")}
                />
              )}
            </>
          }
          acceptLabel={t(
            `reservationCalendar:label.${
              reservationUnit.cancellationTerms && reservationUnit.paymentTerms
                ? "termsCancellationPayment"
                : reservationUnit.cancellationTerms
                  ? "termsCancellation"
                  : "termsPayment"
            }`
          )}
          accepted={areServiceSpecificTermsAccepted}
          setAccepted={setAreServiceSpecificTermsAccepted}
        />
        <TermsBox
          id="generic-and-service-specific-terms"
          heading={t("reservationCalendar:heading.termsOfUse")}
          body={
            reservationUnit.serviceSpecificTerms != null ? (
              <Sanitize
                html={getTranslation(
                  reservationUnit.serviceSpecificTerms,
                  "text"
                )}
              />
            ) : undefined
          }
          links={
            hasTermsOfUse
              ? [
                  {
                    href: "/terms/booking",
                    text: t("reservationCalendar:heading.generalTerms"),
                  },
                ]
              : undefined
          }
          acceptLabel={t(
            `reservationCalendar:label.${
              reservationUnit.serviceSpecificTerms
                ? "termsGeneralSpecific"
                : "termsGeneral"
            }`
          )}
          accepted={areTermsSpaceAccepted}
          setAccepted={setAreTermsSpaceAccepted}
        />{" "}
        <Actions>
          <CancelActions>
            <ButtonLikeLink
              href={`${reservationsPrefix}/${reservation.pk}`}
              size="large"
              data-testid="reservation-edit__button--cancel"
            >
              <IconCross aria-hidden />
              {t("reservations:cancelEditReservationTime")}
            </ButtonLikeLink>
            <Button
              variant="secondary"
              iconLeft={<IconArrowLeft aria-hidden />}
              onClick={onBack}
              data-testid="reservation-edit__button--back"
            >
              {t("common:prev")}
            </Button>
          </CancelActions>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || !termsAccepted}
            data-testid="reservation-edit__button--submit"
            isLoading={isSubmitting}
            loadingText={t("reservations:saveNewTimeLoading")}
          >
            {t("reservations:saveNewTime")}
          </Button>
        </Actions>
      </StyledForm>
    </>
  );
}
