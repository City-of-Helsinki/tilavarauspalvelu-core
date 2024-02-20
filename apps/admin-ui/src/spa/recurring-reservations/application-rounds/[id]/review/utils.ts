import {
  ApplicantTypeChoice,
  ApplicationStatusChoice,
  ApplicationSectionStatusChoice,
} from "common/types/gql-types";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";

export function transformApplicationSectionStatus(
  status: string[]
): ApplicationSectionStatusChoice[] {
  return status
    .map((s) => {
      switch (s) {
        case ApplicationSectionStatusChoice.Handled:
          return ApplicationSectionStatusChoice.Handled;
        case ApplicationSectionStatusChoice.Unallocated:
          return ApplicationSectionStatusChoice.Unallocated;
        case ApplicationSectionStatusChoice.InAllocation:
          return ApplicationSectionStatusChoice.InAllocation;
        case ApplicationSectionStatusChoice.Failed:
          return ApplicationSectionStatusChoice.Failed;
        case ApplicationSectionStatusChoice.Reserved:
          return ApplicationSectionStatusChoice.Reserved;
        default:
          return undefined;
      }
    })
    .filter((s): s is NonNullable<typeof s> => s != null);
}

export function transformApplicationStatuses(
  filters: string[]
): ApplicationStatusChoice[] {
  if (filters.length === 0) {
    return VALID_ALLOCATION_APPLICATION_STATUSES;
  }
  return filters
    .map((filter) => {
      switch (filter) {
        case ApplicationStatusChoice.Received:
          return ApplicationStatusChoice.Received;
        case ApplicationStatusChoice.Handled:
          return ApplicationStatusChoice.Handled;
        case ApplicationStatusChoice.ResultsSent:
          return ApplicationStatusChoice.ResultsSent;
        case ApplicationStatusChoice.InAllocation:
          return ApplicationStatusChoice.InAllocation;
        default:
          return undefined;
      }
    })
    .filter((asc): asc is NonNullable<typeof asc> => asc != null);
}

export function transformApplicantType(
  filters: string[]
): ApplicantTypeChoice[] {
  return filters
    .map((filter) => {
      switch (filter) {
        case ApplicantTypeChoice.Individual:
          return ApplicantTypeChoice.Individual;
        case ApplicantTypeChoice.Company:
          return ApplicantTypeChoice.Company;
        case ApplicantTypeChoice.Community:
          return ApplicantTypeChoice.Community;
        case ApplicantTypeChoice.Association:
          return ApplicantTypeChoice.Association;
        default:
          return undefined;
      }
    })
    .filter((at): at is NonNullable<typeof at> => at != null);
}
