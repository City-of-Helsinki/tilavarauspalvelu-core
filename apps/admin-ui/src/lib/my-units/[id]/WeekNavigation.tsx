import { endOfISOWeek, getISOWeek, startOfISOWeek } from "date-fns";
import { Button, ButtonSize, ButtonVariant, IconAngleLeft, IconAngleRight } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { formatDate, UI_DATE_FORMAT_SHORT } from "common/src/date-utils";
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
        aria-label={t("common:prev")}
        size={ButtonSize.Small}
        variant={ButtonVariant.Supplementary}
        onClick={onPrev}
        iconStart={<IconAngleLeft />}
      >
        {" "}
      </Btn>
      <div style={{ minWidth: "10em", textAlign: "center" }}>
        {t("common:week")} {week} / {formatDate(startOfISOWeek(d), { formatString: UI_DATE_FORMAT_SHORT })} -{" "}
        {formatDate(endOfISOWeek(d))}
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
