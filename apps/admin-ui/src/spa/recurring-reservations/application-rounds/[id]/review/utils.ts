import {
  ApplicantTypeChoice,
  ApplicationEventStatusChoice,
  ApplicationStatusChoice,
} from "common/types/gql-types";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";

export function transformApplicationEventStatus(
  status: string[]
): ApplicationEventStatusChoice[] {
  return status
    .map((s) => {
      switch (s) {
        case ApplicationEventStatusChoice.Approved:
          return ApplicationEventStatusChoice.Approved;
        case ApplicationEventStatusChoice.Unallocated:
          return ApplicationEventStatusChoice.Unallocated;
        case ApplicationEventStatusChoice.Declined:
          return ApplicationEventStatusChoice.Declined;
        case ApplicationEventStatusChoice.Failed:
          return ApplicationEventStatusChoice.Failed;
        case ApplicationEventStatusChoice.Reserved:
          return ApplicationEventStatusChoice.Reserved;
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
