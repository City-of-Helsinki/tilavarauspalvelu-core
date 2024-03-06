import {
  type ApplicationNode,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  ApplicantTypeChoice,
} from "common/types/gql-types";

export function getApplicantName(app: ApplicationNode): string {
  if (app.applicantType === ApplicantTypeChoice.Individual) {
    const { firstName, lastName } = app.contactPerson || {};
    return `${firstName || "-"} ${lastName || "-"}`;
  }
  return app.organisation?.name || "-";
}

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
  status: ApplicationSectionStatusChoice
): string {
  switch (status) {
    case ApplicationSectionStatusChoice.Reserved:
    case ApplicationSectionStatusChoice.Unallocated:
    case ApplicationSectionStatusChoice.InAllocation:
      return "var(--color-alert-dark)";
    case ApplicationSectionStatusChoice.Handled:
      return "var(--color-success)";
    case ApplicationSectionStatusChoice.Failed:
    default:
      return "var(--color-error)";
  }
}
