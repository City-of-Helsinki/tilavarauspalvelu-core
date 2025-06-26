import React from "react";
import { useTranslation } from "next-i18next";
import { type ApplicantFieldsFragment, ReserveeType } from "@gql/gql-types";
import { ApplicationInfoContainer, InfoItem, InfoItemContainer } from "./styled";

const LabelValue = ({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value?: string | number | null;
  fullWidth?: boolean;
}) => {
  return (
    <InfoItemContainer $fullWidth={fullWidth}>
      <InfoItem>
        <h3 className="info-label">{label}</h3>
        <p>{value}</p>
      </InfoItem>
    </InfoItemContainer>
  );
};

type ApplicantT = Omit<ApplicantFieldsFragment, "municipality" | "additionalInformation">;

export function ApplicantInfoPreview({ application }: { application: ApplicantT }): JSX.Element {
  const { t } = useTranslation();
  const applicant = {
    name: `${application.contactPersonFirstName} ${application.contactPersonLastName}`,
    contact: `${application.contactPersonPhoneNumber} / ${application.contactPersonEmail}`,
    address: application.organisationStreetAddress
      ? `${application.organisationStreetAddress}, ${application.organisationPostCode} ${application.organisationCity}`
      : null,
    billingAddress: application.billingStreetAddress
      ? `${application.billingStreetAddress}, ${application.billingPostCode} ${application.billingCity}`
      : null,
  };

  return (
    <ApplicationInfoContainer>
      {application.applicantType == null ? (
        // TODO translate (though this is more a system error than a user error)
        <div style={{ gridColumn: "1 / -1" }}>ERROR: applicantType is null</div>
      ) : application.applicantType !== ReserveeType.Individual ? (
        <>
          <LabelValue label={t("application:preview.organisation.name")} value={application.organisationName} />
          <LabelValue
            label={t("application:preview.organisation.coreBusiness")}
            value={application.organisationCoreBusiness}
          />
          <LabelValue
            label={t("application:preview.organisation.registrationNumber")}
            value={application.organisationIdentifier}
          />
        </>
      ) : null}
      <LabelValue label={t("application:preview.contactPerson")} value={applicant.name} />
      <LabelValue label={t("application:preview.contactInfo")} value={applicant.contact} />
      {applicant.address && <LabelValue label={t("application:preview.address")} value={applicant.address} />}
      {applicant.billingAddress && (
        <LabelValue
          label={t("application:preview.organisation.billingAddress")}
          value={applicant.billingAddress}
          fullWidth={!!application.organisationStreetAddress}
        />
      )}
    </ApplicationInfoContainer>
  );
}
