import React from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import type { ApplicationNode, TermsOfUseType } from "common/types/gql-types";
import { getTranslation } from "@/modules/util";
import { ApplicantInfoPreview } from "./ApplicantInfoPreview";
import { FormSubHeading } from "../common/common";
import { CheckboxContainer, StyledNotification, Terms } from "./styled";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { ApplicationEventList } from "./ApplicationEventList";

export const ViewInner = ({
  application,
  tos,
  acceptTermsOfUse,
  setAcceptTermsOfUse,
}: {
  application: ApplicationNode;
  tos: TermsOfUseType | null;
  acceptTermsOfUse?: boolean;
  setAcceptTermsOfUse?: (value: boolean) => void;
}): JSX.Element => {
  const { t } = useTranslation();

  // FIXME why is KUVAnupa hardcoded here? and why it's only needed for the application
  // TODO do we need two different terms of use here? or do we need to select the correct one in the query?
  // const tos2 = tos.find((n) => n.pk === "KUVAnupa");

  return (
    <>
      <Accordion
        open
        id="basicInfo"
        heading={t("application:preview.basicInfoSubHeading")}
        theme="thin"
      >
        <ApplicantInfoPreview application={application} />
      </Accordion>
      <ApplicationEventList application={application} />
      <FormSubHeading>{t("reservationUnit:termsOfUse")}</FormSubHeading>
      {tos && <Terms tabIndex={0}>{getTranslation(tos, "text")}</Terms>}
      <FormSubHeading>
        {t("application:preview.reservationUnitTerms")}
      </FormSubHeading>
      {/* tos2 && <Terms tabIndex={0}>{getTranslation(tos2, "text")}</Terms>*/}
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
