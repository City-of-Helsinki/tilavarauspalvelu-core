declare module "*.svg" {
  import type { FunctionComponent, SVGProps } from "react";

  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export { ReactComponent };

  // eslint-disable-next-line no-undef
  export default string;
}
