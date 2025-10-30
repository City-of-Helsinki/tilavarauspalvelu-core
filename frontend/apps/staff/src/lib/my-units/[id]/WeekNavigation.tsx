import React from "react";
import { endOfISOWeek, getISOWeek, startOfISOWeek } from "date-fns";
import { Button, ButtonSize, ButtonVariant, IconAngleLeft, IconAngleRight } from "hds-react";
import { useTranslation } from "next-i18next";
import { formatDateRange } from "ui/src/modules/date-utils";
import { Flex } from "ui/src/styled";
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
  const dateRange = formatDateRange(startOfISOWeek(d), endOfISOWeek(d), { showYear: false });
  return (
    <Flex $alignItems="center" $direction="row">
      <Btn
        aria-label={t("common:prev")}
        size={ButtonSize.Small}
        variant={ButtonVariant.Supplementary}
        onClick={onPrev}
        iconStart={<IconAngleLeft />}
      >
        {" "}
      </Btn>
      <div style={{ minWidth: "10em", textAlign: "center" }}>
        {t("common:week")} {week} / {dateRange}
      </div>
      <Btn
        aria-label={t("common:next")}
        size={ButtonSize.Small}
        variant={ButtonVariant.Supplementary}
        onClick={onNext}
        iconStart={<IconAngleRight />}
      >
        {" "}
      </Btn>
    </Flex>
  );
}

export default WeekNavigation;
