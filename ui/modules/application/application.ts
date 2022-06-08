import { ApplicationEvent, Cell } from "../types";
import { convertHMSToSeconds, getReadableList } from "../util";

export const getSelectedHours = (selectorData: Cell[][][]): number[] =>
  selectorData.map((n) =>
    n.reduce((acc, cur) => acc + cur.filter((nn) => nn.state).length, 0)
  );

export const getApplicationEventsWhichMinDurationsIsNotFulfilled = (
  applicationEvents: ApplicationEvent[],
  selectorData: Cell[][][]
): number[] => {
  const selectedHours = getSelectedHours(selectorData);
  return applicationEvents
    .map((applicationEvent, index) =>
      selectedHours[index] <
      convertHMSToSeconds(applicationEvent.minDuration) / 3600
        ? index
        : null
    )
    .filter((n) => n !== null);
};

export const getListOfApplicationEventTitles = (
  applicationEvents: ApplicationEvent[],
  ids: number[]
): string => {
  return getReadableList(ids.map((id) => `"${applicationEvents[id].name}"`));
};
