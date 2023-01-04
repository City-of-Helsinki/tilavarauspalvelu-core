import { useQuery } from "@apollo/client";
import {
  Query,
  QueryTermsOfUseArgs,
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  ReservationUnitByPkType,
  TermsOfUseType,
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
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TermsBox from "common/src/termsbox/TermsBox";
import { TERMS_OF_USE } from "../../modules/queries/reservationUnit";
import { capitalize, getTranslation } from "../../modules/util";
import Sanitize from "../common/Sanitize";
import { BlackButton, MediumButton } from "../../styles/util";
import { reservationsPrefix } from "../../modules/const";

type Props = {
  reservation: ReservationType;
  reservationUnit: ReservationUnitByPkType;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
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

  const [hasTermsOfUse, setHasTermsOfUse] = useState<boolean>(null);

  useQuery<Query, QueryTermsOfUseArgs>(TERMS_OF_USE, {
    variables: {
      termsType: "generic_terms",
    },
    onCompleted: (data) => {
      const result: TermsOfUseType =
        data.termsOfUse.edges
          .map((n) => n.node)
          .find((n) => n.pk === "generic1") || null;
      setHasTermsOfUse(Boolean(result));
    },
  });

  const frozenReservationUnit = useMemo(() => {
    return reservation.reservationUnits.find(
      (n) => n.pk === reservationUnit.pk
    );
  }, [reservation, reservationUnit]);

  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areServiceSpecificTermsAccepted, setAreServiceSpecificTermsAccepted] =
    useState(false);

  const generalFields = useMemo(() => {
    return getReservationApplicationFields({
      supportedFields: frozenReservationUnit.metadataSet?.supportedFields,
      reserveeType: "common",
      camelCaseOutput: true,
    }).filter((n) => n !== "reserveeType");
  }, [frozenReservationUnit?.metadataSet?.supportedFields]);

  const reservationApplicationFields = useMemo(() => {
    const type = frozenReservationUnit.metadataSet?.supportedFields?.includes(
      "reservee_type"
    )
      ? reservation.reserveeType
      : ReservationsReservationReserveeTypeChoices.Individual;

    return getReservationApplicationFields({
      supportedFields: frozenReservationUnit.metadataSet?.supportedFields,
      reserveeType: type,
      camelCaseOutput: true,
    });
  }, [
    frozenReservationUnit?.metadataSet?.supportedFields,
    reservation.reserveeType,
  ]);

  const getValue = useCallback(
    (key) => {
      if (key === "ageGroup") {
        const { minimum, maximum } = reservation[key];
        return `${minimum} - ${maximum}`;
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

  if (hasTermsOfUse === null) {
    return <LoadingSpinner />;
  }

  return (
    <Wrapper>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErrorMsg(null);
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
                        <PreviewValue>{value}</PreviewValue>
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
                <PreviewValue>
                  {capitalize(
                    t(
                      `reservationApplication:reserveeTypes.labels.${reservation.reserveeType.toLowerCase()}`
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
                    <PreviewValue>{value}</PreviewValue>
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
              <Sanitize
                html={getTranslation(reservationUnit.cancellationTerms, "text")}
              />
              <br />
              <Sanitize
                html={getTranslation(reservationUnit.paymentTerms, "text")}
              />
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
            <>
              <Sanitize
                html={getTranslation(
                  reservationUnit.serviceSpecificTerms,
                  "text"
                )}
              />
            </>
          }
          links={
            hasTermsOfUse && [
              {
                href: "/terms/general",
                text: t("reservationCalendar:heading.generalTerms"),
              },
            ]
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
            >
              {t("common:prev")}
            </BlackButton>
          </CancelActions>
          <MediumButton variant="primary" type="submit" disabled={isSubmitting}>
            {t("reservations:saveNewTime")}
          </MediumButton>
        </Actions>
      </form>
    </Wrapper>
  );
};

export default EditStep1;
