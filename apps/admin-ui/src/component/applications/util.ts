import {
  type ApplicationNode,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  ApplicantTypeChoice,
} from "common/types/gql-types";

export const getApplicantName = (app: ApplicationNode): string => {
  return app.applicantType === ApplicantTypeChoice.Individual
    ? `${app.contactPerson?.firstName || "-"} ${
        app.contactPerson?.lastName || "-"
      }`
    : app.organisation?.name || "-";
};

export function getApplicationStatusColor(
  status: ApplicationStatusChoice,
  size: "s" | "l"
): string {
  switch (status) {
    case ApplicationStatusChoice.Handled:
      return "var(--color-info)";
    case ApplicationStatusChoice.InAllocation:
      return "var(--color-alert-dark)";
    case ApplicationStatusChoice.Received:
    case ApplicationStatusChoice.Draft:
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
}

export function getApplicationSectiontatusColor(
  status: ApplicationSectionStatusChoice,
  size: "s" | "l"
): string {
  switch (status) {
    case ApplicationSectionStatusChoice.Reserved:
    case ApplicationSectionStatusChoice.Unallocated:
      return "var(--color-alert-dark)";
    case ApplicationSectionStatusChoice.Handled:
      return "var(--color-success)";
    case ApplicationSectionStatusChoice.Failed:
    case ApplicationSectionStatusChoice.InAllocation:
    default:
      switch (size) {
        case "s":
          return "var(--color-error)";
        case "l":
        default:
          return "var(--color-error-dark)";
      }
  }
}
