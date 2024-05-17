import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useGenericTerms } from "common/src/hooks/useGenericTerms";

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

// TODO use a fragment
type ReservationUnitProps = {
  serviceSpecificTerms?: { textFi?: string | null } | null;
  paymentTerms?: { textFi?: string | null } | null;
  pricingTerms?: { textFi?: string | null } | null;
  cancellationTerms?: { textFi?: string | null } | null;
}

const ShowTOS = ({
  reservationUnit,
}: {
  reservationUnit: ReservationUnitProps;
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
