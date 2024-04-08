import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconArrowLeft, IconArrowRight } from "hds-react";
import {
  CustomerTypeChoice,
  type ReservationUnitNode,
  type ReservationNode,
  type TermsOfUseNode,
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
import { TFunction } from "i18next";

type OptionType = {
  label: string;
  value: number;
};
type OptionsRecord = Record<"purpose" | "ageGroup" | "homeCity", OptionType[]>;

type Props = {
  reservation: ReservationNode;
  reservationUnit: ReservationUnitNode;
  handleSubmit: () => void;
  generalFields: string[];
  reservationApplicationFields: string[];
  options: OptionsRecord;
  reserveeType: CustomerTypeChoice;
  requiresHandling: boolean;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  genericTerms: TermsOfUseNode | null;
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

/// Type safe conversion from key value maps for the metadata fields
/// TODO this is pretty awful (dynamic type checking) but requires refactoring metafields more
function convertMaybeOptionValue(
  key: keyof ReservationNode,
  reservation: ReservationNode,
  options: OptionsRecord,
  t: TFunction
): string {
  const rawValue = reservation[key];
  if (key in options) {
    const optionsKey = key as keyof OptionsRecord;
    if (typeof rawValue !== "object" || rawValue == null) {
      // eslint-disable-next-line no-console
      console.warn(
        "convertMaybeOptionValue: rawValue is not object: ",
        rawValue
      );
    }
    if (
      typeof rawValue === "object" &&
      rawValue != null &&
      "pk" in rawValue &&
      typeof rawValue.pk === "number"
    ) {
      return (
        options[optionsKey].find((option) => option.value === rawValue.pk)
          ?.label ?? ""
      );
    }
    // eslint-disable-next-line no-console
    console.warn(
      "convertMaybeOptionValue: rawValue is not pk, but object: ",
      rawValue
    );
    return "unknown";
  }
  if (typeof rawValue === "boolean") {
    return t(`common:${String(rawValue)}`);
  }
  if (typeof rawValue === "string") {
    return rawValue;
  }
  if (typeof rawValue === "number") {
    return String(rawValue);
  }
  return "unknown";
}

function isNotEmpty(
  key: keyof ReservationNode,
  reservation: ReservationNode
): boolean {
  const rawValue = reservation[key];
  if (
    rawValue == null ||
    rawValue === "" ||
    rawValue === undefined ||
    rawValue === false ||
    rawValue === 0
  ) {
    return false;
  }
  return true;
}

function LabelValuePair({
  label,
  value,
  isWide,
}: {
  label: string;
  value: string;
  isWide?: boolean;
}) {
  return (
    <ParagraphAlt $isWide={isWide}>
      <PreviewLabel>{label}</PreviewLabel>
      <PreviewValue>{value}</PreviewValue>
    </ParagraphAlt>
  );
}

function Step1({
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
}: Props): JSX.Element {
  const { t } = useTranslation();
  const {
    formState: { isSubmitting },
  } = useFormContext();
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const filteredGeneralFields = generalFields
    .filter((key): key is keyof ReservationNode => key in reservation)
    .filter((key) => isNotEmpty(key, reservation));

  const filteredApplicationFields = reservationApplicationFields
    .filter((key): key is keyof ReservationNode => key in reservation)
    .filter((key) => isNotEmpty(key, reservation));

  const hasReserveeType =
    filteredApplicationFields.find((x) => x === "reserveeType") != null;

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (areTermsSpaceAccepted && areServiceSpecificTermsAccepted) {
          handleSubmit();
        }
      }}
      noValidate
    >
      {filteredGeneralFields.length > 0 && (
        <>
          <Subheading>{t("reservationCalendar:reservationInfo")} </Subheading>
          <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
            <>
              {filteredGeneralFields.map((key) => {
                const value = convertMaybeOptionValue(
                  key,
                  reservation,
                  options,
                  t
                );
                const isWide =
                  ["name", "description", "freeOfChargeReason"].find(
                    (x) => x === key
                  ) != null;
                const label = t(`reservationApplication:label.common.${key}`);
                return (
                  <LabelValuePair
                    key={key}
                    label={label}
                    value={value}
                    isWide={isWide}
                  />
                );
              })}
            </>
          </TwoColumnContainer>
        </>
      )}
      <Subheading>{t("reservationCalendar:reserverInfo")}</Subheading>
      <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
        <>
          {hasReserveeType && (
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
          {filteredApplicationFields.map((key) => {
            const value = convertMaybeOptionValue(key, reservation, options, t);
            const typeNamespace =
              reserveeType?.toLocaleLowerCase() || "individual";
            const labelKey = `reservationApplication:label.${typeNamespace}.${key}`;
            const label = t(labelKey);
            return <LabelValuePair key={key} label={label} value={value} />;
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
          loadingText={t(
            `reservationCalendar:${requiresHandling ? "nextStep" : "makeReservation"}Loading`
          )}
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
}

export default Step1;
