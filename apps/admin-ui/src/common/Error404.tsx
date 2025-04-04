/// TODO this is a copy of 5xx page, refactor to use same component
/// TODO use translations
import { Link } from "hds-react";
import React from "react";
import { H1 } from "common/styled";
import { PUBLIC_URL } from "./const";

// TODO should there be an image here?
function Error404({ message }: { message?: string }): JSX.Element {
  return (
    <>
      <H1 $large>404: Sivua ei löytynyt</H1>
      {message && <p>{message}</p>}
      <Link href={PUBLIC_URL ?? "/"}>Siirry etusivulle</Link>
    </>
  );
}

export default Error404;
