/** Robot Framework Collections library keywords the suite uses, with the same names. */
import { argsOf, library, Named, str } from "./robot";
import type { RobotValue } from "./robot";

function index(list: RobotValue[], value: RobotValue): number {
  const position = Number(value);
  return position < 0 ? list.length + position : position;
}

export const Collections = library("Collections", {
  "Append To List": (list: RobotValue[], ...values: RobotValue[]) => {
    list.push(...values);
  },

  "Get From List": (list: RobotValue[], position: RobotValue) => {
    const item: unknown = list[index(list, position)];
    if (index(list, position) >= list.length || index(list, position) < 0) {
      throw new RangeError(`Given index ${String(position)} is out of the range 0-${list.length - 1}.`);
    }
    return item;
  },

  "Get From Dictionary": (...args: RobotValue[]) => {
    const { dictionary, key, default: fallback } = argsOf(args, ["dictionary", "key", "default"]);
    if (dictionary != null && Object.hasOwn(dictionary, String(key))) {
      return dictionary[String(key)];
    }
    if (args.at(-1) instanceof Named || args.length > 2) {
      return fallback;
    }
    throw new Error(`Dictionary does not contain key '${String(key)}'.`);
  },

  "Get Index From List": (list: RobotValue[], value: RobotValue) => list.findIndex((item) => str(item) === str(value)),

  "List Should Not Contain Value": (list: RobotValue[], value: RobotValue, msg?: RobotValue) => {
    if (list.some((item) => str(item) === str(value))) {
      throw new Error(msg == null || msg === "" ? `${str(list)} contains value '${str(value)}'.` : String(msg));
    }
  },

  "Reverse List": (list: RobotValue[]) => {
    list.reverse();
  },

  /** Robot's `Set To Dictionary    ${dict}    key=value` changes the dictionary in place. */
  "Set To Dictionary": (dictionary: Record<string, RobotValue>, ...items: RobotValue[]) => {
    const last = items.at(-1);
    const pairs = last instanceof Named ? items.slice(0, -1) : items;
    for (let position = 0; position + 1 < pairs.length; position += 2) {
      dictionary[String(pairs[position])] = pairs[position + 1];
    }
    if (last instanceof Named) {
      Object.assign(dictionary, last.values);
    }
    return dictionary;
  },
});
