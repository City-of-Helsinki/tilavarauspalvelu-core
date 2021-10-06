export default {};
// Linkbox component not available in HDS until 1.4.0
// import React from "react";
// import styled from "styled-components";
// import { Linkbox } from "hds-react";
// import { useTranslation } from "react-i18next";
// import Container from "../common/Container";
// import { breakpoint } from "../../modules/style";
// import { Promotion } from "../../modules/types";
// import { localizedValue } from "../../modules/util";

// type Props = {
//   items: Promotion[];
// };

// const Wrapper = styled.div`
//   background-color: var(--color-white);
//   padding-top: var(--spacing-xl);
//   padding-bottom: var(--spacing-xl);
// `;

// const BoxWrapper = styled.div<{
//   $largeItems: number;
// }>`
//   & > div > img + div {
//     background-color: var(--color-coat-of-arms);
//     padding-bottom: var(--spacing-s);

//     & > div {
//       font-family: var(--font-bold);
//       font-size: var(--fontsize-heading-m);
//       color: var(--color-white);
//     }

//     & > p {
//       font-family: var(--font-medium);
//       color: var(--color-white);
//       margin-bottom: 0;
//     }

//     @media (min-width: ${breakpoint.m}) {
//       position: relative;
//       top: calc(var(--spacing-m) * -1);
//       left: 4%;
//       width: 92%;
//     }
//   }

//   & > div > a {
//     display: none;
//   }

//   display: grid;
//   grid-template-columns: 1fr;
//   gap: var(--spacing-m);

//   @media (min-width: ${breakpoint.m}) {
//     grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;

//     & > div {
//       grid-column: span 2;
//     }

//     ${({ $largeItems }) =>
//       $largeItems &&
//       `
//     & > div:nth-child(-n+${$largeItems}) {
//       grid-column: span 3;
//     }
//   `}
//   }
// `;

// const Promotions = ({ items }: Props): JSX.Element => {
//   const { i18n } = useTranslation();

//   let largeItems = 0;
//   switch (items.length) {
//     case 2:
//     case 5:
//       largeItems = 2;
//       break;
//     case 4:
//       largeItems = 4;
//       break;
//     case 3:
//     case 6:
//     default:
//       largeItems = 0;
//   }

//   return (
//     <Wrapper>
//       <Container>
//         <BoxWrapper $largeItems={largeItems}>
//           {items.map((promotion) => (
//             <Linkbox
//               key={promotion.id}
//               linkboxAriaLabel={localizedValue(
//                 promotion.heading,
//                 i18n.language
//               )}
//               linkAriaLabel={localizedValue(promotion.heading, i18n.language)}
//               href={promotion.link}
//               heading={localizedValue(promotion.heading, i18n.language)}
//               text={
//                 promotion.body && localizedValue(promotion.body, i18n.language)
//               }
//               imgProps={{ src: promotion.image }}
//             />
//           ))}
//         </BoxWrapper>
//       </Container>
//     </Wrapper>
//   );
// };

// export default Promotions;
