import { isAfter, parseISO, isBefore, format } from 'date-fns';
import i18next, { TFunction } from 'i18next';
import { stringify } from 'query-string';
import { ReservationUnitsParameters } from './api';
import { searchPrefix, emptyOption, applicationsPrefix } from './const';
import {
  ApplicationEventSchedule,
  Cell,
  LocalizationLanguages,
  OptionType,
  Parameter,
  TranslationObject,
  ReservationUnit,
  Image,
} from './types';

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
): 'pending' | 'active' | 'past' => {
  if (isPast(endDate)) {
    return 'past';
  }
  if (isActive(startDate, endDate)) {
    return 'active';
  }

  return 'pending';
};

export const parseDate = (date: string): Date => parseISO(date);

export const formatDate = (date: string): string => {
  if (!date) {
    return '-';
  }
  return format(parseISO(date), 'd.M.yyyy');
};

export const formatDuration = (duration: string): string => {
  if (!duration) {
    return '-';
  }
  const time = duration.split(':');
  if (time.length < 3) {
    return '-';
  }
  return `${
    Number(time[0])
      ? `${`${Number(time[0])} ${i18next
          .t('common.hour')
          .toLocaleLowerCase()}`} `
      : ''
  }${
    Number(time[1]) ? time[1] + i18next.t('common.abbreviations.minute') : ''
  }`;
};

export const formatApiDate = (date: string): string => {
  if (!date) {
    return 'no date';
  }
  return format(parseISO(date), 'yyyy-MM-dd');
};

export const localizedValue = (
  name: string | TranslationObject | undefined,
  lang: string
): string => {
  if (!name) {
    return '???';
  }
  // needed until api stabilizes
  if (typeof name === 'string') {
    return name;
  }
  return (
    name[lang as LocalizationLanguages] ||
    name.fi ||
    name.en ||
    name.sv ||
    '???'
  );
};

const getLabel = (
  parameter: Parameter,
  lang: LocalizationLanguages = 'fi'
): string => {
  if (parameter.name) {
    return localizedValue(parameter.name, lang);
  }
  if (parameter.minimum || parameter.maximum) {
    return `${parameter.minimum || ''} - ${parameter.maximum || ''}`;
  }
  return 'no label';
};

export const mapOptions = (
  src: Parameter[],
  emptyOptionLabel?: string,
  lang = 'fi'
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

export const searchUrl = (params: ReservationUnitsParameters): string =>
  `${searchPrefix}/?${stringify(params)}`;

export const applicationsUrl = `${applicationsPrefix}/`;

export function deepCopy<T>(src: T): T {
  return JSON.parse(JSON.stringify(src));
}

export const apiDurationToMinutes = (duration: string): number => {
  if (!duration) {
    return 0;
  }
  const parts = duration.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
};

const formatNumber = (n: number): string => `0${n > 23 ? 0 : n}`.slice(-2);

type Timespan = { begin: number; end: number };

export const cellsToApplicationEventSchedules = (
  cells: Cell[][]
): ApplicationEventSchedule[] => {
  const daySchedules = [] as ApplicationEventSchedule[];
  for (let day = 0; day < cells.length; day += 1) {
    const dayCells = cells[day];
    dayCells
      .filter((cell) => cell.state)
      .map((cell) => ({ begin: cell.hour, end: cell.hour + 1 } as Timespan))
      .reduce((prev, current) => {
        if (!prev.length) {
          return [current];
        }
        if (prev[prev.length - 1].end === current.begin) {
          return [
            ...prev.slice(0, prev.length - 1),
            {
              begin: prev[prev.length - 1].begin,
              end: prev[prev.length - 1].end + 1,
            },
          ];
        }
        return prev.concat([current]);
      }, [] as Timespan[])
      .map(
        (cell) =>
          ({
            day,
            begin: `${formatNumber(cell.begin)}:00`,
            end: `${formatNumber(cell.end)}:00`,
          } as ApplicationEventSchedule)
      )
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
      cell.state = true;
    }
  });

  return cells;
};

const imagePriority = ['main', 'map', 'ground_plan', 'other'];

export const getMainImage = (ru: ReservationUnit): Image | null => {
  if (!ru.images || ru.images.length === 0) {
    return null;
  }
  ru.images.sort((a, b) => {
    return (
      imagePriority.indexOf(a.imageType) - imagePriority.indexOf(b.imageType)
    );
  });

  return ru.images[0];
};

export const getAddress = (ru: ReservationUnit): string | null => {
  if (!ru.location) {
    return null;
  }

  return `${ru.location.addressStreet}, ${ru.location.addressCity}`;
};

export const applicationUrl = (id: number): string => `/application/${id}`;

export const errorText = (t: TFunction, key: string | undefined): string =>
  key ? t(`Application.error.${key}`) : '';
