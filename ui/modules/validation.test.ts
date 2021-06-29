import { before, after } from "./validation";

test("test before", () => {
  expect(before("2021-02-02", "2021-02-02")).toBeFalsy();
  expect(before("2021-02-02", "2021-02-01")).toBeTruthy();
  expect(before("2021-02-02", "2021-01-02")).toBeTruthy();
  expect(before("2021-02-02", "2020-02-02")).toBeTruthy();
});

test("test after", () => {
  expect(after("2021-02-02", "2021-02-02")).toBeFalsy();
  expect(after("2021-02-02", "2021-02-03")).toBeTruthy();
  expect(after("2021-02-02", "2021-03-02")).toBeTruthy();
  expect(after("2021-02-02", "2022-02-02")).toBeTruthy();
});
