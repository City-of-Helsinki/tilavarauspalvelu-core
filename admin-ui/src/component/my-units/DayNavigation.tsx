import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, IconAngleLeft, IconAngleRight } from "hds-react";
import { formatDate } from "../../common/util";
import { HorisontalFlex } from "../../styles/layout";

type Props = {
  date: string;
  onNext: () => void;
  onPrev: () => void;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em 0.5em;
  color: black;
  text-decoration: none !important;
  svg {
    color: black;
  }
`;

const DayNavigation = ({ date, onNext, onPrev }: Props): JSX.Element => {
  const d = new Date(date);
  const { t } = useTranslation();

  return (
    <Wrapper>
      <HorisontalFlex
        style={{
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        <Button
          aria-label={t("common.prev")}
          size="small"
          variant="supplementary"
          onClick={onPrev}
          iconLeft={<IconAngleLeft />}
        >
          {" "}
        </Button>
        <div style={{ width: "5em", textAlign: "center" }}>
          {formatDate(d.toISOString())}
        </div>
        <Button
          aria-label={t("common.next")}
          size="small"
          onClick={onNext}
          variant="supplementary"
          iconLeft={<IconAngleRight />}
        >
          {" "}
        </Button>
      </HorisontalFlex>
    </Wrapper>
  );
};

export default DayNavigation;
