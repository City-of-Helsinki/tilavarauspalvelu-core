import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Application, OptionType } from "common/types/common";
import { SpanTwoColumns, TwoColumnContainer } from "../common/common";
import LabelValue from "../common/LabelValue";
import Address from "./AddressPreview";

const StyledLabelValue = styled(LabelValue).attrs({ theme: "thin" })``;

const ApplicantInfoPreview = ({
  application,
  cities,
}: {
  application: Application;
  cities: OptionType[];
}): JSX.Element | null => {
  const { t } = useTranslation();

  return (
    <TwoColumnContainer>
      {application.applicantType !== "individual" ? (
        <>
          <StyledLabelValue
            label={t("application:preview.organisation.name")}
            value={application.organisation?.name}
          />
          <StyledLabelValue
            label={t("application:preview.applicantTypeLabel")}
            value={String(
              t(
                `application:preview.applicantType.${application.applicantType}`
              )
            )}
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
                application.homeCityId
                  ? cities.find(
                      (city) => city.value === application.homeCityId.toString()
                    )?.label
                  : ""
              }
            />
          </SpanTwoColumns>
          <Address
            address={application.organisation?.address}
            i18nMessagePrefix="common:address"
          />
          <Address
            address={application.billingAddress}
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
      {application.applicantType === "individual" ? (
        <>
          <Address
            address={application.billingAddress}
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
