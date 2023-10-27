import React from "react";
import { Checkbox } from "hds-react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { getTranslation } from "@/modules/util";
import { useOptions } from "@/hooks/useOptions";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import type { ReservationUnitType, TermsOfUseType } from "common/types/gql-types";
import { FormSubHeading } from "../common/common";
import { CheckboxContainer, StyledNotification, Terms } from "./styled";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { ApplicationEventList } from "./ApplicationEventList";
import type { ApplicationFormValues } from "./Form";

export const ViewInner = ({
  tos,
  allReservationUnits,
  acceptTermsOfUse,
  setAcceptTermsOfUse,
} : {
  tos: TermsOfUseType[]
  allReservationUnits: ReservationUnitType[]
  acceptTermsOfUse?: boolean
  setAcceptTermsOfUse?: (value: boolean) => void
}): JSX.Element => {
  const { t } = useTranslation();

  const form = useFormContext<ApplicationFormValues>();
  const { getValues, watch } = form;

  const { options } = useOptions();
  const cities = options.cityOptions;

  const tos1 = tos.find((n) => n.pk === "generic1");
  const tos2 = tos.find((n) => n.pk === "KUVAnupa");

  const homeCity = watch("homeCityId");
  const city = homeCity
    ? cities.find((opt) => opt.value === homeCity.toString())
        ?.label ?? "-"
    : "-";

  return (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
        theme="thin"
      >
        <ApplicantInfoPreview city={city} application={getValues()} />
      </Accordion>
      <ApplicationEventList
        allReservationUnits={allReservationUnits}
      />
      <FormSubHeading>{t("reservationUnit:termsOfUse")}</FormSubHeading>
      {tos1 && <Terms tabIndex={0}>{getTranslation(tos1, "text")}</Terms>}
      <FormSubHeading>
        {t("application:preview.reservationUnitTerms")}
      </FormSubHeading>
      {tos2 && <Terms tabIndex={0}>{getTranslation(tos2, "text")}</Terms>}
      {acceptTermsOfUse != null && setAcceptTermsOfUse != null && (
        <CheckboxContainer>
          <Checkbox
            id="preview.acceptTermsOfUse"
            checked={acceptTermsOfUse}
            onChange={(e) => setAcceptTermsOfUse(e.target.checked)}
            label={t("application:preview.userAcceptsTerms")}
            // NOTE I'm assuming we can just hide the whole checkbox in View
          />
        </CheckboxContainer>
      )}
      <StyledNotification
        label={t("application:preview.notification.processing")}
      >
        {t("application:preview.notification.body")}
      </StyledNotification>
    </>
  );
};
