import { endOfISOWeek, format, getISOWeek, startOfISOWeek } from "date-fns";
import { Button, IconAngleLeft, IconAngleRight } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, DATE_FORMAT_SHORT } from "@/common/util";
import { Flex } from "common/styles/util";

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
    <Flex $align="center" $direction="row">
      <Button
        aria-label={t("common.prev")}
        size="small"
        variant="supplementary"
        theme="black"
        onClick={onPrev}
        iconLeft={<IconAngleLeft />}
      >
        {" "}
      </Button>
      <div style={{ minWidth: "10em", textAlign: "center" }}>
        {t("common.week")} {week} /{" "}
        {format(startOfISOWeek(d), DATE_FORMAT_SHORT)} -{" "}
        {format(endOfISOWeek(d), DATE_FORMAT)}
      </div>
      <Button
        aria-label={t("common.next")}
        size="small"
        onClick={onNext}
        variant="supplementary"
        theme="black"
        iconLeft={<IconAngleRight />}
      >
        {" "}
      </Button>
    </Flex>
  );
}

export default WeekNavigation;
