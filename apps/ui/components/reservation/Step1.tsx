import type { OptionType, ReservationUnitNode } from "common/types/common";
import { get } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconArrowLeft, IconArrowRight } from "hds-react";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  TermsOfUseType,
} from "common/types/gql-types";
import TermsBox from "common/src/termsbox/TermsBox";
import {
  Subheading,
  TwoColumnContainer,
} from "common/src/reservation-form/styles";
import { capitalize, getTranslation } from "@/modules/util";
import { ActionContainer } from "./styles";
import Sanitize from "../common/Sanitize";
import { MediumButton } from "@/styles/util";
import { JustForMobile } from "@/modules/style/layout";
import {
  ErrorAnchor,
  ErrorBox,
  ErrorList,
  PinkBox,
} from "../reservation-unit/ReservationUnitStyles";
import { useFormContext } from "react-hook-form";

type Props = {
  reservation: ReservationType;
  reservationUnit: ReservationUnitNode;
  handleSubmit: () => void;
  generalFields: string[];
  reservationApplicationFields: string[];
  options: Record<string, OptionType[]>;
  reserveeType: ReservationsReservationReserveeTypeChoices;
  requiresHandling: boolean;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  genericTerms: TermsOfUseType | null;
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
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

const scrollToBox = (id: string): void => {
  const element = document.getElementById(id);
  const checkbox = document.getElementById(`${id}-terms-accepted`);

  const top = element?.getBoundingClientRect()?.y || 0;
  window.scroll({
    top: window.scrollY + top - 28,
    left: 0,
    behavior: "smooth",
  });
  checkbox?.focus();
};

const Step1 = ({
  reservation,
  reservationUnit,
  handleSubmit,
  generalFields,
  reservationApplicationFields,
  options,
  reserveeType,
  requiresHandling,
  setStep,
  genericTerms,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const {
    formState: { isSubmitting, isSubmitted },
  } = useFormContext();

  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areServiceSpecificTermsAccepted, setAreServiceSpecificTermsAccepted] =
    useState(false);

  const termsOfUseContent = getTranslation(reservationUnit, "termsOfUse");

  const box = [
    {
      heading: t(
        `reservationCalendar:heading.${
          reservationUnit.cancellationTerms && reservationUnit.paymentTerms
            ? "cancellationPaymentTerms"
            : reservationUnit.cancellationTerms
              ? "cancellationTerms"
              : "paymentTerms"
        }`
      ),
      id: "cancellation-and-payment-terms",
      acceptLabel: t(
        `reservationCalendar:label.${
          reservationUnit.cancellationTerms && reservationUnit.paymentTerms
            ? "termsCancellationPayment"
            : reservationUnit.cancellationTerms
              ? "termsCancellation"
              : "termsPayment"
        }`
      ),
    },
    {
      heading: t("reservationCalendar:heading.termsOfUse"),
      id: "generic-and-service-specific-terms",
      acceptLabel: t(
        `reservationCalendar:label.${
          reservationUnit.serviceSpecificTerms
            ? "termsGeneralSpecific"
            : "termsGeneral"
        }`
      ),
    },
  ];

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        if (areTermsSpaceAccepted && areServiceSpecificTermsAccepted) {
          handleSubmit();
        }
      }}
      noValidate
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
                  const rawValue = get(reservation, key);
                  const value = get(options, key)
                    ? get(options, key).find(
                        (option) => option.value === rawValue
                      )?.label
                    : typeof rawValue === "boolean"
                      ? t(`common:${String(rawValue)}`)
                      : rawValue;
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
                      <PreviewValue data-testid={`reservation-confirm__${key}`}>
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
          {reservationApplicationFields?.includes("reserveeType") && (
            <ParagraphAlt $isWide>
              <PreviewLabel>
                {t("reservationApplication:reserveeTypePrefix")}
              </PreviewLabel>
              <PreviewValue data-testid="reservation-confirm__reserveeType">
                {capitalize(
                  t(
                    `reservationApplication:reserveeTypes.labels.${reserveeType.toLowerCase()}`
                  )
                )}
              </PreviewValue>
            </ParagraphAlt>
          )}
          {reservationApplicationFields
            ?.filter(
              (key) =>
                !["", undefined, false, 0, null].includes(get(reservation, key))
            )
            .map((key) => {
              const rawValue = get(reservation, key);
              const value = get(options, key)
                ? get(options, key).find((option) => option.value === rawValue)
                    ?.label
                : typeof rawValue === "boolean"
                  ? t(`common:${String(rawValue)}`)
                  : rawValue;
              return (
                <ParagraphAlt key={`summary_${key}`}>
                  <PreviewLabel>
                    {t(
                      `reservationApplication:label.${
                        reserveeType?.toLocaleLowerCase() || "individual"
                      }.${key}`
                    )}
                  </PreviewLabel>
                  <PreviewValue data-testid={`confirm_${key}`}>
                    {value}
                  </PreviewValue>
                </ParagraphAlt>
              );
            })}
        </>
      </TwoColumnContainer>
      <TermsBox
        id={box[0].id}
        heading={box[0].heading}
        body={
          <>
            {reservationUnit.cancellationTerms && (
              <Sanitize
                html={getTranslation(reservationUnit.cancellationTerms, "text")}
              />
            )}
            <br />
            {reservationUnit.paymentTerms && (
              <Sanitize
                html={getTranslation(reservationUnit.paymentTerms, "text")}
              />
            )}
          </>
        }
        acceptLabel={box[0].acceptLabel}
        accepted={areServiceSpecificTermsAccepted}
        setAccepted={setAreServiceSpecificTermsAccepted}
        errorText={
          isSubmitted && !areServiceSpecificTermsAccepted
            ? `${t(
                "forms:prefix.approve"
              )} ${box[0].heading.toLocaleLowerCase()}`
            : undefined
        }
      />
      <TermsBox
        id={box[1].id}
        heading={box[1].heading}
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
          genericTerms != null
            ? [
                {
                  href: "/terms/booking",
                  text: t("reservationCalendar:heading.generalTerms"),
                },
              ]
            : []
        }
        acceptLabel={box[1].acceptLabel}
        accepted={areTermsSpaceAccepted}
        setAccepted={setAreTermsSpaceAccepted}
        errorText={
          isSubmitted && !areTermsSpaceAccepted
            ? `${t(
                "forms:prefix.approve"
              )} ${box[1].heading.toLocaleLowerCase()}`
            : undefined
        }
      />
      {termsOfUseContent && (
        <JustForMobile style={{ marginBottom: "var(--spacing-layout-m)" }}>
          <PinkBox>
            <Subheading>
              {t("reservations:reservationInfoBoxHeading")}
            </Subheading>
            <Sanitize html={termsOfUseContent} />
          </PinkBox>
        </JustForMobile>
      )}
      {isSubmitted &&
        (!areServiceSpecificTermsAccepted || !areTermsSpaceAccepted) && (
          <ErrorBox
            label={t("forms:heading.errorsTitle")}
            type="error"
            position="inline"
          >
            <div>{t("forms:heading.errorsSubtitle")}</div>
            <ErrorList>
              {!areServiceSpecificTermsAccepted && (
                <li>
                  <ErrorAnchor
                    href="#!"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToBox(box[0].id);
                    }}
                  >
                    {box[0].heading}
                  </ErrorAnchor>
                </li>
              )}
              {!areTermsSpaceAccepted && (
                <li>
                  <ErrorAnchor
                    href="#!"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToBox(box[1].id);
                    }}
                  >
                    {box[1].heading}
                  </ErrorAnchor>
                </li>
              )}
            </ErrorList>
          </ErrorBox>
        )}
      <ActionContainer>
        <MediumButton
          variant="primary"
          type="submit"
          iconRight={
            requiresHandling ? <IconArrowRight aria-hidden /> : undefined
          }
          data-test="reservation__button--update"
          isLoading={isSubmitting}
          disabled={!areTermsSpaceAccepted || !areServiceSpecificTermsAccepted}
        >
          {t(
            `reservationCalendar:${
              requiresHandling ? "nextStep" : "makeReservation"
            }`
          )}
        </MediumButton>
        <MediumButton
          variant="secondary"
          iconLeft={<IconArrowLeft aria-hidden />}
          onClick={() => setStep(0)}
          data-test="reservation__button--cancel"
        >
          {t("common:prev")}
        </MediumButton>
      </ActionContainer>
    </Form>
  );
};

export default Step1;
