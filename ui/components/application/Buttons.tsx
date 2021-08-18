import React from "react";
import { useTranslation } from "react-i18next";
import { Button, IconArrowLeft, IconArrowRight } from "hds-react";
import { useRouter } from "next/router";
import { ButtonContainer } from "../common/common";

type Props = {
  onSubmit: () => void;
  applicationId: number;
};

const Buttons = ({ onSubmit, applicationId }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const router = useRouter();
  return (
    <ButtonContainer>
      <Button
        variant="secondary"
        iconLeft={<IconArrowLeft />}
        onClick={() => router.push(`${applicationId}/page2`)}
      >
        {t("common:prev")}
      </Button>
      <Button id="next" iconRight={<IconArrowRight />} onClick={onSubmit}>
        {t("common:next")}
      </Button>
    </ButtonContainer>
  );
};

export default Buttons;
