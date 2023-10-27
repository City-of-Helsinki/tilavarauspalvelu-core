import React from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import type { ApplicationNode, TermsOfUseType } from "common/types/gql-types";
import { BlackButton } from "@/styles/util";
import { ButtonContainer } from "../common/common";
import { ViewInner } from "./ViewInner";

type Props = {
  application: ApplicationNode;
  tos: TermsOfUseType[];
};

// NOTE this is wrapped inside [...params].tsx so we can use FormContext in the Inner
// Though we'd like to remove [...params].tsx completely and use the file router instead.
const View = ({ application, tos }: Props): JSX.Element => {
  const { t } = useTranslation();

  const router = useRouter();

  return (
    <>
      <ViewInner
        tos={tos}
        allReservationUnits={
          application.applicationRound.reservationUnits ?? []
        }
        />
      <ButtonContainer>
        <BlackButton variant="secondary" onClick={() => router.back()}>
          {t("common:prev")}
        </BlackButton>
      </ButtonContainer>
    </>
  );
};

export { View };
