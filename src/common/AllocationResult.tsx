import uniqBy from "lodash/uniqBy";
import { AllocationResult } from "./types";
import {
  convertHMSToHours,
  normalizeApplicationEventStatus,
  secondsToHms,
} from "./util";

interface IReservationAllocation {
  seconds: number;
  volume: number;
}

interface IAllocationCapacity {
  hours: number;
  volume: number;
  percentage: number;
}

const getReservationAllocations = (
  allocationResults: AllocationResult[]
): IReservationAllocation => {
  return uniqBy(
    allocationResults,
    (n: AllocationResult) => n.applicationEvent.id
  )
    .filter(
      (n: AllocationResult) =>
        n.applicationEvent.aggregatedData.allocationResultsDurationTotal &&
        n.applicationEvent.aggregatedData.allocationResultsReservationsTotal &&
        ["validated"].includes(normalizeApplicationEventStatus(n))
    )
    .reduce(
      (acc: IReservationAllocation, cur: AllocationResult) => {
        return {
          seconds:
            acc.seconds +
            cur.applicationEvent.aggregatedData.allocationResultsDurationTotal,
          volume:
            acc.volume +
            cur.applicationEvent.aggregatedData
              .allocationResultsReservationsTotal,
        };
      },
      { seconds: 0, volume: 0 }
    );
};

export const getAllocationCapacity = (
  allocationResults: AllocationResult[],
  totalHourCapacity?: number
): IAllocationCapacity | null => {
  if (!totalHourCapacity) return null;
  const reservations = getReservationAllocations(allocationResults);
  const reservedHMS = secondsToHms(reservations.seconds);
  const hours = convertHMSToHours(reservedHMS);
  return {
    hours,
    volume: reservations.volume,
    percentage: Number(((hours / totalHourCapacity) * 100).toFixed(1)),
  };
};
