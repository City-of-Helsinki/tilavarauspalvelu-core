import React from "react";
import { useTranslation } from "next-i18next";
import { mapUrlPrefix } from "@/modules/const";

type Props = {
  tprekId: string;
  height?: string;
};

export const Map = ({
  tprekId,
  height = "480px",
}: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const mapUrl = `${mapUrlPrefix}${i18n.language}/embed/unit/${tprekId}`;
  return (
    <iframe
      title={t("reservationUnit:mapTitle")}
      style={{ border: "none", width: "100%", height }}
      src={mapUrl}
    />
  );
};
