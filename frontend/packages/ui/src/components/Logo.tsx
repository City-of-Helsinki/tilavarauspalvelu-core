import React from "react";
import { Logo as HDSLogo, logoFi, LogoProps, LogoSize, logoSv } from "hds-react";
import { useTranslation } from "next-i18next";

function logoSrcFromLanguage(language: string) {
  if (language === "sv") {
    return logoSv;
  }
  return logoFi;
}

export default function Logo({
  size = LogoSize.Medium,
  style,
}: Pick<LogoProps, "size"> & { style?: React.CSSProperties }): JSX.Element {
  const { t, i18n } = useTranslation();
  return <HDSLogo src={logoSrcFromLanguage(i18n.language)} alt={t("common:helsinkiCity")} size={size} style={style} />;
}
