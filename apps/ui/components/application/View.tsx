import React, { useState } from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import type { ApplicationType, TermsOfUseType } from "common/types/gql-types";
import { useOptions } from "@/hooks/useOptions";
import { getTranslation } from "@/modules/util";
import { BlackButton } from "@/styles/util";
import ApplicantInfoPreview from "./ApplicantInfoPreview";
import { CheckboxContainer, StyledNotification, Terms } from "./styled";
import { ButtonContainer, FormSubHeading } from "../common/common";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { ApplicationEventList } from "./ApplicationEventList";

type Props = {
  application: ApplicationType;
  tos: TermsOfUseType[];
};

const ViewApplication = ({ application, tos }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { options } = useOptions();
  const citiesOptions = options.cityOptions;

  const tos1 = tos.find((n) => n.pk === "generic1");
  const tos2 = tos.find((n) => n.pk === "KUVAnupa");

  return (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
        theme="thin"
      >
        <ApplicantInfoPreview
          cities={citiesOptions}
          application={application}
        />
      </Accordion>
      <ApplicationEventList />
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
