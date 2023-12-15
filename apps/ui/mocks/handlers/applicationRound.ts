import { addDays, addMonths } from "date-fns";
import { graphql } from "msw";
import { toApiDate } from "common/src/common/util";
import {
  type Query,
  type ApplicationRoundNodeConnection,
  type QueryApplicationRoundsArgs,
  type ReservationUnitType,
  ApplicationsApplicationRoundTargetGroupChoices,
  ApplicationRoundStatusChoice,
  ApplicationRoundNode,
} from "common/types/gql-types";

const appRoundNodes: ApplicationRoundNode[] = [
  {
    id: "fq02394feaw",
    pk: 2,
    targetGroup: ApplicationsApplicationRoundTargetGroupChoices.Public,
    name: "Ruoholahden nuorisotalon vakiovuorot syksy 2021 - kevät 2022 FI",
    nameFi: "Ruoholahden nuorisotalon vakiovuorot syksy 2021 - kevät 2022 FI",
    nameEn: "Ruoholahden nuorisotalon vakiovuorot syksy 2021 - kevät 2022 EN",
    nameSv: "Ruoholahden nuorisotalon vakiovuorot syksy 2021 - kevät 2022 SV",
    criteria: "",
    applicationPeriodBegin: "2021-04-19T06:00:00+00:00",
    applicationPeriodEnd: addDays(new Date(), 7).toISOString(),
    reservationPeriodBegin: "2021-08-16",
    reservationPeriodEnd: toApiDate(addMonths(new Date(), 1)) ?? "",
    publicDisplayBegin: "2021-04-16T06:00:00+00:00",
    publicDisplayEnd: addDays(new Date(), 7).toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    reservationUnits: [
      {
        pk: 2,
        unit: {
          pk: 3,
        },
      } as ReservationUnitType,
      {
        pk: 6,
        unit: {
          pk: 2,
        },
      } as ReservationUnitType,
    ],
    criteriaFi: "Criteria FI",
    criteriaEn: "Criteria EN",
    criteriaSv: "Criteria SV",
  },
  {
    id: "fm8q904wfj",
    pk: 3,
    targetGroup: ApplicationsApplicationRoundTargetGroupChoices.Public,
    name: "Jakomäen nuorisotalon vakiovuorot syksy 2021 - kevät 2022 FI",
    nameFi: "Jakomäen nuorisotalon vakiovuorot syksy 2021 - kevät 2022 FI",
    nameEn: "Jakomäen nuorisotalon vakiovuorot syksy 2021 - kevät 2022 EN",
    nameSv: "Jakomäen nuorisotalon vakiovuorot syksy 2021 - kevät 2022 SV",
    applicationPeriodBegin: "2021-04-19T06:00:00+00:00",
    applicationPeriodEnd: "2021-04-30T13:00:00+00:00",
    reservationPeriodBegin: "2021-08-16",
    reservationPeriodEnd: toApiDate(addMonths(new Date(), 1)) ?? "",
    publicDisplayBegin: "2021-04-16T06:00:00+00:00",
    publicDisplayEnd: addDays(new Date(), 7).toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    reservationUnits: [
      {
        pk: 7,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 1,
        unit: {
          pk: 3,
        },
      } as ReservationUnitType,
    ],
    criteria: "Criteria FI",
    criteriaFi: "Criteria FI",
    criteriaEn: "Criteria EN",
    criteriaSv: "Criteria SV",
  },
  {
    id: "fgnq8793e4airug",
    pk: 8,
    targetGroup: ApplicationsApplicationRoundTargetGroupChoices.Public,
    name: "Fallkullan, Malmin ja Pukinmäen nuorisotalojen vakiovuorot syksy 2021 - kevät 2022 FI",
    nameFi:
      "Fallkullan, Malmin ja Pukinmäen nuorisotalojen vakiovuorot syksy 2021 - kevät 2022 FI",
    nameEn:
      "Fallkullan, Malmin ja Pukinmäen nuorisotalojen vakiovuorot syksy 2021 - kevät 2022 EN",
    nameSv:
      "Fallkullan, Malmin ja Pukinmäen nuorisotalojen vakiovuorot syksy 2021 - kevät 2022 SV",
    applicationPeriodBegin: "2021-04-19T06:00:00Z",
    applicationPeriodEnd: "2021-04-30T13:00:00Z",
    reservationPeriodBegin: "2021-08-16",
    reservationPeriodEnd: toApiDate(addMonths(new Date(), 1)) ?? "",
    publicDisplayBegin: "2021-04-16T06:00:00Z",
    publicDisplayEnd: addDays(new Date(), 7).toISOString(),
    status: ApplicationRoundStatusChoice.InAllocation,
    reservationUnits: [
      {
        pk: 7,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
    ],
    criteria: "Criteria FI",
    criteriaFi: "Criteria FI",
    criteriaEn: "Criteria EN",
    criteriaSv: "Criteria SV",
  },
  {
    id: "fnvq9384ahwefjcd",
    pk: 9,
    targetGroup: ApplicationsApplicationRoundTargetGroupChoices.Public,
    name: "Nuorten ympäristötilan (Laajasalo) vakiovuorot syksy 2021 - kevät 2022 FI",
    nameFi:
      "Nuorten ympäristötilan (Laajasalo) vakiovuorot syksy 2021 - kevät 2022 FI",
    nameEn:
      "Nuorten ympäristötilan (Laajasalo) vakiovuorot syksy 2021 - kevät 2022 EN",
    nameSv:
      "Nuorten ympäristötilan (Laajasalo) vakiovuorot syksy 2021 - kevät 2022 SV",
    applicationPeriodBegin: addDays(new Date(), 7).toISOString(),
    applicationPeriodEnd: addDays(new Date(), 17).toISOString(),
    reservationPeriodBegin: "2021-08-16",
    reservationPeriodEnd: toApiDate(addMonths(new Date(), 1)) ?? "",
    publicDisplayBegin: "2021-04-16T06:00:00Z",
    publicDisplayEnd: addDays(new Date(), 7).toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    reservationUnits: [
      {
        pk: 9,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 6,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 7,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
    ],
    criteria: "Criteria FI",
    criteriaFi: "Criteria FI",
    criteriaEn: "Criteria EN",
    criteriaSv: "Criteria SV",
  },
  {
    id: "g9834jg8934gjh",
    pk: 7,
    targetGroup: ApplicationsApplicationRoundTargetGroupChoices.Public,
    name: "Hertsin nuorisotalon vakiovuorot syksy 2021 - kevät 2022 FI",
    nameFi: "Hertsin nuorisotalon vakiovuorot syksy 2021 - kevät 2022 FI",
    nameEn: "Hertsin nuorisotalon vakiovuorot syksy 2021 - kevät 2022 EN",
    nameSv: "Hertsin nuorisotalon vakiovuorot syksy 2021 - kevät 2022 SV",
    applicationPeriodBegin: "2021-04-19T06:00:00Z",
    applicationPeriodEnd: "2021-04-30T13:00:00Z",
    reservationPeriodBegin: "2021-09-01",
    reservationPeriodEnd: toApiDate(addMonths(new Date(), 1)) ?? "",
    publicDisplayBegin: "2021-04-16T06:00:00Z",
    publicDisplayEnd: addDays(new Date(), 7).toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    reservationUnits: [
      {
        pk: 9,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 6,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 7,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
    ],
    criteria: "Criteria FI",
    criteriaFi: "Criteria FI",
    criteriaEn: "Criteria EN",
    criteriaSv: "Criteria SV",
  },
  {
    id: "woeis4gjmfiogmiero",
    pk: 1,
    targetGroup: ApplicationsApplicationRoundTargetGroupChoices.Public,
    name: "Nuorten liikuntavuorot kevät 2021 FI",
    nameFi: "Nuorten liikuntavuorot kevät 2021 FI",
    nameEn: "Nuorten liikuntavuorot kevät 2021 EN",
    nameSv: "Nuorten liikuntavuorot kevät 2021 SV",
    applicationPeriodBegin: "2021-01-01T00:00:00Z",
    applicationPeriodEnd: addDays(new Date(), 7).toISOString(),
    reservationPeriodBegin: "2021-01-01",
    reservationPeriodEnd: "2021-06-01",
    publicDisplayBegin: "2021-01-01T00:00:00Z",
    publicDisplayEnd: addDays(new Date(), 7).toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    reservationUnits: [
      {
        pk: 2,
        unit: {
          pk: 1,
        },
      } as ReservationUnitType,
      {
        pk: 6,
        unit: {
          pk: 2,
        },
      } as ReservationUnitType,
      {
        pk: 7,
        unit: {
          pk: 3,
        },
      } as ReservationUnitType,
    ],
    criteria: "Criteria FI",
    criteriaFi: "Criteria FI",
    criteriaEn: "Criteria EN",
    criteriaSv: "Criteria SV",
  },
  {
    id: "v3j45098t",
    pk: 2,
    targetGroup: ApplicationsApplicationRoundTargetGroupChoices.Public,
    name: "Toimistotilojen haku kevät 2021 FI",
    nameFi: "Toimistotilojen haku kevät 2021 FI",
    nameEn: "Toimistotilojen haku kevät 2021 EN",
    nameSv: "Toimistotilojen haku kevät 2021 SV",
    applicationPeriodBegin: "2020-12-18T08:01:01Z",
    applicationPeriodEnd: "2020-12-31T22:01:06Z",
    reservationPeriodBegin: "2021-01-01",
    reservationPeriodEnd: "2021-06-01",
    publicDisplayBegin: "2020-12-18T00:00:00Z",
    publicDisplayEnd: addDays(new Date(), 7).toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    reservationUnits: [
      {
        pk: 9,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 6,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 7,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
    ],
    criteria: "Criteria FI",
    criteriaFi: "Criteria FI",
    criteriaEn: "Criteria EN",
    criteriaSv: "Criteria SV",
  },
  {
    id: "g083rejioadmv",
    pk: 5,
    targetGroup: ApplicationsApplicationRoundTargetGroupChoices.Public,
    name: "Arabian, Koskelan ja Pasilan nuorisotalojen vakiovuorot syksy 2021 - kevät 2022 FI",
    nameFi:
      "Arabian, Koskelan ja Pasilan nuorisotalojen vakiovuorot syksy 2021 - kevät 2022 FI",
    nameEn:
      "Arabian, Koskelan ja Pasilan nuorisotalojen vakiovuorot syksy 2021 - kevät 2022 EN",
    nameSv:
      "Arabian, Koskelan ja Pasilan nuorisotalojen vakiovuorot syksy 2021 - kevät 2022 SV",
    applicationPeriodBegin: "2021-04-19T06:00:00Z",
    applicationPeriodEnd: "2021-12-30T13:00:00Z",
    reservationPeriodBegin: toApiDate(addMonths(new Date(), 1)) ?? "",
    reservationPeriodEnd: toApiDate(addMonths(new Date(), 5)) ?? "",
    publicDisplayBegin: "2021-04-16T06:00:00Z",
    publicDisplayEnd: addDays(new Date(), 7).toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    reservationUnits: [
      {
        pk: 9,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 6,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
      {
        pk: 7,
        unit: {
          pk: 5,
        },
      } as ReservationUnitType,
    ],
    criteria: "Criteria FI",
    criteriaFi: "Criteria FI",
    criteriaEn: "Criteria EN",
    criteriaSv: "Criteria SV",
  },
];

const applicationRoundsGQL = graphql.query<Query, QueryApplicationRoundsArgs>(
  "ApplicationRounds",
  async (_req, res, ctx) => {
    const result: ApplicationRoundNodeConnection = {
      edges: appRoundNodes.map((node) => ({
        node,
        cursor: "",
      })),
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    return res(ctx.data({ applicationRounds: result }));
  }
);

export const applicationRoundHandlers = [applicationRoundsGQL];
