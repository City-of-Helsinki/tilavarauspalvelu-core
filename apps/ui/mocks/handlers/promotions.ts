import { graphql } from "msw";
import { Promotion } from "common/types/common";

type ReturnType = {
  promotions: Promotion[];
};

export const promotionHandlers = [
  graphql.query<ReturnType>("Promotions", async (req, res, ctx) => {
    const promotions: Promotion[] = [
      {
        id: 1,
        heading: { fi: "Uimaan stadissa!" },
        body: null,
        image: "main.jpg",
        link: "/",
      },
      {
        id: 2,
        heading: { fi: "Lammitä sauna" },
        body: {
          fi: ';ewf"l w;apfkl;awekfopwekafopwake fopweakf poawekf opawekf opwaekf opwaefk',
        },
        image: "main.jpg",
        link: "/",
      },
      {
        id: 3,
        heading: { fi: "Juokse maraton!" },
        body: null,
        image: "main.jpg",
        link: "/",
      },
      {
        id: 4,
        heading: { fi: "Vuokraa tila!" },
        body: null,
        image: "main.jpg",
        link: "/",
      },
      {
        id: 5,
        heading: { fi: "Tai jotain muuta!" },
        body: null,
        image: "main.jpg",
        link: "/",
      },
    ];

    return res(ctx.data({ promotions }));
  }),
];
