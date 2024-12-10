import React from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import {
  type ApplicationQuery,
  ApplicationStatusChoice,
  type Maybe,
  type TermsOfUseTextFieldsFragment,
} from "@gql/gql-types";
import { getTranslation } from "@/modules/util";
import { ApplicantInfoPreview } from "./ApplicantInfoPreview";
import {
  ApplicationSection,
  ApplicationSectionHeader,
  StyledNotification,
  TermsAccordion as Accordion,
} from "./styled";
import { ApplicationEventList } from "./ApplicationEventList";
import Sanitize from "../common/Sanitize";
import TermsBox from "common/src/termsbox/TermsBox";

type Node = NonNullable<ApplicationQuery["application"]>;
export function ViewApplication({
  application,
  tos,
  acceptTermsOfUse,
  setAcceptTermsOfUse,
}: {
  application: Node;
  tos: Maybe<TermsOfUseTextFieldsFragment>;
  acceptTermsOfUse?: boolean;
  setAcceptTermsOfUse?: (value: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();

  const tos2 = application.applicationRound?.termsOfUse;
  const shouldShowNotification =
    application.status !== ApplicationStatusChoice.ResultsSent &&
    application.status !== ApplicationStatusChoice.Draft;
  return (
    <>
      <div>
        <ApplicationSection>
          <ApplicationSectionHeader>
            {t("application:preview.basicInfoSubHeading")}
          </ApplicationSectionHeader>
          <ApplicantInfoPreview application={application} />
        </ApplicationSection>
        <ApplicationEventList application={application} />
      </div>
      {tos && (
        <Accordion
          id="preview.acceptTermsOfUse"
          heading={t("reservationUnit:termsOfUse")}
          open
        >
          <TermsBox
            id="preview.acceptTermsOfUse"
            body={<Sanitize html={getTranslation(tos, "text")} />}
          />
        </Accordion>
      )}
      {tos2 && (
        <Accordion heading={t("application:preview.reservationUnitTerms")} open>
          <TermsBox
            id="preview.acceptServiceSpecificTerms"
            body={<Sanitize html={getTranslation(tos2, "text")} />}
            /* TODO TermsBox has accepted and checkbox we could use but for now leaving the single
             * page specific checkbox to accept all terms */
          />
        </Accordion>
      )}
      {acceptTermsOfUse != null && setAcceptTermsOfUse != null && (
        <Checkbox
          id="preview.acceptTermsOfUse"
          checked={acceptTermsOfUse}
          onChange={(e) => setAcceptTermsOfUse(e.target.checked)}
          label={t("application:preview.userAcceptsTerms")}
          // NOTE I'm assuming we can just hide the whole checkbox in View
        />
      )}
      {shouldShowNotification && (
        <div>
          {/* Wrap the notification in a div, since HDS-notification has <section> as the root element and we need section:last-of-type to hit the last ApplicationSection */}
          <StyledNotification
            label={t("application:preview.notification.processing")}
          >
            {t("application:preview.notification.body")}
          </StyledNotification>
        </div>
      )}
    </>
  );
}
