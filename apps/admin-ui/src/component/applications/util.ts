import {
  type ApplicationNode,
  ApplicationEventStatusChoice,
  ApplicationStatusChoice,
  ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";

export const getApplicantName = (app: ApplicationNode): string => {
  return app.applicantType === ApplicationsApplicationApplicantTypeChoices.Individual
    ? `${app.contactPerson?.firstName || "-"} ${
        app.contactPerson?.lastName || "-"
      }`
    : app.organisation?.name || "-";
}

export const getApplicationStatusColor = (
  status: ApplicationStatusChoice,
  size: "s" | "l"
): string => {
  switch (status) {
    case ApplicationStatusChoice.Received:
    case ApplicationStatusChoice.Draft:
      return "var(--color-info)";
    case ApplicationStatusChoice.Handled:
    case ApplicationStatusChoice.InAllocation:
      return "var(--color-success)";
    case ApplicationStatusChoice.ResultsSent:
      return "var(--color-white)";
    case ApplicationStatusChoice.Expired:
    case ApplicationStatusChoice.Cancelled:
    default:
      switch (size) {
        case "s":
          return "var(--color-error)";
        case "l":
        default:
          return "var(--color-error-dark)";
      }
  }
};

export const getApplicationEventStatusColor = (
  status: ApplicationEventStatusChoice,
  size: "s" | "l"
): string => {
  switch (status) {
    case ApplicationEventStatusChoice.Reserved:
    case ApplicationEventStatusChoice.Unallocated:
      return "var(--color-info)";
    case ApplicationEventStatusChoice.Approved:
      return "var(--color-success)";
    // return "var(--color-alert-light)";
    case ApplicationEventStatusChoice.Failed:
    case ApplicationEventStatusChoice.Declined:
    default:
      switch (size) {
        case "s":
          return "var(--color-error)";
        case "l":
        default:
          return "var(--color-error-dark)";
      }
  }
};
