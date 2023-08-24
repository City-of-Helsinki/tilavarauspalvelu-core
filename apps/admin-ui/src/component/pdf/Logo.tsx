import React from "react";
import { Image } from "@react-pdf/renderer";
import { LOGO_IMAGE_URL } from "app/common/const";

const Logo = (): JSX.Element => (
  <Image style={{ width: 82 }} src={LOGO_IMAGE_URL} />
);
export default Logo;
