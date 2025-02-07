import React from "react";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import {
  type ApplicationCommonFragment,
  ApplicationStatusChoice,
  type Maybe,
  type TermsOfUseTextFieldsFragment,
} from "@gql/gql-types";
import { ApplicantInfoPreview } from "./ApplicantInfoPreview";
import {
  ApplicationSection,
  ApplicationSectionHeader,
  StyledNotification,
  TermsAccordion as Accordion,
} from "./styled";
import { ApplicationEventList } from "./ApplicationEventList";
import { Sanitize } from "common/src/components/Sanitize";
import TermsBox from "common/src/termsbox/TermsBox";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

type ViewApplicationProps = {
  application: ApplicationCommonFragment;
  tos: Maybe<TermsOfUseTextFieldsFragment>;
  acceptTermsOfUse?: boolean;
  setAcceptTermsOfUse?: (value: boolean) => void;
};

export function ViewApplication({
  application,
  tos,
  acceptTermsOfUse,
  setAcceptTermsOfUse,
}: ViewApplicationProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

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
            body={<Sanitize html={getTranslationSafe(tos, "text", lang)} />}
          />
        </Accordion>
      )}
      {tos2 && (
        <Accordion heading={t("application:preview.reservationUnitTerms")} open>
          <TermsBox
            id="preview.acceptServiceSpecificTerms"
            body={<Sanitize html={getTranslationSafe(tos2, "text", lang)} />}
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
