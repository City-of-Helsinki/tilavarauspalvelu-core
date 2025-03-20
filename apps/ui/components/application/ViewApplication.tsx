import React from "react";
import { useTranslation } from "next-i18next";
import {
  ApplicationStatusChoice,
  type ApplicationViewFragment,
  type Maybe,
  type TermsOfUseTextFieldsFragment,
} from "@gql/gql-types";
import { ApplicantInfoPreview } from "./ApplicantInfoPreview";
import {
  ApplicationSection,
  ApplicationSectionHeader,
  StyledNotification,
} from "./styled";
import { ApplicationSectionList } from "./ApplicationSectionList";
import { Sanitize } from "common/src/components/Sanitize";
import TermsBox from "common/src/termsbox/TermsBox";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { gql } from "@apollo/client";

type ViewApplicationProps = {
  application: ApplicationViewFragment;
  tos: Maybe<TermsOfUseTextFieldsFragment>;
  isTermsAccepted?: { general: boolean; specific: boolean };
  setIsTermsAccepted?: (key: "general" | "specific", val: boolean) => void;
};

export function ViewApplication({
  application,
  tos,
  isTermsAccepted,
  setIsTermsAccepted,
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
        <ApplicationSectionList application={application} />
      </div>
      {tos && (
        <TermsBox
          id="preview.acceptTermsOfUse"
          body={<Sanitize html={getTranslationSafe(tos, "text", lang)} />}
          acceptLabel={t("application:preview.userAcceptsGeneralTerms")}
          accepted={isTermsAccepted?.general}
          setAccepted={
            setIsTermsAccepted
              ? (val) => setIsTermsAccepted("general", val)
              : undefined
          }
        />
      )}
      {tos2 && (
        <TermsBox
          id="preview.acceptServiceSpecificTerms"
          body={<Sanitize html={getTranslationSafe(tos2, "text", lang)} />}
          acceptLabel={t("application:preview.userAcceptsSpecificTerms")}
          accepted={isTermsAccepted?.specific}
          setAccepted={
            setIsTermsAccepted
              ? (val) => setIsTermsAccepted("specific", val)
              : undefined
          }
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

export const APPLICATION_VIEW_FRAGMENT = gql`
  fragment ApplicationView on ApplicationNode {
    ...ApplicationForm
    applicationRound {
      id
      sentDate
      status
      termsOfUse {
        id
        ...TermsOfUseFields
      }
    }
  }
`;
