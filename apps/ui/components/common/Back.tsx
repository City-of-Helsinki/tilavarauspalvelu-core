import { Button as HDSButton, IconArrowLeft } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import queryString from "query-string";
import { useLocalStorage } from "react-use";

const Button = styled(HDSButton).attrs({
  style: {
    "--color-bus": "var(--color-black)",
  } as React.CSSProperties,
})`
  font-size: var(--fontsize-body-l);
  margin-left: 0;
  padding-left: 0;
  color: black;

  && div {
    margin-left: 0;
    padding-left: 0;
  }
`;

type Props = {
  link?: string;
  label?: string;
  restore?: string;
};

const Back = ({ link, label = "common:prev", restore }: Props): JSX.Element => {
  const [storedValues] = useLocalStorage(restore ?? "", null);

  const { t } = useTranslation();
  const { back, push } = useRouter();

  const handleClick = () => {
    if (link && storedValues) {
      const linkWithArgs = `${link}?${queryString.stringify(storedValues)}`;
      push(linkWithArgs);
    } else {
      back();
    }
  };

  return (
    <Button
      aria-label={t(label)}
      variant="supplementary"
      type="button"
      iconLeft={<IconArrowLeft />}
      onClick={handleClick}
    >
      {t(label)}
    </Button>
  );
};

export default Back;
