import React, { useState } from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import type { ApplicationNode, TermsOfUseType } from "common/types/gql-types";
import { useOptions } from "@/hooks/useOptions";
import { getTranslation } from "@/modules/util";
import { BlackButton } from "@/styles/util";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import { CheckboxContainer, StyledNotification, Terms } from "./styled";
import { ButtonContainer, FormSubHeading } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { ApplicationEventList } from "./ApplicationEventList";

type Props = {
  application: ApplicationNode;
  tos: TermsOfUseType[];
};

// TODO can refactor the use of ApplicationNode | ApplicationFormValues input type
// for components used here
// and instead just use FormContext here (remove the application prop)
// because this is wrapped inside [...params].tsx
// Though we'd like to remove [...params].tsx completely and use the file router instead.
const ViewApplication = ({ application, tos }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { options } = useOptions();
  const cities = options.cityOptions;

  const tos1 = tos.find((n) => n.pk === "generic1");
  const tos2 = tos.find((n) => n.pk === "KUVAnupa");
  const city = application.homeCity?.pk
    ? cities.find((opt) => opt.value === application.homeCity?.pk?.toString())
        ?.label
    : "";

  return (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
        theme="thin"
      >
        <ApplicantInfoPreview city={city ?? "-"} application={application} />
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
          disabled
        />
      </CheckboxContainer>
      <StyledNotification
        label={t("application:preview.notification.processing")}
      >
        {t("application:preview.notification.body")}
      </StyledNotification>
      <ButtonContainer>
        <BlackButton variant="secondary" onClick={() => router.back()}>
          {t("common:prev")}
        </BlackButton>
      </ButtonContainer>
    </>
  );
};

export default ViewApplication;
