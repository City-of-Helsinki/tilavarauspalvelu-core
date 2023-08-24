import React from "react";
import styled from "styled-components";
import {
  QueryTermsOfUseArgs,
  TermsOfUseType,
  Query,
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import { gql, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";

// NOTE This is partial duplicate from ui/application/Preview.tsx
// see if we can combine them (and other Terms later with parameters)
// TODO max height? is it 135px or 158px or perhaps a reasonable rem measure?
const Terms = styled.div`
  border-top: 8px solid var(--color-bus);
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-m);
  white-space: break-spaces;
  max-height: 10em;
  overflow-y: scroll;
  background-color: var(--color-silver-light);
  padding: var(--spacing-m);

  & > h3 {
    margin-top: 0;
  }
`;

const TOSElement = ({ title, text }: { title: string; text: string }) => (
  <Terms>
    <h3>{title}</h3>
    <p>{text}</p>
  </Terms>
);

const TERMS_OF_USE = gql`
  query TermsOfUse($termsType: TermsOfUseTermsOfUseTermsTypeChoices) {
    termsOfUse(termsType: $termsType) {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
          textFi
          textEn
          textSv
          termsType
        }
      }
    }
  }
`;

const useGenericTerms = () => {
  const { data } = useQuery<Query, QueryTermsOfUseArgs>(TERMS_OF_USE, {
    variables: {
      termsType: TermsOfUseTermsOfUseTermsTypeChoices.GenericTerms,
    },
  });

  const genericTerms = data?.termsOfUse?.edges
    ?.map((n) => n?.node)
    ?.filter((n): n is TermsOfUseType => n != null)
    .find((n) => n.pk != null && ["generic1"].includes(n.pk));

  return genericTerms;
};

const ShowTOS = ({
  reservationUnit,
}: {
  reservationUnit: ReservationUnitType;
}) => {
  const { t } = useTranslation();

  const serviceTerms = reservationUnit.serviceSpecificTerms;
  const payTerms = reservationUnit.paymentTerms;
  const priceTerms = reservationUnit.pricingTerms;
  const cancelTerms = reservationUnit.cancellationTerms;

  const genericTerms = useGenericTerms();

  return (
    <div>
      {payTerms?.textFi && (
        <TOSElement
          title={t("tos.paymentTermsTitle")}
          text={payTerms?.textFi ?? ""}
        />
      )}
      {priceTerms?.textFi && (
        <TOSElement
          title={t("tos.priceTermsTitle")}
          text={priceTerms?.textFi ?? ""}
        />
      )}
      {cancelTerms?.textFi && (
        <TOSElement
          title={t("tos.cancelTermsTitle")}
          text={cancelTerms?.textFi ?? ""}
        />
      )}
      {serviceTerms?.textFi && (
        <TOSElement
          title={t("tos.serviceTermsTitle")}
          text={serviceTerms?.textFi ?? ""}
        />
      )}
      <TOSElement
        title={t("tos.generalTermsTitle")}
        text={genericTerms?.textFi ?? ""}
      />
    </div>
  );
};

export default ShowTOS;
