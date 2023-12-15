import { graphql } from "msw";
import {
  ApplicationsApplicationApplicantTypeChoices,
  ApplicationStatusChoice,
  ApplicationNodeEdge,
  Query,
  QueryApplicationsArgs,
} from "common/types/gql-types";

const applicationCommonCancelled = {
  applicationRound: { pk: 2 },
  status: ApplicationStatusChoice.Cancelled,
  applicant: {
    name: "Matti Virtanen",
  },
  applicantType: null,
  contactPerson: null,
  organisation: null,
};

const applications = graphql.query<Query, QueryApplicationsArgs>(
  "Applications",
  (_req, res, ctx) => {
    return res(
      ctx.data({
        applications: {
          edges: [
            {
              node: {
                pk: 6,
                applicationRound: { pk: 1 },
                applicant: {
                  name: null,
                },
                status: ApplicationStatusChoice.Draft,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Company,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo4",
                  firstName: "u89",
                  lastName: "89u",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZTo0",
                  name: "89",
                },
                lastModifiedDate: "2022-02-10T11:11:55.045448+00:00",
              },
            },
            {
              node: {
                pk: 8,
                applicationRound: { pk: 1 },
                applicant: {
                  name: null,
                },
                status: ApplicationStatusChoice.Draft,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Company,
                contactPerson: {
                  id: "UGVyc29uVHlwZToxMA==",
                  firstName: "oij",
                  lastName: "oij",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZTo2",
                  name: "i9",
                },
                lastModifiedDate: "2022-02-10T11:49:46.458411+00:00",
              },
            },
            {
              node: {
                pk: 11,
                ...applicationCommonCancelled,
                applicationRound: { pk: 1 },
                status: ApplicationStatusChoice.InAllocation,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZToxMQ==",
                  firstName: "j",
                  lastName: "i",
                },
                lastModifiedDate: "2022-02-14T09:28:43.358513+00:00",
              },
            },
            {
              node: {
                pk: 2,
                applicationRound: { pk: 1 },
                applicant: {
                  name: null,
                },
                status: ApplicationStatusChoice.Draft,
                applicantType: null,
                contactPerson: {
                  id: "UGVyc29uVHlwZTox",
                  firstName: "123",
                  lastName: "333",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToy",
                  name: "Ninjat",
                },
                lastModifiedDate: "2021-03-11T00:00:00+00:00",
              },
            },
            {
              node: {
                pk: 1,
                applicationRound: { pk: 1 },
                applicant: {
                  naem: null,
                },
                status: ApplicationStatusChoice.Draft,
                applicantType: null,
                contactPerson: {
                  id: "UGVyc29uVHlwZToy",
                  firstName: "123",
                  lastName: "333",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZTox",
                  name: "Kuperkeikkakamut",
                },
                lastModifiedDate: "2021-03-11T00:00:00+00:00",
              },
            },
            {
              node: {
                pk: 3,
                applicationRound: { pk: 1 },
                applicant: {
                  name: null,
                },
                status: ApplicationStatusChoice.Draft,
                applicantType: null,
                contactPerson: {
                  id: "UGVyc29uVHlwZToz",
                  firstName: "123",
                  lastName: "333",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToz",
                  name: "Merihaan shakkikerho",
                },
                lastModifiedDate: "2021-03-11T00:00:00+00:00",
              },
            },
            {
              node: {
                pk: 12,
                ...applicationCommonCancelled,
                status: ApplicationStatusChoice.InAllocation,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZToxMw==",
                  firstName: "11",
                  lastName: "pok",
                },
                lastModifiedDate: "2022-02-28T12:48:45.261852+00:00",
              },
            },
            {
              node: {
                pk: 14,
                ...applicationCommonCancelled,
                status: ApplicationStatusChoice.InAllocation,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZToxOA==",
                  firstName: "1",
                  lastName: "2",
                },
                lastModifiedDate: "2022-03-03T12:52:03.926882+00:00",
              },
            },
            {
              node: {
                pk: 21,
                ...applicationCommonCancelled,
                applicant: {
                  name: null,
                },
                status: ApplicationStatusChoice.Draft,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozMA==",
                  firstName: "123",
                  lastName: "345",
                },
                lastModifiedDate: "2022-03-09T07:14:08.248585+00:00",
              },
            },
            {
              node: {
                pk: 26,
                ...applicationCommonCancelled,
                applicant: {
                  name: null,
                },
                status: ApplicationStatusChoice.InAllocation,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Community,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozMw==",
                  firstName: "423",
                  lastName: "2314",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToxMQ==",
                  name: "123",
                },
                lastModifiedDate: "2022-03-17T07:19:12.463648+00:00",
              },
            },
            {
              node: {
                pk: 32,
                ...applicationCommonCancelled,
                applicant: {
                  name: null,
                },
                status: ApplicationStatusChoice.Draft,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozNQ==",
                  firstName: "123",
                  lastName: "34",
                },
                lastModifiedDate: "2022-03-17T10:58:55.850928+00:00",
              },
            },
            {
              node: {
                pk: 36,
                ...applicationCommonCancelled,
                status: ApplicationStatusChoice.Draft,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0Mg==",
                  firstName: "mn",
                  lastName: "ds",
                },
                lastModifiedDate: "2022-03-22T06:34:09.280903+00:00",
              },
            },
            {
              node: {
                pk: 37,
                ...applicationCommonCancelled,
                status: ApplicationStatusChoice.InAllocation,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0Mw==",
                  firstName: "123",
                  lastName: "oi",
                },
                lastModifiedDate: "2022-03-24T13:12:10.709427+00:00",
              },
            },
            {
              node: {
                pk: 15,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1Mw==",
                  firstName: "1",
                  lastName: "2",
                },
                lastModifiedDate: "2022-05-12T11:13:19.753609+00:00",
              },
            },
            {
              node: {
                pk: 55,
                ...applicationCommonCancelled,
                status: ApplicationStatusChoice.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1NA==",
                  firstName: "123ijj",
                  lastName: "oij",
                },
                lastModifiedDate: "2022-05-12T11:22:22.733064+00:00",
              },
            },
            {
              node: {
                pk: 46,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Company,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0NQ==",
                  firstName: "09j",
                  lastName: "09j",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToxNw==",
                  name: "123",
                },
                lastModifiedDate: "2022-05-12T11:22:43.669908+00:00",
              },
            },
            {
              node: {
                pk: 47,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0Ng==",
                  firstName: "123",
                  lastName: "43",
                },
                lastModifiedDate: "2022-05-12T11:22:52.924506+00:00",
              },
            },
            {
              node: {
                pk: 31,
                ...applicationCommonCancelled,
                status: ApplicationStatusChoice.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozNA==",
                  firstName: "1okp",
                  lastName: "opk",
                },
                lastModifiedDate: "2022-05-12T11:23:18.281573+00:00",
              },
            },
            {
              node: {
                pk: 39,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0NA==",
                  firstName: "mifwae",
                  lastName: "fweio",
                },
                lastModifiedDate: "2022-05-12T11:30:34.868834+00:00",
              },
            },
            {
              node: {
                pk: 48,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0Nw==",
                  firstName: "lkm",
                  lastName: "iom",
                },
                lastModifiedDate: "2022-05-12T11:30:43.521545+00:00",
              },
            },
            {
              node: {
                pk: 34,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Association,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0MQ==",
                  firstName: "opik",
                  lastName: "opk",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToxNg==",
                  name: "123",
                },
                lastModifiedDate: "2022-05-12T11:47:43.590142+00:00",
              },
            },
            {
              node: {
                pk: 49,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Community,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0OA==",
                  firstName: "123",
                  lastName: "43",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToxOA==",
                  name: "123",
                },
                lastModifiedDate: "2022-05-12T11:47:55.997608+00:00",
              },
            },
            {
              node: {
                pk: 50,
                ...applicationCommonCancelled,
                status: ApplicationStatusChoice.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0OQ==",
                  firstName: "123",
                  lastName: "4234",
                },
                lastModifiedDate: "2022-05-12T11:57:09.055512+00:00",
              },
            },
            {
              node: {
                pk: 54,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Community,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1MQ==",
                  firstName: "324",
                  lastName: "4234",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToxOQ==",
                  name: "123",
                },
                lastModifiedDate: "2022-05-12T12:00:10.145472+00:00",
              },
            },
            {
              node: {
                pk: 33,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozNg==",
                  firstName: "1",
                  lastName: "2",
                },
                lastModifiedDate: "2022-05-12T12:00:15.261238+00:00",
              },
            },
            {
              node: {
                pk: 56,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1Nw==",
                  firstName: "213",
                  lastName: "okp",
                },
                lastModifiedDate: "2022-05-12T12:46:58.741394+00:00",
              },
            },
            {
              node: {
                pk: 53,
                ...applicationCommonCancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1MA==",
                  firstName: "123",
                  lastName: "oiji",
                },
                lastModifiedDate: "2022-05-13T06:07:02.861437+00:00",
              },
            },
            {
              node: {
                pk: 30,
                ...applicationCommonCancelled,
                lastModifiedDate: "2022-05-13T06:06:28.805190+00:00",
              },
            },
            {
              node: {
                pk: 44,
                ...applicationCommonCancelled,
                lastModifiedDate: "2022-05-13T06:06:13.774740+00:00",
              },
            },
            {
              node: {
                pk: 27,
                ...applicationCommonCancelled,
                lastModifiedDate: "2022-05-13T05:56:38.738917+00:00",
              },
              cursor: "2093fj",
            },
          ] as ApplicationNodeEdge[],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      })
    );
  }
);

export const applicationHandlers = [applications];
