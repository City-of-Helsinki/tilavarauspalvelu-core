import React from "react";
import {
  IconArrowBottomRight,
  IconArrowTopRight,
  IconCheck,
  IconCogwheel,
  IconEnvelope,
  IconPen,
  IconQuestionCircle,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { ApplicationStatusChoice, type Maybe } from "../../../gql/gql-types";
import type { UserTypeChoice } from "../../modules/urlBuilder";
import { type StatusLabelType } from "../StatusLabel";
import StatusLabel from "../StatusLabel";

function getAdminApplicationStatusLabelProps(status: ApplicationStatusChoice): {
  type: StatusLabelType;
  icon: JSX.Element;
} {
  switch (status) {
    case ApplicationStatusChoice.Draft:
      return { type: "draft", icon: <IconArrowTopRight /> };
    case ApplicationStatusChoice.InAllocation:
      return { type: "info", icon: <IconCogwheel /> };
    case ApplicationStatusChoice.Received:
      return { type: "alert", icon: <IconArrowBottomRight /> };
    case ApplicationStatusChoice.Handled:
      return { type: "success", icon: <IconCheck /> };
    case ApplicationStatusChoice.ResultsSent:
      return { type: "success", icon: <IconEnvelope /> };
    case ApplicationStatusChoice.Expired:
    case ApplicationStatusChoice.Cancelled:
      return { type: "neutral", icon: <IconQuestionCircle /> };
  }
}

function getCustomerApplicationStatusLabelProps(status: ApplicationStatusChoice): {
  type: StatusLabelType;
  icon: JSX.Element;
} {
  switch (status) {
    case ApplicationStatusChoice.Draft:
      return { type: "draft", icon: <IconPen /> };
    case ApplicationStatusChoice.ResultsSent:
      return { type: "success", icon: <IconCheck /> };
    case ApplicationStatusChoice.Handled:
    case ApplicationStatusChoice.InAllocation:
      return {
        type: "info",
        icon: <IconCogwheel />,
      };
    case ApplicationStatusChoice.Received:
      return { type: "alert", icon: <IconEnvelope /> };
    // These two should never be shown to the client, so they are shown as any other unexpected status
    case ApplicationStatusChoice.Cancelled:
    case ApplicationStatusChoice.Expired:
      return { type: "neutral", icon: <IconQuestionCircle /> };
  }
}

type Props = {
  status: Maybe<ApplicationStatusChoice> | undefined;
  testId?: string;
  slim?: boolean;
  user: UserTypeChoice;
};
/** Renders a status label for an application.
 *  @param status - The status of the application.
 *  @param testId - Optional id for testing.
 *  @param slim - Optional boolean for table version.
 *  @param user - The type of user viewing the label.
 * */
export function ApplicationStatusLabel({ status, testId, slim, user }: Props): JSX.Element | null {
  const { t } = useTranslation();
  if (!status) {
    return null;
  }

  const { type, icon } =
    user === "admin" ? getAdminApplicationStatusLabelProps(status) : getCustomerApplicationStatusLabelProps(status);

  return (
    <StatusLabel type={type} icon={icon} data-testid={testId} slim={slim}>
      {t(`application:status.${status}`)}
    </StatusLabel>
  );
}
