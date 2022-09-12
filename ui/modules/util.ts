import { isAfter, parseISO, isBefore, parse } from "date-fns";
import { i18n, TFunction } from "next-i18next";
import { stringify } from "query-string";
import { trim } from "lodash";
import { ApolloError } from "@apollo/client";
import { toApiDate, toUIDate, isValidDate } from "common/src/common/util";
import {
  ApplicationEventSchedule,
  Cell,
  LocalizationLanguages,
  OptionType,
  Parameter,
  TranslationObject,
  ReservationUnit,
  Image,
  ReducedApplicationStatus,
  StringParameter,
  ApplicationEventSchedulePriority,
} from "common/types/common";
import {
  searchPrefix,
  emptyOption,
  applicationsPrefix,
  singleSearchPrefix,
  reservationsPrefix,
} from "./const";
import {
  ReservationUnitImageType,
  ReservationUnitType,
  ApplicationStatus,
} from "./gql-types";

export const isActive = (startDate: string, endDate: string): boolean => {
  const now = new Date().getTime();
  return (
    isAfter(now, parseISO(startDate).getTime()) &&
    isBefore(now, parseISO(endDate).getTime())
  );
};

const isPast = (endDate: string): boolean => {
  const now = new Date().getTime();
  return isAfter(now, parseISO(endDate).getTime());
};

export const applicationRoundState = (
  startDate: string,
  endDate: string
): "pending" | "active" | "past" => {
  if (isPast(endDate)) {
    return "past";
  }
  if (isActive(startDate, endDate)) {
    return "active";
  }

  return "pending";
};

export const parseDate = (date: string): Date => parseISO(date);

const fromAPIDate = (date: string): Date => {
  const d = parse(date, "yyyy-MM-dd", new Date());
  return d;
};

export const formatDate = (date: string, formatStr?: string): string => {
  if (!date) {
    return "-";
  }
  return toUIDate(parseISO(date), formatStr);
};

export const fromUIDate = (date: string): Date => {
  return parse(date, "d.M.yyyy", new Date());
};

export const apiDateToUIDate = (date: string): string => {
  return toUIDate(fromAPIDate(date));
};

export const uiDateToApiDate = (date: string): string => {
  if (date.indexOf(".") === -1) {
    return date;
  }
  return toApiDate(fromUIDate(date));
};

export const capitalize = (s: string): string => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const isValidDateString = (date: string): boolean => {
  return isValidDate(parse(date, "d.M.yyyy", new Date()));
};

export const formatApiDate = (date: string): string => {
  if (!date) {
    return "no date";
  }
  return toApiDate(parseISO(date));
};

export const localizedValue = (
  name: string | TranslationObject | undefined,
  lang: string
): string => {
  if (!name) {
    return "";
  }
  // needed until api stabilizes
  if (typeof name === "string") {
    return name;
  }
  return (
    name[lang as LocalizationLanguages] || name.fi || name.en || name.sv || ""
  );
};

export const getTranslation = (parent: unknown, key: string): string => {
  const keyString = `${key}${capitalize(i18n.language)}`;
  if (parent && parent[keyString]) {
    return parent[keyString];
  }

  return "";
};

const getLabel = (
  parameter: Parameter,
  lang: LocalizationLanguages = "fi"
): string => {
  if (parameter.name) {
    return localizedValue(parameter.name, lang);
  }
  if (parameter.minimum || parameter.maximum) {
    return `${parameter.minimum || ""} - ${parameter.maximum || ""}`;
  }
  return "no label";
};

export const mapOptions = (
  src: Parameter[] | StringParameter[],
  emptyOptionLabel?: string,
  lang = "fi"
): OptionType[] => {
  const r = (<OptionType[]>[])
    .concat(emptyOptionLabel ? [emptyOption(emptyOptionLabel)] : [])
    .concat(
      src.map((v) => ({
        label: getLabel(v, lang as LocalizationLanguages),
        value: v.id,
      }))
    );
  return r;
};

export const getSelectedOption = (
  selectedId: number | string | null,
  options: OptionType[]
): OptionType | undefined => {
  const selected = String(selectedId);
  const option = options.find((o) => String(o.value) === selected);
  return option;
};

export const getComboboxValues = (
  value: string,
  options: OptionType[]
): OptionType[] => {
  if (!value || options.length < 1) return undefined;
  return value.includes(",")
    ? value.split(",").map((unit) => getSelectedOption(unit, options))
    : [getSelectedOption(value, options)];
};

export const searchUrl = (params: unknown): string =>
  `${searchPrefix}/?${stringify(params)}`;

export const singleSearchUrl = (params: unknown): string =>
  `${singleSearchPrefix}/?${stringify(params)}`;

export const applicationsUrl = `${applicationsPrefix}/`;
export const reservationsUrl = `${reservationsPrefix}/`;

export function deepCopy<T>(src: T): T {
  return JSON.parse(JSON.stringify(src));
}

export const apiDurationToMinutes = (duration: string): number => {
  if (!duration) {
    return 0;
  }
  const parts = duration.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
};

const formatNumber = (n: number): string => `0${n > 23 ? 0 : n}`.slice(-2);

type Timespan = {
  begin: number;
  end: number;
  priority: ApplicationEventSchedulePriority;
};

