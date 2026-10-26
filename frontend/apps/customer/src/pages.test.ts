import path from "node:path";
import { describe, expect, it } from "vitest";
import { findPagesWithoutServerSideProps } from "../../../test-utils/server-side-pages";

describe("pages", () => {
  it("export getServerSideProps so the env is loaded on the server", () => {
    expect(findPagesWithoutServerSideProps(path.join(__dirname, "pages"))).toEqual([]);
  });
});
