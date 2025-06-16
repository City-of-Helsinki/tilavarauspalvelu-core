import { endOfISOWeek, format, getISOWeek, startOfISOWeek } from "date-fns";
import { Button, ButtonSize, ButtonVariant, IconAngleLeft, IconAngleRight } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, DATE_FORMAT_SHORT } from "@/common/util";
import { Flex } from "common/styled";
import styled from "styled-components";

const Btn = styled(Button)`
  color: var(--color-black);
  padding: 0;
`;

type Props = {
  date: string;
  onNext: () => void;
  onPrev: () => void;
};

function WeekNavigation({ date, onNext, onPrev }: Props): JSX.Element {
  const d = new Date(date);
  const { t } = useTranslation();

  const week = getISOWeek(d);

  return (
    <Flex $alignItems="center" $direction="row">
      <Btn
        aria-label={t("common.prev")}
        size={ButtonSize.Small}
        variant={ButtonVariant.Supplementary}
        onClick={onPrev}
        iconStart={<IconAngleLeft aria-hidden="true" />}
      >
        {" "}
      </Btn>
      <div style={{ minWidth: "10em", textAlign: "center" }}>
        {t("common.week")} {week} / {format(startOfISOWeek(d), DATE_FORMAT_SHORT)} -{" "}
        {format(endOfISOWeek(d), DATE_FORMAT)}
      </div>
      <Btn
        aria-label={t("common.next")}
        size={ButtonSize.Small}
        variant={ButtonVariant.Supplementary}
        onClick={onNext}
        iconStart={<IconAngleRight aria-hidden="true" />}
      >
        {" "}
      </Btn>
    </Flex>
  );
}

export default WeekNavigation;
