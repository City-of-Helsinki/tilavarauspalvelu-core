import { rest } from "msw";

const getAbilityGroupJSONResponse = [{ id: 1, name: "Keskitaso" }];

const getAgeGroupJSONResponse = [
  { id: 1, minimum: 5, maximum: 8 },
  { id: 2, minimum: 9, maximum: 12 },
  { id: 3, minimum: 12, maximum: 16 },
  { id: 4, minimum: 17, maximum: 20 },
];

const getCityJSONResponse = [{ id: 1, name: "Helsinki" }];

const getTypeJSONResponse = [
  { id: 1, name: "Äänitysstudio" },
  { id: 2, name: "Kokoustila" },
];

const parametersREST = [
  rest.get(`*/v1/parameters/ability_group/*`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(getAbilityGroupJSONResponse));
  }),

  rest.get(`*/v1/parameters/age_group/*`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(getAgeGroupJSONResponse));
  }),

  rest.get(`*/v1/parameters/city/*`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(getCityJSONResponse));
  }),

  rest.get(`*/v1/parameters/reservation_unit_type/*`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(getTypeJSONResponse));
  }),
];

export const parameterHandlers = [...parametersREST];
