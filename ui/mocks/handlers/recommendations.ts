import { graphql } from "msw";
import { ReservationUnit } from "../../modules/types";

type ReturnType = {
  recommendations: ReservationUnit[];
};

export const recommendationHandlers = [
  graphql.query<ReturnType>("Recommendations", async (req, res, ctx) => {
    const recommendations: ReservationUnit[] = [
      {
        services: null,
        termsOfUse: null,
        contactInformation: null,
        unitId: null,
        id: 48,
        name: { fi: "Arabian nuorisotalon sali" },
        images: [],
        building: {
          id: 11,
          name: "Arabian nuorisotalo",
        },
        reservationUnitType: {
          id: 3,
          name: "Nuorisopalvelut",
        },
        maxPersons: 100,
        location: {
          id: 34,
          addressStreet: "Arabianpolku 1 A 2",
          addressZip: "00560",
          addressCity: "Helsinki",
        },
        description: "",
        requireIntroduction: false,
        spaces: [
          {
            id: 1,
            name: { fi: "Sali" },
            locationType: null,
            parentId: null,
            surfaceArea: null,
            districtId: null,
          },
        ],
        resources: [],
      },
      {
        services: null,
        termsOfUse: null,
        contactInformation: null,
        unitId: null,
        id: 45,
        name: { fi: "Hertsin nuorisotalon sali" },
        images: [],
        building: {
          id: 13,
          name: "Hertsin nuorisotila",
        },
        reservationUnitType: {
          id: 3,
          name: "Nuorisopalvelut",
        },
        maxPersons: 15,
        location: {
          id: 38,
          addressStreet: "Linnanrakentajantie 2",
          addressZip: "00880",
          addressCity: "Helsinki",
        },
        description: "",
        requireIntroduction: false,
        spaces: [
          {
            id: 1,
            name: { fi: "Sali" },
            locationType: null,
            parentId: null,
            surfaceArea: null,
            districtId: null,
          },
        ],
        resources: [],
      },
      {
        services: null,
        termsOfUse: null,
        contactInformation: null,
        unitId: null,
        id: 40,
        name: { fi: "Jakomäen sydämen liikkumistila" },
        images: [],
        building: {
          id: 14,
          name: "Jakomäen nuorisotalo",
        },
        reservationUnitType: {
          id: 3,
          name: "Nuorisopalvelut",
        },
        maxPersons: 10,
        location: {
          id: 39,
          addressStreet: "Jakomäenpolku 6",
          addressZip: "00770",
          addressCity: "Helsinki",
        },
        description: "",
        requireIntroduction: false,
        spaces: [
          {
            id: 1,
            name: { fi: "Liikkumistila" },
            locationType: null,
            parentId: null,
            surfaceArea: null,
            districtId: null,
          },
        ],
        resources: [],
      },
      {
        services: null,
        termsOfUse: null,
        contactInformation: null,
        unitId: null,
        id: 53,
        name: { fi: "Pasilan nuorisotalon järjestötila" },
        images: [],
        building: {
          id: 9,
          name: "Pasilan nuorisotalo",
        },
        reservationUnitType: {
          id: 3,
          name: "Nuorisopalvelut",
        },
        maxPersons: 15,
        location: {
          id: 28,
          addressStreet: "Pasilanraitio 6",
          addressZip: "00240",
          addressCity: "Helsinki",
        },
        description: "",
        requireIntroduction: false,
        spaces: [
          {
            id: 1,
            name: { fi: "Järjestötila" },
            locationType: null,
            parentId: null,
            surfaceArea: null,
            districtId: null,
          },
        ],
        resources: [],
      },
      {
        services: null,
        termsOfUse: null,
        contactInformation: null,
        unitId: null,
        id: 52,
        name: { fi: "Koskelan nuorisotalon yläkerran ryhmätila 2" },
        images: [],
        building: {
          id: 10,
          name: "Koskelan nuorisotalo",
        },
        reservationUnitType: {
          id: 3,
          name: "Nuorisopalvelut",
        },
        maxPersons: 15,
        location: {
          id: 30,
          addressStreet: "Antti Korpin tie 3 a",
          addressZip: "00600",
          addressCity: "Helsinki",
        },
        description: "",
        requireIntroduction: false,
        spaces: [
          {
            id: 1,
            name: { fi: "Yläkerta/ryhmätila 2" },
            locationType: null,
            parentId: null,
            surfaceArea: null,
            districtId: null,
          },
        ],
        resources: [],
      },
      {
        services: null,
        termsOfUse: null,
        contactInformation: null,
        unitId: null,
        id: 51,
        name: { fi: "Koskelan nuorisotalon yläkerran ryhmätila 1" },
        images: [],
        building: {
          id: 10,
          name: "Koskelan nuorisotalo",
        },
        reservationUnitType: {
          id: 3,
          name: "Nuorisopalvelut",
        },
        maxPersons: 15,
        location: {
          id: 31,
          addressStreet: "Antti Korpin tie 3 a",
          addressZip: "00600",
          addressCity: "Helsinki",
        },
        description: "",
        requireIntroduction: false,
        spaces: [
          {
            id: 1,
            name: { fi: "Yläkerta/ryhmätila 1" },
            locationType: null,
            parentId: null,
            surfaceArea: null,
            districtId: null,
          },
        ],
        resources: [],
      },
      {
        services: null,
        termsOfUse: null,
        contactInformation: null,
        unitId: null,
        id: 36,
        name: { fi: "Pukinmäen nuorisotalon sali" },
        images: [
          {
            imageUrl:
              "http://localhost:8000/media/reservation_unit_images/lavenderhouse_1-x_large.jpg",
            mediumUrl: null,
            smallUrl:
              "http://localhost:8000/media/reservation_unit_images/lavenderhouse_1-x_large.jpg.250x250_q85_crop.jpg",
            imageType: "main",
          },
          {
            imageUrl:
              "http://localhost:8000/media/reservation_unit_images/external-content.duckduckgo.jpg",
            mediumUrl: null,
            smallUrl:
              "http://localhost:8000/media/reservation_unit_images/external-content.duckduckgo.jpg.250x250_q85_crop.jpg",
            imageType: "other",
          },
          {
            imageUrl:
              "http://localhost:8000/media/reservation_unit_images/575479-L.jpg",
            mediumUrl: null,
            smallUrl:
              "http://localhost:8000/media/reservation_unit_images/575479-L.jpg.250x250_q85_crop.jpg",
            imageType: "other",
          },
        ],
        building: {
          id: 7,
          name: "Pukinmäen nuorisotalo",
        },
        reservationUnitType: {
          id: 3,
          name: "Nuorisopalvelut",
        },
        maxPersons: 60,
        location: {
          id: 26,
          addressStreet: "Säterintie 2",
          addressZip: "00720",
          addressCity: "Helsinki",
        },
        description: "",
        requireIntroduction: false,
        spaces: [
          {
            id: 1,
            name: { fi: "Sali" },
            locationType: null,
            parentId: null,
            surfaceArea: null,
            districtId: null,
          },
        ],
        resources: [],
      },
    ];

    return res(ctx.data({ recommendations }));
  }),
];
