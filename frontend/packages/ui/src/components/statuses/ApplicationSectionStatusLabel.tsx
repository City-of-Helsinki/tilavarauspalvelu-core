import React from "react";
import { IconArrowBottomRight, IconCheck, IconCogwheel, IconCross, IconQuestionCircleFill } from "hds-react";
import { useTranslation } from "next-i18next";
import { ApplicationSectionStatusChoice } from "../../../gql/gql-types";
import { UserTypeChoice } from "../../modules/urlBuilder";
import StatusLabel, { type StatusLabelType } from "../StatusLabel";

type StatusProps = { type: StatusLabelType; icon: React.ReactElement };
function getStaffLabelProps(status: ApplicationSectionStatusChoice): StatusProps {
  switch (status) {
    case ApplicationSectionStatusChoice.Unallocated:
      return { type: "alert", icon: <IconArrowBottomRight /> };
    case ApplicationSectionStatusChoice.InAllocation:
      return { type: "info", icon: <IconCogwheel /> };
    case ApplicationSectionStatusChoice.Handled:
      return { type: "success", icon: <IconCheck /> };
    case ApplicationSectionStatusChoice.Rejected:
      return { type: "error", icon: <IconCross /> };
  }
}

function getCustomerLabelProps(status: ApplicationSectionStatusChoice): StatusProps {
  switch (status) {
    case ApplicationSectionStatusChoice.Handled:
      return { type: "success", icon: <IconCheck /> };
    case ApplicationSectionStatusChoice.Rejected:
      return { type: "error", icon: <IconCross /> };
    default:
      return { type: "info", icon: <IconQuestionCircleFill /> };
  }
}

type Props = {
  status: ApplicationSectionStatusChoice;
  testId?: string;
  user: UserTypeChoice;
  slim?: boolean;
};

export function ApplicationSectionStatusLabel({ status, testId, user, slim }: Props): React.ReactElement {
  const { t } = useTranslation();

  const { type, icon } = user === "customer" ? getCustomerLabelProps(status) : getStaffLabelProps(status);
  const label =
    user === "customer"
      ? t(`application:applicationSectionStatus.${status}`)
      : t(`translation:ApplicationSectionStatusChoice.${status}`);
  return (
    <StatusLabel type={type} icon={icon} slim={slim} data-testId={testId}>
      {label}
    </StatusLabel>
  );
}
