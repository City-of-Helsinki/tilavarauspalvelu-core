import {
  isAfter,
  parseISO,
  isBefore,
  format,
  startOfWeek as dateFnsStartOfWeek,
  endOfWeek as dateFnsEndOfWeek,
  parse,
  isValid,
} from "date-fns";
import { i18n, TFunction } from "next-i18next";
import { stringify } from "query-string";
import { isNumber, trim } from "lodash";
import {
  searchPrefix,
  emptyOption,
  applicationsPrefix,
  singleSearchPrefix,
  reservationsPrefix,
} from "./const";
import {
  ApplicationEventSchedule,
  Cell,
  LocalizationLanguages,
  OptionType,
  Parameter,
  TranslationObject,
  ReservationUnit,
  Image,
  ApplicationStatus,
  ReducedApplicationStatus,
  StringParameter,
  ApplicationEventSchedulePriority,
} from "./types";
import { ReservationUnitImageType, ReservationUnitType } from "./gql-types";

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

const isValidDate = (date: Date): boolean =>
  isValid(date) && isAfter(date, new Date("1000-01-01"));

export const toUIDate = (date: Date, formatStr = "d.M.yyyy"): string => {
  if (!date || !isValidDate(date)) {
    return "";
  }
  return format(date, formatStr);
};

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

export const toApiDate = (date: Date, formatStr = "yyyy-MM-dd"): string => {
  return format(date, formatStr);
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

export const formatDuration = (
  duration: string,
  abbreviated = true
): string => {
  if (!duration || isNumber(duration) || !duration?.includes(":")) {
    return "-";
  }

  const hourKey = abbreviated ? "common:abbreviations.hour" : "common:hour";
  const minuteKey = abbreviated
    ? "common:abbreviations.minute"
    : "common:minute";

  const time = duration.split(":");
  if (time.length < 3) {
    return "-";
  }

  const hours = Number(time[0]);
  const minutes = Number(time[1]);

  return `${
    hours
      ? `${`${i18n.t(hourKey, { count: hours }) || "".toLocaleLowerCase()}`} `
      : ""
  }${minutes ? i18n.t(minuteKey, { count: minutes }) : ""}`.trim();
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

const imagePriority = ["main", "map", "ground_plan", "other"];

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
  key: string | undefined
): string => (key ? t(`application:error.${key}`) : "");

export const getReducedApplicationStatus = (
  status: ApplicationStatus
): ReducedApplicationStatus => {
  switch (status) {
    case "in_review":
    case "review_done":
    case "allocating":
    case "allocated":
    case "validated":
      return "processing";
    default:
      return status;
  }
};

export const startOfWeek = (d: Date): Date =>
  dateFnsStartOfWeek(d, { weekStartsOn: 1 });

export const endOfWeek = (d: Date): Date =>
  dateFnsEndOfWeek(d, { weekStartsOn: 1 });

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

interface HMS {
  h?: number;
  m?: number;
  s?: number;
}

export const secondsToHms = (duration?: number | null): HMS => {
  if (!duration || duration < 0) return {};
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = Math.floor((duration % 3600) % 60);

  return { h, m, s };
};

export const convertHMSToSeconds = (input: string): number | null => {
  const result = Number(new Date(`1970-01-01T${input}Z`).getTime() / 1000);
  return Number.isNaN(result) ? null : result;
};

export const getFormatters = (): {
  [key: string]: Intl.NumberFormat;
} => {
  return {
    default: new Intl.NumberFormat(),
    currency: new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    currencyWithDecimals: new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    whole: new Intl.NumberFormat(i18n.language, {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    oneDecimal: new Intl.NumberFormat(i18n.language, {
      style: "decimal",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    twoDecimal: new Intl.NumberFormat(i18n.language, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    strippedDecimal: new Intl.NumberFormat(i18n.language, {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
  };
};

export const formatSecondDuration = (
  duration: number,
  abbreviated = true
): string => {
  if (!duration || !isNumber(duration)) {
    return "-";
  }

  const hms = secondsToHms(duration);
  return formatDuration(`${hms.h}:${hms.m}:${hms.s}`, abbreviated);
};
