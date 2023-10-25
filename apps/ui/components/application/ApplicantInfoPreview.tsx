import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { OptionType } from "common/types/common";
import {
  ApplicationNode,
  ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";
import { SpanTwoColumns, TwoColumnContainer } from "../common/common";
import LabelValue from "../common/LabelValue";
import Address from "./AddressPreview";

const StyledLabelValue = styled(LabelValue).attrs({ theme: "thin" })``;

const ApplicantInfoPreview = ({
  application,
  cities,
}: {
  application: ApplicationNode;
  cities: OptionType[];
}): JSX.Element => {
  const { t } = useTranslation();

  return (
    <TwoColumnContainer>
      {application.applicantType !==
      ApplicationsApplicationApplicantTypeChoices.Individual ? (
        <>
          <StyledLabelValue
            label={t("application:preview.organisation.name")}
            value={application.organisation?.name}
          />
          <StyledLabelValue
            label={t("application:preview.applicantTypeLabel")}
            value={
              application.applicantType &&
              String(
                t(
                  `application:preview.applicantType.${application.applicantType}`
                )
              )
            }
          />
          <SpanTwoColumns>
            <StyledLabelValue
              label={t("application:preview.organisation.coreBusiness")}
              value={application.organisation?.coreBusiness}
            />
          </SpanTwoColumns>
          <SpanTwoColumns>
            <StyledLabelValue
              label={t("application:preview.homeCity")}
              value={
                application.homeCity?.pk
                  ? cities.find(
                      (city) =>
                        city.value === application.homeCity?.pk?.toString()
                    )?.label
                  : ""
              }
            />
          </SpanTwoColumns>
          <Address
            address={application.organisation?.address ?? undefined}
            i18nMessagePrefix="common:address"
          />
          <Address
            address={application.billingAddress ?? undefined}
            i18nMessagePrefix="common:billingAddress"
          />
        </>
      ) : null}
      <StyledLabelValue
        label={t("application:preview.firstName")}
        value={application.contactPerson?.firstName}
      />
      <StyledLabelValue
        label={t("application:preview.lastName")}
        value={application.contactPerson?.lastName}
      />
      <StyledLabelValue
        label={t("application:preview.email")}
        value={application.contactPerson?.email}
      />
      <StyledLabelValue
        label={t("application:preview.phoneNumber")}
        value={application.contactPerson?.phoneNumber}
      />
      {application.applicantType ===
      ApplicationsApplicationApplicantTypeChoices.Individual ? (
        <>
          <Address
            address={application.billingAddress ?? undefined}
            i18nMessagePrefix="common:address"
          />
          <StyledLabelValue
            label={t("application:preview.additionalInformation")}
            value={application.additionalInformation}
          />
        </>
      ) : null}
    </TwoColumnContainer>
  );
};

export default ApplicantInfoPreview;
