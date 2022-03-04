import React from "react";
import { useTranslation } from "react-i18next";
import { Application, Parameter } from "../../modules/types";
import { SpanTwoColumns, TwoColumnContainer } from "../common/common";
import LabelValue from "../common/LabelValue";
import Address from "./AddressPreview";

const ApplicantInfoPreview = ({
  application,
  cities,
}: {
  application: Application;
  cities: { [key: number]: Parameter };
}): JSX.Element | null => {
  const { t } = useTranslation();

  return (
    <TwoColumnContainer>
      {application.applicantType !== "individual" ? (
        <>
          <LabelValue
            label={t("application:preview.organisation.name")}
            value={application.organisation?.name}
          />
          <LabelValue
            label={t("application:preview.applicantTypeLabel")}
            value={String(
              t(
                `application:preview.applicantType.${application.applicantType}`
              )
            )}
          />
          <SpanTwoColumns>
            <LabelValue
              label={t("application:preview.organisation.coreBusiness")}
              value={application.organisation?.coreBusiness}
            />
          </SpanTwoColumns>
          <SpanTwoColumns>
            <LabelValue
              label={t("application:preview.homeCity")}
              value={
                application.homeCityId
                  ? (cities[application.homeCityId].name as string)
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
      <LabelValue
        label={t("application:preview.firstName")}
        value={application.contactPerson?.firstName}
      />
      <LabelValue
        label={t("application:preview.lastName")}
        value={application.contactPerson?.lastName}
      />
      <LabelValue
        label={t("application:preview.email")}
        value={application.contactPerson?.email}
      />
      <LabelValue
        label={t("application:preview.phoneNumber")}
        value={application.contactPerson?.phoneNumber}
      />
      {application.applicantType === "individual" ? (
        <>
          <Address
            address={application.billingAddress}
            i18nMessagePrefix="common:address"
          />
          <LabelValue
            label={t("application:preview.additionalInformation")}
            value={application.additionalInformation}
          />
        </>
      ) : null}
    </TwoColumnContainer>
  );
};

export default ApplicantInfoPreview;
