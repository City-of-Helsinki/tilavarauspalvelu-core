import { IconSearch, TextInput } from "hds-react";
import { useRouter } from "next/router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { singleSearchPrefix } from "../../modules/const";

const Wrapper = styled.form``;

const StyledTextInput = styled(TextInput).attrs({
  style: { "--input-border-color-default": "var(--color-black-30)" },
})`
  position: relative;
  width: 245px;
  height: 44px;

  &&& input {
    font-size: var(--fontsize-body-m);
    padding-right: var(--spacing-2-xl);
  }

  label {
    position: absolute;
    top: 35%;
    right: var(--spacing-s);
    z-index: 1;
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
