/* eslint-disable import/no-default-export */
declare module "*.svg" {
  import type { FunctionComponent, SVGProps } from "react";

  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export { ReactComponent };

  export default string;
}
