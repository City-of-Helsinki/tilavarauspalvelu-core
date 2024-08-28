import React from "react";
import { useTranslation } from "next-i18next";
import { Logo as HDSLogo, logoFi, LogoProps, logoSv } from "hds-react";

function logoSrcFromLanguage(language: string) {
  if (language === "sv") {
    return logoSv;
  }
  return logoFi;
}

export default function Logo({
  size,
  style,
}: Pick<LogoProps, "size"> & { style?: React.CSSProperties }): JSX.Element {
  const { t, i18n } = useTranslation();
  return (
    <HDSLogo
      src={logoSrcFromLanguage(i18n.language)}
      alt={t("common:applicationName")}
      size={size ?? "medium"}
      style={style}
    />
  );
}
