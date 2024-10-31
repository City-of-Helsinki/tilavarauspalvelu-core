import React from "react";
import { useTranslation } from "next-i18next";
import { IconArrowRight, IconSignout } from "hds-react";
import { signOut } from "common/src/browserHelpers";
import { getSingleSearchPath } from "@/modules/urls";
import { IconButton } from "common/src/components";
import { Flex } from "common/styles/util";

type Props = {
  apiBaseUrl: string;
};

export function CancelledLinkSet({ apiBaseUrl }: Props) {
  const { t } = useTranslation();
  return (
    <Flex>
      <IconButton
        href={getSingleSearchPath()}
        icon={<IconArrowRight size="m" aria-hidden="true" />}
        label={t("reservations:backToSearch")}
      />
      <IconButton
        href="/"
        label={t("common:gotoFrontpage")}
        icon={<IconArrowRight size="m" aria-hidden="true" />}
      />
      <IconButton
        onClick={() => signOut(apiBaseUrl)}
        label={t("common:logout")}
        icon={<IconSignout size="m" aria-hidden="true" />}
      />
    </Flex>
  );
}
