import { ApplicationEventSchedule, Cell, DAY } from './types';
import {
  cellsToApplicationEventSchedules,
  applicationEventSchedulesToCells,
} from './util';

const cell = (hour: number, state = true): Cell => ({
  label: 'cell',
  key: 'key',
  hour,
  state,
});
test('test that time selector ui model converts to api model', () => {
  const week = [
    [cell(7), cell(8), cell(9), cell(11)],
    [cell(12)],
    [cell(22), cell(23)],
  ];

  const result = cellsToApplicationEventSchedules(week);

  expect(result.length).toBe(4);
  expect(result[0]).toStrictEqual({ begin: '07:00', end: '10:00', day: 0 });
  expect(result[1]).toStrictEqual({ begin: '11:00', end: '12:00', day: 0 });
  expect(result[2]).toStrictEqual({ begin: '12:00', end: '13:00', day: 1 });
  expect(result[3]).toStrictEqual({ begin: '22:00', end: '00:00', day: 2 });

  const noSelections = cellsToApplicationEventSchedules([
    [cell(7, false), cell(8, false), cell(9, false)],
  ]);

  expect(noSelections.length).toBe(0);
});

const appEventSchedule = (
  begin: string,
  end: string,
  day: DAY
): ApplicationEventSchedule => ({ begin, end, day });

const cellWithHour = (cells: Cell[], hour: number) =>
  cells.find((c) => c.hour === hour);

test('test that api model converts to time selector ui model', () => {
  const result = applicationEventSchedulesToCells([
    appEventSchedule('08:00', '11:00', 0),
    appEventSchedule('07:00', '08:00', 1),
  ]);

  expect(result.length).toBe(7);
  expect(cellWithHour(result[0], 7)?.state).toBe(false);
  expect(cellWithHour(result[0], 8)?.state).toBe(true);
  expect(cellWithHour(result[0], 9)?.state).toBe(true);
  expect(cellWithHour(result[0], 10)?.state).toBe(true);
  expect(cellWithHour(result[0], 11)?.state).toBe(false);
  expect(cellWithHour(result[1], 7)?.state).toBe(true);
});
