import { convertHMSToSeconds } from "common/src/common/util";
import { ApplicationEvent, Cell } from "common/types/common";
import { cellsToApplicationEventSchedules, getReadableList } from "../util";

export const getLongestChunks = (selectorData: Cell[][][]): number[] =>
  selectorData.map((n) => {
    const primarySchedules = cellsToApplicationEventSchedules(
      n.map((nn) => nn.filter((nnn) => nnn.state === 300))
    );
    const secondarySchedules = cellsToApplicationEventSchedules(
      n.map((nn) => nn.filter((nnn) => nnn.state === 200))
    );

    return [...primarySchedules, ...secondarySchedules].reduce((acc, cur) => {
      const start = parseInt(cur.begin, 10);
      const end = cur.end === "00:00" ? 24 : parseInt(cur.end, 10);
      const length = end - start;
      return length > acc ? length : acc;
    }, 0);
  });

export const getApplicationEventsWhichMinDurationsIsNotFulfilled = (
  applicationEvents: ApplicationEvent[],
  selectorData: Cell[][][]
): number[] => {
  const selectedHours = getLongestChunks(selectorData);
  return applicationEvents
    .map((applicationEvent, index) => {
      return selectedHours[index] <
        convertHMSToSeconds(applicationEvent.minDuration) / 3600
        ? index
        : null;
    })
    .filter((n) => n !== null);
};

export const getListOfApplicationEventTitles = (
  applicationEvents: ApplicationEvent[],
  ids: number[]
): string => {
  return getReadableList(ids.map((id) => `"${applicationEvents[id].name}"`));
};
