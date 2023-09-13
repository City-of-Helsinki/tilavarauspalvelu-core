import { breakpoints } from "common/src/common/style";
import { IconSearch, TextInput } from "hds-react";
import { useRouter } from "next/router";
import React, { useRef } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { singleSearchPrefix } from "../../modules/const";

const Wrapper = styled.form``;

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

const ReservationUnitSearch = (): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState("");

  const formRef = useRef();

  const handleSubmit = (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();
    router.push(`${singleSearchPrefix}?textSearch=${searchTerm}`);
  };

  return (
    <Wrapper ref={formRef} onSubmit={(e) => handleSubmit(e)}>
      <StyledTextInput
        placeholder={t("home:head.searchPlaceholder")}
        label={<IconSearch onClick={(e) => handleSubmit(e)} aria-hidden />}
        id="front-page__search--reservation-unit"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </Wrapper>
  );
};

export default ReservationUnitSearch;
