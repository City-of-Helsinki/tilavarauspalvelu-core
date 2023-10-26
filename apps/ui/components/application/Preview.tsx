import React, { useState } from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { ApplicationNode, TermsOfUseType } from "common/types/gql-types";
import { useFormContext } from "react-hook-form";
import { getTranslation } from "@/modules/util";
import { useOptions } from "@/hooks/useOptions";
import { MediumButton } from "@/styles/util";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import { CheckboxContainer, StyledNotification, Terms } from "./styled";
import { ButtonContainer, FormSubHeading } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { ApplicationEventList } from "./ApplicationEventList";
import { ApplicationFormValues } from "./Form";

type Props = {
  application: ApplicationNode;
  // This only checks that the user accepts the terms of use, no form data modifications is done here
  onNext: () => void;
  tos: TermsOfUseType[];
};

// TODO this is so similar to View, why isn't it reused?
// of course this would use form context and view would use a query instead
const Preview = ({ onNext, application, tos }: Props): JSX.Element | null => {
  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { options } = useOptions();
  const cities = options.cityOptions;

  const { t } = useTranslation();

  const onSubmit = (): void => {
    onNext();
  };

  const form = useFormContext<ApplicationFormValues>();
  const { getValues } = form;

  const tos1 = tos.find((n) => n.pk === "generic1");
  const tos2 = tos.find((n) => n.pk === "KUVAnupa");

  const city = getValues("homeCityId")
    ? cities.find((opt) => opt.value === getValues("homeCityId"))?.label
    : "";

  console.log("values: ", getValues());
  // FIXME there are missing fields applicant stuff (name, type, address)
  // homecity is not set in the form
  // applicantType is not set
  // name etc. are odd? (the test case I'm using has empty organisation, but also both contact person and billing address)
  // FIXME there is also missing min / max duration (they are set in the form, display problem)
  // TODO use proper form submit
  return (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
        theme="thin"
      >
        {/* TODO this requires two different types of data,
         * one with form data (this) and the other one with query data (View)
         */}
        <ApplicantInfoPreview city={city ?? "-"} application={getValues()} />
      </Accordion>
      <ApplicationEventList
        allReservationUnits={
          application.applicationRound.reservationUnits ?? []
        }
      />
      <FormSubHeading>{t("reservationUnit:termsOfUse")}</FormSubHeading>
      {tos1 && <Terms tabIndex={0}>{getTranslation(tos1, "text")}</Terms>}
      <FormSubHeading>
        {t("application:preview.reservationUnitTerms")}
      </FormSubHeading>
      {tos2 && <Terms tabIndex={0}>{getTranslation(tos2, "text")}</Terms>}
      <CheckboxContainer>
        <Checkbox
          id="preview.acceptTermsOfUse"
          checked={acceptTermsOfUse}
          onChange={(e) => setAcceptTermsOfUse(e.target.checked)}
          label={t("application:preview.userAcceptsTerms")}
        />
      </CheckboxContainer>
      <StyledNotification
        label={t("application:preview.notification.processing")}
      >
        {t("application:preview.notification.body")}
      </StyledNotification>
      <ButtonContainer>
        <MediumButton
          variant="secondary"
          onClick={() => router.push(`${application.pk}/page3`)}
        >
          {t("common:prev")}
        </MediumButton>
        <MediumButton
          id="submit"
          onClick={onSubmit}
          disabled={!acceptTermsOfUse}
        >
          {t("common:submit")}
        </MediumButton>
      </ButtonContainer>
    </>
  );
};

export { Preview };
