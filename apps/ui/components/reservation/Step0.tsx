/**
 *  First part of the Reservation process form
 *  This component needs to be wrapped inside a Form context
 */
import { OptionType } from "common/types/common";
import { IconArrowLeft, IconArrowRight } from "hds-react";
import { useFormContext } from "react-hook-form";
import React from "react";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontMedium, fontRegular } from "common/src/common/typography";
import MetaFields from "common/src/reservation-form/MetaFields";
import { ReservationUnitType } from "common/types/gql-types";
import { MediumButton } from "../../styles/util";
import { ActionContainer } from "./styles";
import { getTranslation } from "../../modules/util";
import InfoDialog from "../common/InfoDialog";
import { JustForMobile } from "../../modules/style/layout";
import {
  ErrorAnchor,
  ErrorBox,
  ErrorList,
  PinkBox,
  Subheading,
} from "../reservation-unit/ReservationUnitStyles";
import Sanitize from "../common/Sanitize";

type Props = {
  reservationUnit: ReservationUnitType;
  handleSubmit: () => void;
  generalFields: string[];
  reservationApplicationFields: string[];
  cancelReservation: () => void;
  options: Record<string, OptionType[]>;
};

const Form = styled.form`
  display: flex;
  flex-direction: column;

  label {
    ${fontMedium};

    span {
      line-height: unset;
      transform: unset;
      margin-left: 0;
      display: inline;
      font-size: unset;
    }
  }

  input[type="radio"] + label {
    ${fontRegular};
  }
`;

const LinkLikeButton = styled.button`
  border: unset;
  background: unset;
  color: blue;
  padding: unset;
  cursor: pointer;
`;

const Step0 = ({
  reservationUnit,
  handleSubmit,
  generalFields,
  reservationApplicationFields,
  cancelReservation,
  options,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const termsOfUse = getTranslation(reservationUnit, "termsOfUse");

  const {
    watch,
    formState: { errors, isSubmitted },
  } = useFormContext();

  const errorKeys =
    Object.keys(errors).sort((a, b) => {
      const fields = [...generalFields, ...reservationApplicationFields];
      return fields.indexOf(a) - fields.indexOf(b);
    }) || [];

  const reserveeType = watch("reserveeType");

  if (
    reservationUnit?.metadataSet?.supportedFields?.includes("reservee_type") &&
    isSubmitted &&
    !reserveeType
  )
    errorKeys.push("reserveeType");

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      noValidate
    >
      <MetaFields
        reservationUnit={reservationUnit}
        options={options}
        generalFields={generalFields}
        reservationApplicationFields={reservationApplicationFields}
        data={{
          termsForDiscount: (
            <Trans
              i18nKey="reservationApplication:label.common.applyingForFreeOfChargeButton"
              defaults="Lue lisää <button>alennusperiaatteista</button>"
              components={{
                button: (
                  <LinkLikeButton
                    type="button"
                    onClick={() => setIsDialogOpen(true)}
                  />
                ),
              }}
            />
          ),
        }}
      />
      <InfoDialog
        id="pricing-terms"
        heading={t("reservationUnit:pricingTerms")}
        text={getTranslation(reservationUnit.pricingTerms, "text")}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      {termsOfUse && (
        <JustForMobile>
          <PinkBox>
            <Subheading>
              {t("reservations:reservationInfoBoxHeading")}
            </Subheading>
            <Sanitize html={termsOfUse} />
          </PinkBox>
        </JustForMobile>
      )}
      {errorKeys?.length > 0 && (
        <ErrorBox
          label={t("forms:heading.errorsTitle")}
          type="error"
          position="inline"
        >
          <div>{t("forms:heading.errorsSubtitle")}</div>
          <ErrorList>
            {errorKeys.map((key: string) => {
              const isGeneralField =
                generalFields.includes(key) || key === "reserveeType";
              const fieldType = isGeneralField
                ? "common"
                : reserveeType?.toLocaleLowerCase() || "individual";
              return (
                <li>
                  <ErrorAnchor
                    href="javascript:void(0);"
                    onClick={() => {
                      const element =
                        document.getElementById(key) ||
                        document.getElementById(`${key}-label`);
                      const top = element.getBoundingClientRect()?.y || 0;
                      window.scroll({
                        top: window.scrollY + top - 28,
                        left: 0,
                        behavior: "smooth",
                      });
                      setTimeout(() => {
                        element?.focus();
                      }, 500);
                    }}
                  >
                    {t(`reservationApplication:label.${fieldType}.${key}`)}
                  </ErrorAnchor>
                </li>
              );
            })}
          </ErrorList>
        </ErrorBox>
      )}
      <ActionContainer>
        <MediumButton
          variant="primary"
          type="submit"
          iconRight={<IconArrowRight aria-hidden />}
          data-test="reservation__button--update"
        >
          {t("reservationCalendar:nextStep")}
        </MediumButton>
        <MediumButton
          variant="secondary"
          iconLeft={<IconArrowLeft aria-hidden />}
          onClick={() => {
            cancelReservation();
          }}
          data-test="reservation__button--cancel"
        >
          {t("common:cancel")}
        </MediumButton>
      </ActionContainer>
    </Form>
  );
};

export default Step0;
