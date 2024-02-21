import { useQuery } from "@apollo/client";
import {
  Query,
  QueryTermsOfUseArgs,
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  ReservationUnitByPkType,
  TermsOfUseTermsOfUseTermsTypeChoices,
} from "common/types/gql-types";
import { IconArrowLeft, IconCross, LoadingSpinner } from "hds-react";
import { get } from "lodash";
import { useRouter } from "next/router";
import { breakpoints } from "common/src/common/style";
import {
  Subheading,
  TwoColumnContainer,
} from "common/src/reservation-form/styles";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import TermsBox from "common/src/termsbox/TermsBox";
import { TERMS_OF_USE } from "@/modules/queries/reservationUnit";
import { capitalize, getTranslation } from "@/modules/util";
import Sanitize from "../common/Sanitize";
import { BlackButton, MediumButton } from "@/styles/util";
import { reservationsPrefix } from "@/modules/const";
import { filterNonNullable } from "common/src/helpers";

type Props = {
  reservation: ReservationType;
  reservationUnit: ReservationUnitByPkType;
  setErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  handleSubmit: () => void;
  isSubmitting: boolean;
};

const Wrapper = styled.div``;

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

const CancelActions = styled(Actions)`
  margin: 0;
`;

const ParagraphAlt = styled.div<{ $isWide?: boolean }>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1;"}

  & > div:first-of-type {
    margin-bottom: var(--spacing-3-xs);
  }
`;

const PreviewLabel = styled.span`
  display: block;
  color: var(--color-black-70);
  padding-bottom: var(--spacing-2-xs);
`;

const PreviewValue = styled.span`
  display: block;
  font-size: var(--fontsize-body-l);
`;

const EditStep1 = ({
  reservation,
  reservationUnit,
  setErrorMsg,
  setStep,
  handleSubmit,
  isSubmitting,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

  const [hasTermsOfUse, setHasTermsOfUse] = useState<boolean>();

  useQuery<Query, QueryTermsOfUseArgs>(TERMS_OF_USE, {
    variables: {
      termsType: TermsOfUseTermsOfUseTermsTypeChoices.GenericTerms,
    },
    onCompleted: (data) => {
      const result =
        data.termsOfUse?.edges
          .map((n) => n?.node)
          .find((n) => n?.pk === "booking") || undefined;
      setHasTermsOfUse(Boolean(result));
    },
  });

  const frozenReservationUnit = useMemo(() => {
    return (
      reservation.reservationUnits?.find((n) => n?.pk === reservationUnit.pk) ??
      undefined
    );
  }, [reservation, reservationUnit]);

  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areServiceSpecificTermsAccepted, setAreServiceSpecificTermsAccepted] =
    useState(false);

  // TODO all this is copy pasta from reservation-unit/[...params].tsx
  const supportedFields = filterNonNullable(
    frozenReservationUnit?.metadataSet?.supportedFields
  );
  const generalFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  const type = supportedFields.includes("reservee_type")
    ? reservation.reserveeType
    : ReservationsReservationReserveeTypeChoices.Individual;
  const reservationApplicationFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: type ?? "common",
  });

  const getValue = useCallback(
    (key: string) => {
      if (key === "purpose" && reservation.purpose != null) {
        return getTranslation(reservation.purpose, "name");
      }

      if (key === "ageGroup" && reservation.ageGroup != null) {
        const { minimum, maximum } = reservation[key] ?? {
          minimum: "1",
          maximum: "",
        };
        return `${minimum} - ${maximum}`;
      }

      if (key === "homeCity") {
        return `${reservation[key]?.name}`;
      }

      const rawValue = get(reservation, key);
      return get(rawValue, "pk")
        ? getTranslation(rawValue, "name")
        : typeof rawValue === "boolean"
          ? t(`common:${String(rawValue)}`)
          : rawValue;
    },
    [reservation, t]
  );

  if (hasTermsOfUse == null) {
    return <LoadingSpinner />;
  }

  return (
    <Wrapper>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErrorMsg("");
          if (!areTermsSpaceAccepted || !areServiceSpecificTermsAccepted) {
            setErrorMsg(t("reservationCalendar:errors.termsNotAccepted"));
          } else {
            handleSubmit();
          }
        }}
      >
        {generalFields?.length > 0 && (
          <>
            <Subheading>{t("reservationCalendar:reservationInfo")} </Subheading>
            <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
              <>
                {generalFields
                  .filter(
                    (key) =>
                      !["", undefined, false, 0, null].includes(
                        get(reservation, key)
                      )
                  )
                  .map((key) => {
                    const value = getValue(key);
                    return (
                      <ParagraphAlt
                        key={`summary_${key}`}
                        $isWide={[
                          "name",
                          "description",
                          "freeOfChargeReason",
                        ].includes(key)}
                      >
                        <PreviewLabel>
                          {t(`reservationApplication:label.common.${key}`)}
                        </PreviewLabel>
                        <PreviewValue data-testid={`edit_${key}`}>
                          {value}
                        </PreviewValue>
                      </ParagraphAlt>
                    );
                  })}
              </>
            </TwoColumnContainer>
          </>
        )}
        <Subheading>{t("reservationCalendar:reserverInfo")}</Subheading>
        <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
          <>
            {reservationApplicationFields.includes("reserveeType") && (
              <ParagraphAlt $isWide>
                <PreviewLabel>
                  {t("reservationApplication:reserveeTypePrefix")}
                </PreviewLabel>
                <PreviewValue data-testid="reservation-edit_reserveeType">
                  {capitalize(
                    t(
                      `reservationApplication:reserveeTypes.labels.${reservation.reserveeType?.toLowerCase()}`
                    )
                  )}
                </PreviewValue>
              </ParagraphAlt>
            )}
            {reservationApplicationFields
              .filter(
                (key) =>
                  !["", undefined, false, 0, null].includes(
                    get(reservation, key)
                  )
              )
              .map((key) => {
                const value = getValue(key);
                return (
                  <ParagraphAlt key={`summary_${key}`}>
                    <PreviewLabel>
                      {t(
                        `reservationApplication:label.${
                          reservation.reserveeType?.toLocaleLowerCase() ||
                          "individual"
                        }.${key}`
                      )}
                    </PreviewLabel>
                    <PreviewValue data-testid={`reservation-edit__${key}`}>
                      {value}
                    </PreviewValue>
                  </ParagraphAlt>
                );
              })}
          </>
        </TwoColumnContainer>
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
            <BlackButton
              variant="secondary"
              iconLeft={<IconCross aria-hidden />}
              onClick={() =>
                router.push(`${reservationsPrefix}/${reservation.pk}`)
              }
            >
              {t("reservations:cancelEditReservationTime")}
            </BlackButton>
            <BlackButton
              variant="secondary"
              iconLeft={<IconArrowLeft aria-hidden />}
              onClick={() => setStep(0)}
              data-testid="reservation-edit__button--back"
            >
              {t("common:prev")}
            </BlackButton>
          </CancelActions>
          <MediumButton
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            data-testid="reservation-edit__button--submit"
          >
            {t("reservations:saveNewTime")}
          </MediumButton>
        </Actions>
      </form>
    </Wrapper>
  );
};

export default EditStep1;
