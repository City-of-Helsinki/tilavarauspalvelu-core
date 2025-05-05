import React from "react";
import { useTranslation } from "next-i18next";
import {
  type AddressFieldsFragment,
  type ApplicantFragment,
  ApplicantTypeChoice,
} from "@gql/gql-types";
import {
  ApplicationInfoContainer,
  InfoItemContainer,
  InfoItem,
} from "./styled";

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

type ApplicantT = Omit<ApplicantFragment, "homeCity" | "additionalInformation">;

function formatAddress(
  address: AddressFieldsFragment | null | undefined
): string | null {
  if (address?.streetAddressTranslations.fi) {
    return `${address.streetAddressTranslations.fi}, ${address.postCode} ${address.cityTranslations.fi}`;
  }
  return null;
}

export function ApplicantInfoPreview({
  application,
}: {
  application: ApplicantT;
}): JSX.Element {
  const { t } = useTranslation();
  const applicant = {
    name: `${application.contactPerson?.firstName} ${application.contactPerson?.lastName}`,
    contact: `${application.contactPerson?.phoneNumber} / ${application.contactPerson?.email}`,
    address: formatAddress(application.organisation?.address),
    billingAddress: formatAddress(application.billingAddress),
  };

  return (
    <ApplicationInfoContainer>
      {application.applicantType == null ? (
        // TODO translate (though this is more a system error than a user error)
        <div style={{ gridColumn: "1 / -1" }}>ERROR: applicantType is null</div>
      ) : application.applicantType !== ApplicantTypeChoice.Individual ? (
        <>
          <LabelValue
            label={t("application:preview.organisation.name")}
            value={application.organisation?.nameTranslations.fi}
          />
          <LabelValue
            label={t("application:preview.organisation.coreBusiness")}
            value={application.organisation?.coreBusinessTranslations.fi}
          />
          <LabelValue
            label={t("application:preview.organisation.registrationNumber")}
            value={application.organisation?.identifier}
          />
        </>
      ) : null}
      <LabelValue
        label={t("application:preview.contactPerson")}
        value={applicant.name}
      />
      <LabelValue
        label={t("application:preview.contactInfo")}
        value={applicant.contact}
      />
      {applicant.address && (
        <LabelValue
          label={t("application:preview.address")}
          value={applicant.address}
        />
      )}
      {applicant.billingAddress && (
        <LabelValue
          label={t("application:preview.organisation.billingAddress")}
          value={applicant.billingAddress}
          fullWidth={
            !!application.organisation?.address?.streetAddressTranslations.fi
          }
        />
      )}
    </ApplicationInfoContainer>
  );
}
