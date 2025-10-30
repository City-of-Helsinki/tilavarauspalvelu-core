import React, { useState } from "react";
import { IconSearch, TextInput } from "hds-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "ui/src/modules/const";
import { getSingleSearchPath } from "@/modules/urls";

const StyledTextInput = styled(TextInput)`
  position: relative;
  width: 100%;

  &&& input {
    font-size: var(--fontsize-body-m);
    padding-right: var(--spacing-2-xl);
    height: 44px;
    border-color: var(--color-black-30);
  }

  label {
    position: absolute;
    top: 26%;
    right: var(--spacing-s);
    z-index: 1;
  }

  @media (min-width: ${breakpoints.s}) {
    min-width: 286px;
  }
`;

export function ReservationUnitSearch(): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("textSearch", searchTerm);
    router.push(getSingleSearchPath(params));
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)}>
      <StyledTextInput
        placeholder={t("home:head.searchPlaceholder")}
        label={
          <IconSearch
            onClick={(e) => handleSubmit(e)}
            tabIndex={0}
            aria-label={t("common:search")}
            aria-hidden="false"
          />
        }
        aria-label={t("home:head.searchPlaceholder")}
        id="front-page__search--reservation-unit"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </form>
  );
}
