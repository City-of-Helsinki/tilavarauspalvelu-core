import React from "react";
import { useTranslation } from "next-i18next/pages";
import { ReserveeType } from "@gql/gql-types";
import type { ApplicantFieldsFragment } from "@gql/gql-types";
import { ApplicationInfoContainer, InfoItem, InfoItemContainer } from "@/styled/application";

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

type ApplicantT = Omit<ApplicantFieldsFragment, "municipality">;

type ApplicantInfoPreviewProps = Readonly<{
  application: ApplicantT;
  // Old applications of the default form can have active members. Show them only on the sports form.
  isSportsForm: boolean;
}>;

export function ApplicantInfoPreview({ application, isSportsForm }: ApplicantInfoPreviewProps): React.ReactElement {
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

  const isOrganisation = application.applicantType != null && application.applicantType !== ReserveeType.Individual;
  const shouldShowActiveMembers = isOrganisation && isSportsForm && application.organisationActiveMembers != null;

  // The design puts the active members on the first row, next to the other organisation fields.
  // Only that row has 4 columns, so the organisation fields and the contact fields are in separate containers.
  return (
    <>
      {isOrganisation && (
        <ApplicationInfoContainer $columnCount={shouldShowActiveMembers ? 4 : 3}>
          <LabelValue
            label={
              application.applicantType === ReserveeType.Company
                ? t("application:preview.organisation.companyName")
                : t("application:preview.organisation.name")
            }
            value={application.organisationName}
          />
          <LabelValue
            label={t("application:preview.organisation.coreBusiness")}
            value={application.organisationCoreBusiness}
          />
          <LabelValue
            label={
              application.applicantType === ReserveeType.Nonprofit
                ? t("application:preview.organisation.nonprofitRegistrationNumber")
                : t("application:preview.organisation.registrationNumber")
            }
            value={application.organisationIdentifier}
          />
          {shouldShowActiveMembers && (
            <LabelValue
              label={t("application:preview.organisation.activeMembers")}
              value={application.organisationActiveMembers}
            />
          )}
        </ApplicationInfoContainer>
      )}
      <ApplicationInfoContainer $hasDividerAbove={isOrganisation}>
        {application.applicantType == null && <div style={{ gridColumn: "1 / -1" }}>ERROR: applicantType is null</div>}
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
        {application.applicantType === ReserveeType.Individual && application.additionalInformation && (
          <LabelValue
            label={t("application:preview.additionalInformation")}
            value={application.additionalInformation}
            fullWidth
          />
        )}
      </ApplicationInfoContainer>
    </>
  );
}
