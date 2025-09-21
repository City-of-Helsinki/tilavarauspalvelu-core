import React from "react";
import { useTranslation } from "next-i18next";
import { ApplicationStatusChoice } from "@gql/gql-types";
import type { ApplicationViewFragment } from "@gql/gql-types";
import { gql } from "@apollo/client";
import { ApplicationSection, ApplicationSectionHeader, StyledNotification } from "./styled";
import { ApplicantInfoPreview } from "./ApplicantInfoPreview";
import { ApplicationSectionList } from "./ApplicationSectionList";

type ViewApplicationProps = {
  application: ApplicationViewFragment;
  children: JSX.Element;
};

export function ViewApplication({ application, children }: ViewApplicationProps): JSX.Element {
  const { t } = useTranslation();
  const shouldShowNotification = application.status !== ApplicationStatusChoice.ResultsSent;
  return (
    <>
      <div>
        <ApplicationSection>
          <ApplicationSectionHeader>{t("application:preview.basicInfoSubHeading")}</ApplicationSectionHeader>
          <ApplicantInfoPreview application={application} />
        </ApplicationSection>
        <ApplicationSectionList application={application} />
      </div>
      {children}
      {shouldShowNotification && (
        <div>
          {/* Wrap the notification in a div, since HDS-notification has <section> as the root element and we need section:last-of-type to hit the last ApplicationSection */}
          <StyledNotification label={t("application:preview.notification.processing")}>
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
    applicationSections {
      id
      reservationUnitOptions {
        id
        reservationUnit {
          id
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
    applicationRound {
      id
      sentAt
      status
      termsOfUse {
        id
        ...TermsOfUseFields
      }
    }
  }
`;
