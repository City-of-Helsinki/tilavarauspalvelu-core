import { ApplicationEventNode } from "common/types/gql-types";
import { useSearchParams } from "react-router-dom";

export function useFocusApplicationEvent(): [
  number | undefined,
  (aes?: ApplicationEventNode) => void,
] {
  const [params, setParams] = useSearchParams();

  const selectedAeasPk = params.get("aes")
    ? Number(params.get("aes"))
    : undefined;

  // TODO this can be removed if we move this to a hook and reuse it in the other component
  // the state is already in a query param
  const setFocused = (aes?: ApplicationEventNode) => {
    //  setFocusedApplicationEvent(aes);
    // TODO if the applicationEvent is completely allocated => remove the selection
    if (aes?.pk != null) {
      const p = new URLSearchParams(params);
      p.set("aes", aes.pk.toString());
      setParams(p);
    } else {
      const p = new URLSearchParams(params);
      p.delete("aes");
      setParams(p);
    }
  };

  return [selectedAeasPk, setFocused];
}

/// Allow selecting a continuous block on a single day
/// state is saved in the URL as selectionBegin and selectionEnd parameters
/// TODO rework the interface, accepts string[] for compatibility, not because it's desired
export function useSlotSelection(): [string[], (slots: string[]) => void] {
  const [params, setParams] = useSearchParams();

  const setSelectedSlots = (slots: string[]) => {
    if (slots.length < 1) {
      const qp = new URLSearchParams(params);
      qp.delete("selectionBegin");
      qp.delete("selectionEnd");
      setParams(qp);
    } else {
      // TODO change the save format
      // current format is: {day}-{hour}-{minute}
      // what's the format we'd like to use?
      // we also don't allow using different days for begin and end so it should not be possible
      // => maybe selectionDay, selectionBegin, selectionEnd
      // with integers for each, time is in minutes from midnight?
      const selectionBegin = slots[0];
      const selectionEnd = slots[slots.length - 1];
      const qp = new URLSearchParams(params);
      qp.set("selectionBegin", selectionBegin);
      qp.set("selectionEnd", selectionEnd);
      setParams(qp);
    }
  };

  // generate a list of strings for each slot based on the interval
  // we can assume the same day for begin and end (so end day is ignored)
  const generateSelection = (begin: string, end: string): string[] => {
    // current format: {day}-{hour}-{minute}
    // with minute always 00 or 30
    const [day, beginHour, beginMinute] = begin.split("-");
    const [_, endHour, endMinute] = end.split("-");
    const slots = [];
    // NOTE: parseInt returns NaN for invalid => the loop checks will fail and return []
    for (let hour = parseInt(beginHour); hour <= parseInt(endHour); hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === parseInt(beginHour) && minute < parseInt(beginMinute)) {
          continue;
        }
        if (hour === parseInt(endHour) && minute > parseInt(endMinute)) {
          break;
        }
        // garbage format: hours have no leading zero, minutes have to have it
        const minuteString = minute < 10 ? `0${minute}` : `${minute}`;
        slots.push(`${day}-${hour}-${minuteString}`);
      }
    }
    return slots;
  };

  const getSelection = (): string[] => {
    const selectionBegin = params.get("selectionBegin");
    const selectionEnd = params.get("selectionEnd");
    if (selectionBegin == null || selectionEnd == null) {
      return [];
    }
    return generateSelection(selectionBegin, selectionEnd);
  };

  const selection = getSelection();

  return [selection, setSelectedSlots];
}
