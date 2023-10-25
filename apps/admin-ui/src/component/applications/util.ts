import {
  ApplicationStatusChoice as ApplicationStatusGql,
  type ApplicationNode,
} from "common/types/gql-types";
import {
  Application,
  ApplicationRoundStatus,
  ApplicationStatus,
} from "common/types/common";

export const applicantName = (app: Application | ApplicationNode): string => {
  return app.applicantType === "individual" ||
    app.applicantType === "INDIVIDUAL"
    ? `${app.contactPerson?.firstName || "-"} ${
        app.contactPerson?.lastName || "-"
      }`
    : app.organisation?.name || "-";
};

export const getApplicationStatusColor = (
  status: ApplicationStatus,
  size: "s" | "l"
): string => {
  let color = "";
  switch (status) {
    case "draft":
    case "in_review":
      color = "var(--color-info)";
      break;
    case "review_done":
      color = "var(--color-success)";
      break;
    case "approved":
    case "sent":
      color = "var(--color-white)";
      break;
    case "declined":
    case "cancelled":
      switch (size) {
        case "s":
          color = "var(--color-error)";
          break;
        case "l":
        default:
          color = "var(--color-error-dark)";
      }
      break;
    default:
  }

  return color;
};

/// @deprecated
export const applicationStatusFromGqlToRest = (
  t?: ApplicationStatusGql
): ApplicationStatus => {
  switch (t) {
    case ApplicationStatusGql.Handled:
      return "handled";
    case ApplicationStatusGql.ResultsSent:
      return "review_done";
    case ApplicationStatusGql.InAllocation:
    case ApplicationStatusGql.Expired:
      return "in_review";
    case ApplicationStatusGql.Cancelled:
      return "cancelled";
    case ApplicationStatusGql.Received:
    case ApplicationStatusGql.Draft:
    default:
      return "draft";
  }
};

/// @deprecated
export const getNormalizedApplicationStatus = (
  status: ApplicationStatus,
  view: ApplicationRoundStatus
): ApplicationStatus => {
  let normalizedStatus: ApplicationStatus = status;
  if (["draft", "in_review", "allocated"].includes(view)) {
    if (status === "in_review") {
      normalizedStatus = "review_done";
    }
  } else if (view === "approved") {
    if (["in_review", "review_done"].includes(normalizedStatus)) {
      normalizedStatus = "approved";
    }
  }

  return normalizedStatus;
};
