import React from "react";
import { IconArrowRight, IconSignout, IconSize } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import { IconButton } from "ui/src/components";
import { signOut } from "ui/src/modules/browserHelpers";
import { Flex } from "ui/src/styled";
import { getSingleSearchPath } from "@/modules/urls";

type Props = {
  reservationUnitHome?: string;
};

function BaseLinkSet({ reservationUnitHome }: Props): React.ReactElement {
  const { t } = useTranslation();
  const resUnitUrl = reservationUnitHome ?? null;

  return (
    <Flex $gap="2-xs">
      {resUnitUrl ? (
        <IconButton
          href={resUnitUrl}
          label={t("common.actions.backTo", { destination: t("reservation:reservationUnitPage") })}
          icon={<IconArrowRight size={IconSize.Medium} aria-hidden="true" />}
        />
      ) : (
        <IconButton
          href={getSingleSearchPath()}
          icon={<IconArrowRight size={IconSize.Medium} aria-hidden="true" />}
          label={t("common.actions.backTo", { destination: t("reservation:searchPage") })}
        />
      )}
      <IconButton
        href="/"
        label={t("common:gotoFrontpage")}
        icon={<IconArrowRight size={IconSize.Medium} aria-hidden="true" />}
      />
      <IconButton
        onClick={() => signOut()}
        label={t("common:logout")}
        icon={<IconSignout size={IconSize.Medium} aria-hidden="true" />}
      />
    </Flex>
  );
}

export function CancelledLinkSet() {
  return <BaseLinkSet />;
}

export function BackLinkList(props: { reservationUnitHome: string }): React.ReactElement {
  return <BaseLinkSet {...props} />;
}
