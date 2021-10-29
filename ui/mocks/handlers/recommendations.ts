import { graphql } from "msw";
import {
  PageInfo,
  Query,
  ReservationUnitImageType,
  ReservationUnitTypeConnection,
} from "../../modules/gql-types";

export const recommendationHandlers = [
  graphql.query<Query>("Recommendations", async (req, res, ctx) => {
    const recommendations: ReservationUnitTypeConnection = {
      edges: [
        {
          node: {
            isDraft: false,
            uuid: "f90wau8943jg894gj",
            id: "UmVzZXJ2YXRpb25Vbml0VHlwZTozNw==",
            pk: 37,
            nameFi: "Pukinmäen nuorisotalon yläkerta",
            nameEn: "Pukinmäen nuorisotalon yläkerta",
            nameSv: "Pukinmäen nuorisotalon yläkerta",
            images: [],
            unit: {
              id: "VW5pdFR5cGU6Nw==",
              pk: 7,
              nameFi: "Pukinmäen nuorisotalo",
              nameEn: "Pukinmäen nuorisotalo",
              nameSv: "Pukinmäen nuorisotalo",
              descriptionFi: "",
              descriptionEn: "",
              descriptionSv: "",
              email: "pukinmaen.nuorisotalo@hel.fi",
              shortDescriptionFi: "",
              shortDescriptionEn: "",
              shortDescriptionSv: "",
              webPage: "http://pukinmaki.munstadi.fi/",
              phone: "",
            },
            reservationUnitType: {
              id: "fwae9fj80a9w3jf",
              pk: 3,
              nameFi: "Nuorisopalvelut",
              nameEn: "Nuorisopalvelut",
              nameSv: "Nuorisopalvelut",
            },
            maxPersons: 45,
            location: {
              id: "fjwaoifnsorng",
              pk: 25,
              addressStreetFi: "Säterintie 2",
              addressStreetEn: "Säterintie 2",
              addressStreetSv: "Säterintie 2",
              addressZip: "00720",
              addressCityFi: "Helsinki",
              addressCityEn: "Helsinki",
              addressCitySv: "Helsinki",
            },
            descriptionFi: "",
            descriptionEn: "",
            descriptionSv: "",
            requireIntroduction: false,
            spaces: [
              {
                id: "fkawieofjaosnv",
                code: "",
                nameFi: "Yläkerta",
                nameEn: "Yläkerta",
                nameSv: "Yläkerta",
              },
            ],
            resources: [],
            contactInformationFi: "",
            contactInformationEn: "",
            contactInformationSv: "",
          },
          cursor: "YXJyYXljb25uZWN0aW9uOjA=",
        },
        {
          node: {
            isDraft: false,
            uuid: "f90wau8943jg894gj",
            id: "UmVzZXJ2YXRpb25Vbml0VHlwZTozNg==",
            pk: 36,
            nameFi: "Pukinmäen nuorisotalon sali",
            nameEn: "Pukinmäen nuorisotalon sali",
            nameSv: "Pukinmäen nuorisotalon sali",
            images: [
              {
                imageUrl:
                  "http://localhost:8000/media/reservation_unit_images/lavenderhouse_1-x_large.jpg",
                smallUrl:
                  "http://localhost:8000/media/reservation_unit_images/lavenderhouse_1-x_large.jpg.250x250_q85_crop.jpg",
                imageType: "MAIN",
              },
              {
                imageUrl:
                  "http://localhost:8000/media/reservation_unit_images/external-content.duckduckgo.jpg",
                smallUrl:
                  "http://localhost:8000/media/reservation_unit_images/external-content.duckduckgo.jpg.250x250_q85_crop.jpg",
                imageType: "OTHER",
              },
              {
                imageUrl:
                  "http://localhost:8000/media/reservation_unit_images/575479-L.jpg",
                smallUrl:
                  "http://localhost:8000/media/reservation_unit_images/575479-L.jpg.250x250_q85_crop.jpg",
                imageType: "OTHER",
              },
            ] as ReservationUnitImageType[],
            unit: {
              id: "VW5pdFR5cGU6Nw==",
              pk: 7,
              nameFi: "Pukinmäen nuorisotalo",
              nameEn: "Pukinmäen nuorisotalo",
              nameSv: "Pukinmäen nuorisotalo",
              descriptionFi: "",
              descriptionEn: "",
              descriptionSv: "",
              email: "pukinmaen.nuorisotalo@hel.fi",
              shortDescriptionFi: "",
              shortDescriptionEn: "",
              shortDescriptionSv: "",
              webPage: "http://pukinmaki.munstadi.fi/",
              phone: "",
            },
            reservationUnitType: {
              id: "fwae9fje80a9w3jf",
              pk: 3,
              nameFi: "Nuorisopalvelut",
              nameEn: "Nuorisopalvelut",
              nameSv: "Nuorisopalvelut",
            },
            maxPersons: 60,
            location: {
              id: "fjwfaoifnsorng",
              pk: 26,
              addressStreetFi: "Säterintie 2",
              addressStreetEn: "Säterintie 2",
              addressStreetSv: "Säterintie 2",
              addressZip: "00720",
              addressCityFi: "Helsinki",
              addressCityEn: "Helsinki",
              addressCitySv: "Helsinki",
            },
            descriptionFi: "",
            descriptionEn: "",
            descriptionSv: "",
            requireIntroduction: false,
            spaces: [
              {
                id: "fkawieofjadosnv",
                code: "",
                nameFi: "Sali",
                nameEn: "Sali",
                nameSv: "Sali",
              },
            ],
            resources: [],
            contactInformationFi: "",
            contactInformationEn: "",
            contactInformationSv: "",
          },
          cursor: "YXJyYXljb25uZWN0aW9uOjE=",
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      } as PageInfo,
    };

    return res(ctx.data({ reservationUnits: recommendations }));
  }),
];
