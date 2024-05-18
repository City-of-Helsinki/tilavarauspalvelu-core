import React from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import type { ApplicationQuery, TermsOfUseNode } from "@gql/gql-types";
import { getTranslation } from "@/modules/util";
import { ApplicantInfoPreview } from "./ApplicantInfoPreview";
import { CheckboxContainer, StyledNotification } from "./styled";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { ApplicationEventList } from "./ApplicationEventList";
import TermsBox from "common/src/termsbox/TermsBox";
import Sanitize from "../common/Sanitize";

type Node = NonNullable<ApplicationQuery["application"]>;
export function ViewInner({
  application,
  tos,
  acceptTermsOfUse,
  setAcceptTermsOfUse,
}: {
  application: Node;
  tos: TermsOfUseNode | null;
  acceptTermsOfUse?: boolean;
  setAcceptTermsOfUse?: (value: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();

  const tos2 = application.applicationRound?.termsOfUse;

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
      {tos && (
        <TermsBox
          id="preview.acceptTermsOfUse"
          heading={t("reservationUnit:termsOfUse")}
          body={<Sanitize html={getTranslation(tos, "text")} />}
        />
      )}
      {tos2 && (
        <TermsBox
          id="preview.acceptServiceSpecificTerms"
          heading={t("application:preview.reservationUnitTerms")}
          body={<Sanitize html={getTranslation(tos2, "text")} />}
          /* TODO TermsBox has accepted and checkbox we could use but for now leaving the single
           * page specfici checkbox to accept all terms */
        />
      )}
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
}