export const cellsToApplicationEventSchedules = (
  cells: Cell[][]
): ApplicationEventSchedule[] => {
  const daySchedules = [] as ApplicationEventSchedule[];
  for (let day = 0; day < cells.length; day += 1) {
    const dayCells = cells[day];
    dayCells
      .filter((cell) => cell.state)
      .map(
        (cell) =>
          ({
            begin: cell.hour,
            end: cell.hour + 1,
            priority: cell.state,
          } as Timespan)
      )
      .reduce((prev, current) => {
        if (!prev.length) {
          return [current];
        }
        if (
          prev[prev.length - 1].end === current.begin &&
          prev[prev.length - 1].priority === current.priority
        ) {
          return [
            ...prev.slice(0, prev.length - 1),
            {
              begin: prev[prev.length - 1].begin,
              end: prev[prev.length - 1].end + 1,
              priority: prev[prev.length - 1].priority,
            },
          ];
        }
        return prev.concat([current]);
      }, [] as Timespan[])
      .map((cell) => {
        return {
          day,
          begin: `${formatNumber(cell.begin)}:00`,
          end: `${formatNumber(cell.end)}:00`,
          priority: cell.priority,
        } as ApplicationEventSchedule;
      })
      .forEach((e) => daySchedules.push(e));
  }
  return daySchedules;
};

const cellLabel = (row: number): string => {
  return `${row} - ${row + 1}`;
};

export const applicationEventSchedulesToCells = (
  applicationEventSchedules: ApplicationEventSchedule[]
): Cell[][] => {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

  const cells = [] as Cell[][];

  for (let j = 0; j < 7; j += 1) {
    const day = [];
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      day.push({
        key: `${i}-${j}`,
        hour: i,
        label: cellLabel(i),
        state: false,
      });
    }
    cells.push(day);
  }

  applicationEventSchedules.forEach((applicationEventSchedule) => {
    const { day } = applicationEventSchedule;
    const hourBegin =
      Number(applicationEventSchedule.begin.substring(0, 2)) - firstSlotStart;

    const hourEnd =
      (Number(applicationEventSchedule.end.substring(0, 2)) || 24) -
      firstSlotStart;

    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day][h];
      cell.state = applicationEventSchedule.priority;
    }
  });

  return cells;
};

const imagePriority = ["main", "map", "ground_plan", "other"].map((n) =>
  n.toUpperCase()
);

export const getMainImage = (
  ru: ReservationUnit | ReservationUnitType
): Image | ReservationUnitImageType | null => {
  if (!ru.images || ru.images.length === 0) {
    return null;
  }
  const images = [...ru.images].sort((a, b) => {
    return (
      imagePriority.indexOf(a.imageType) - imagePriority.indexOf(b.imageType)
    );
  });

  return images[0];
};

export const orderImages = (
  images: ReservationUnitImageType[]
): ReservationUnitImageType[] => {
  if (!images || images.length === 0) {
    return [];
  }
  const result = [...images].sort((a, b) => {
    return (
      imagePriority.indexOf(a.imageType) - imagePriority.indexOf(b.imageType)
    );
  });

  return result;
};

export const getAddress = (ru: ReservationUnit): string | null => {
  if (!ru.location) {
    return null;
  }

  return trim(
    `${localizedValue(ru.location.addressStreet, i18n.language) || ""}, ${
      localizedValue(ru.location.addressCity, i18n.language) || ""
    }`,
    ", "
  );
};

export const getAddressAlt = (ru: ReservationUnitType): string | null => {
  if (!ru.unit?.location) {
    return null;
  }

  return trim(
    `${getTranslation(ru.unit.location, "addressStreet") || ""}, ${
      getTranslation(ru.unit.location, "addressCity") || ""
    }`,
    ", "
  );
};

export const applicationUrl = (id: number): string => `/application/${id}`;
export const resolutionUrl = (id: number): string => `/applications/${id}`;

export const applicationErrorText = (
  t: TFunction,
  key: string | undefined,
  attrs: { [key: string]: string | number } = {}
): string => (key ? t(`application:error.${key}`, attrs) : "");

export const getReducedApplicationStatus = (
  status: ApplicationStatus
): ReducedApplicationStatus | null => {
  switch (status) {
    case "in_review":
    case "review_done":
    case "allocated":
      return "processing";
    case "draft":
      return "draft";
    case "sent":
      return "sent";
    default:
      return null;
  }
};

export const formatDurationMinutes = (
  duration: number,
  abbreviated = true
): string => {
  if (!duration) {
    return "-";
  }

  const hour = Math.floor(duration / 60);
  const min = Math.floor(duration % 60);

  const hourKey = abbreviated ? "common:abbreviations.hour" : "common:hour";
  const minuteKey = abbreviated
    ? "common:abbreviations.minute"
    : "common:minute";

  const p = [];

  if (hour) {
    p.push(i18n.t(hourKey, { count: hour }).toLocaleLowerCase());
  }
  if (min) {
    p.push(i18n.t(minuteKey, { count: min }).toLocaleLowerCase());
  }

  return p.join(" ");
};

export const getReadableList = (list: string[]): string => {
  if (!list || list.length === 0) return "";

  const andStr = i18n.t("common:and");

  if (list.length < 3) {
    return list.join(` ${andStr} `);
  }

  return `${list.slice(0, -1).join(", ")} ${andStr} ${list[list.length - 1]}`;
};

export const printErrorMessages = (error: ApolloError): string => {
  if (!error.graphQLErrors || error.graphQLErrors.length === 0) {
    return "";
  }

  const { graphQLErrors: errors } = error;

  return errors
    .reduce((acc, cur) => {
      const code = cur?.extensions?.error_code
        ? i18n.t(`errors:${cur?.extensions?.error_code}`)
        : "";
      const message =
        code === cur?.extensions?.error_code || !cur?.extensions?.error_code
          ? i18n.t("errors:general_error")
          : code || "";
      return message ? `${acc}${message}\n` : acc; /// contains non-breaking space
    }, "")
    .trim();
};
