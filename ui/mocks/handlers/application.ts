import { graphql } from "msw";
import {
  ApplicationsApplicationApplicantTypeChoices,
  ApplicationStatus,
  ApplicationTypeEdge,
  OrganisationType,
  Query,
  QueryApplicationsArgs,
} from "../../modules/gql-types";

const applications = graphql.query<Query, QueryApplicationsArgs>(
  "Applications",
  (req, res, ctx) => {
    return res(
      ctx.data({
        applications: {
          edges: [
            {
              node: {
                pk: 6,
                applicationRoundId: 1,
                applicantName: null,
                status: ApplicationStatus.Draft,
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
                } as OrganisationType,
                lastModifiedDate: "2022-02-10T11:11:55.045448+00:00",
              },
            },
            {
              node: {
                pk: 8,
                applicationRoundId: 1,
                applicantName: null,
                status: ApplicationStatus.Draft,
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
                } as OrganisationType,
                lastModifiedDate: "2022-02-10T11:49:46.458411+00:00",
              },
            },
            {
              node: {
                pk: 11,
                applicationRoundId: 1,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.InReview,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZToxMQ==",
                  firstName: "j",
                  lastName: "i",
                },
                organisation: null,
                lastModifiedDate: "2022-02-14T09:28:43.358513+00:00",
              },
            },
            {
              node: {
                pk: 2,
                applicationRoundId: 1,
                applicantName: null,
                status: ApplicationStatus.Draft,
                applicantType: null,
                contactPerson: {
                  id: "UGVyc29uVHlwZTox",
                  firstName: "123",
                  lastName: "333",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToy",
                  name: "Ninjat",
                } as OrganisationType,
                lastModifiedDate: "2021-03-11T00:00:00+00:00",
              },
            },
            {
              node: {
                pk: 1,
                applicationRoundId: 1,
                applicantName: null,
                status: ApplicationStatus.Draft,
                applicantType: null,
                contactPerson: {
                  id: "UGVyc29uVHlwZToy",
                  firstName: "123",
                  lastName: "333",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZTox",
                  name: "Kuperkeikkakamut",
                } as OrganisationType,
                lastModifiedDate: "2021-03-11T00:00:00+00:00",
              },
            },
            {
              node: {
                pk: 3,
                applicationRoundId: 1,
                applicantName: null,
                status: ApplicationStatus.Draft,
                applicantType: null,
                contactPerson: {
                  id: "UGVyc29uVHlwZToz",
                  firstName: "123",
                  lastName: "333",
                },
                organisation: {
                  id: "T3JnYW5pc2F0aW9uVHlwZToz",
                  name: "Merihaan shakkikerho",
                } as OrganisationType,
                lastModifiedDate: "2021-03-11T00:00:00+00:00",
              },
            },
            {
              node: {
                pk: 12,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.InReview,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZToxMw==",
                  firstName: "11",
                  lastName: "pok",
                },
                organisation: null,
                lastModifiedDate: "2022-02-28T12:48:45.261852+00:00",
              },
            },
            {
              node: {
                pk: 14,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.InReview,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZToxOA==",
                  firstName: "1",
                  lastName: "2",
                },
                organisation: null,
                lastModifiedDate: "2022-03-03T12:52:03.926882+00:00",
              },
            },
            {
              node: {
                pk: 21,
                applicationRoundId: 2,
                applicantName: null,
                status: ApplicationStatus.Draft,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozMA==",
                  firstName: "123",
                  lastName: "345",
                },
                organisation: null,
                lastModifiedDate: "2022-03-09T07:14:08.248585+00:00",
              },
            },
            {
              node: {
                pk: 26,
                applicationRoundId: 2,
                applicantName: null,
                status: ApplicationStatus.InReview,
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
                } as OrganisationType,
                lastModifiedDate: "2022-03-17T07:19:12.463648+00:00",
              },
            },
            {
              node: {
                pk: 32,
                applicationRoundId: 2,
                applicantName: null,
                status: ApplicationStatus.Draft,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozNQ==",
                  firstName: "123",
                  lastName: "34",
                },
                organisation: null,
                lastModifiedDate: "2022-03-17T10:58:55.850928+00:00",
              },
            },
            {
              node: {
                pk: 36,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Draft,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0Mg==",
                  firstName: "mn",
                  lastName: "ds",
                },
                organisation: null,
                lastModifiedDate: "2022-03-22T06:34:09.280903+00:00",
              },
            },
            {
              node: {
                pk: 37,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.InReview,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0Mw==",
                  firstName: "123",
                  lastName: "oi",
                },
                organisation: null,
                lastModifiedDate: "2022-03-24T13:12:10.709427+00:00",
              },
            },
            {
              node: {
                pk: 15,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1Mw==",
                  firstName: "1",
                  lastName: "2",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T11:13:19.753609+00:00",
              },
            },
            {
              node: {
                pk: 55,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1NA==",
                  firstName: "123ijj",
                  lastName: "oij",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T11:22:22.733064+00:00",
              },
            },
            {
              node: {
                pk: 46,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
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
                } as OrganisationType,
                lastModifiedDate: "2022-05-12T11:22:43.669908+00:00",
              },
            },
            {
              node: {
                pk: 47,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0Ng==",
                  firstName: "123",
                  lastName: "43",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T11:22:52.924506+00:00",
              },
            },
            {
              node: {
                pk: 31,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozNA==",
                  firstName: "1okp",
                  lastName: "opk",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T11:23:18.281573+00:00",
              },
            },
            {
              node: {
                pk: 39,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0NA==",
                  firstName: "mifwae",
                  lastName: "fweio",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T11:30:34.868834+00:00",
              },
            },
            {
              node: {
                pk: 48,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0Nw==",
                  firstName: "lkm",
                  lastName: "iom",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T11:30:43.521545+00:00",
              },
            },
            {
              node: {
                pk: 34,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
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
                } as OrganisationType,
                lastModifiedDate: "2022-05-12T11:47:43.590142+00:00",
              },
            },
            {
              node: {
                pk: 49,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
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
                } as OrganisationType,
                lastModifiedDate: "2022-05-12T11:47:55.997608+00:00",
              },
            },
            {
              node: {
                pk: 50,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo0OQ==",
                  firstName: "123",
                  lastName: "4234",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T11:57:09.055512+00:00",
              },
            },
            {
              node: {
                pk: 54,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
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
                } as OrganisationType,
                lastModifiedDate: "2022-05-12T12:00:10.145472+00:00",
              },
            },
            {
              node: {
                pk: 33,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTozNg==",
                  firstName: "1",
                  lastName: "2",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T12:00:15.261238+00:00",
              },
            },
            {
              node: {
                pk: 56,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1Nw==",
                  firstName: "213",
                  lastName: "okp",
                },
                organisation: null,
                lastModifiedDate: "2022-05-12T12:46:58.741394+00:00",
              },
            },
            {
              node: {
                pk: 53,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType:
                  ApplicationsApplicationApplicantTypeChoices.Individual,
                contactPerson: {
                  id: "UGVyc29uVHlwZTo1MA==",
                  firstName: "123",
                  lastName: "oiji",
                },
                organisation: null,
                lastModifiedDate: "2022-05-13T06:07:02.861437+00:00",
              },
            },
            {
              node: {
                pk: 30,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType: null,
                contactPerson: null,
                organisation: null,
                lastModifiedDate: "2022-05-13T06:06:28.805190+00:00",
              },
            },
            {
              node: {
                pk: 44,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType: null,
                contactPerson: null,
                organisation: null,
                lastModifiedDate: "2022-05-13T06:06:13.774740+00:00",
              },
            },
            {
              node: {
                pk: 27,
                applicationRoundId: 2,
                applicantName: "Matti Virtanen",
                status: ApplicationStatus.Cancelled,
                applicantType: null,
                contactPerson: null,
                organisation: null,
                lastModifiedDate: "2022-05-13T05:56:38.738917+00:00",
              },
            },
          ] as ApplicationTypeEdge[],
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
