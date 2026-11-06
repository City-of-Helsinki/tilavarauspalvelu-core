# Frontend code style

> Also read the [frontend architecture](./frontend-architecture.md).

## General

- `oxlint` with type checks is the linter. Use it via `just fe lint-fix`. Its rules are in `.oxlintrc.json`.
- CSS is linted separately with `stylelint`. Use it via `just fe lint-css`. Its rules are in `.stylelintrc.json`.
- `oxfmt` is the formatter. Use it via `just fe format`. Its rules are in `.oxfmtrc.json`.
- Do not restate the above-mentioned rules in code review.
- Accept what the formatter and linter want. If an autofix rewrites code, keep the rewrite.
- Fix the code instead of disabling a lint rule. If a rule truly does not fit then disable it for one line only, with
  the reason in the same comment.
- Use helpers in `ui/src/modules/` for common tasks, such as date parsing and formatting, instead of writing your own.

## Readability

The `Readability` rules in [backend code style](./backend-code-style.md) apply here too,
except for the rules about Python keyword arguments, `getattr`, and `setattr`. In TypeScript:

- Write out each prop by name at the call site. Do not build an object only to spread it into props.
  Spreads are fine where a library gives the object, such as `{...register("name")}`,
  and in a wrapper that passes `{...rest}` to the component it wraps.
- Read and write each property by its name. Do not build a property name from a string.
  The exception is a translation key that the type is checked for, such as an enum value.
- Use `== null` and `!= null` to check for `null`.
- Use `isVariableName` and `hasVariableName` for boolean props and state, and functions which return a boolean. Use
  `variableName` for other types.
- Don't use variable names in plural, rather using e.g. `variableNameList` for names which are arrays or  
  lists, and `variableNameListItem` for the members in said array.
- When declaring a props type, append `Props` to the component or hook name.

## Code comments

The `Code comments` rules in [backend code style](./backend-code-style.md) apply to every comment you write
in the frontend, including comments in tests and in JSX.

## Components

- Write function components. Use named exports. Only a page file has a default export.
- Type props as `Readonly<{...}>`. Name the type `<ComponentName>Props` when the file has one component.
- Prefer to export only one component from a file, except for re-exports. Small components that only this file uses can
  stay in the same file.
- Move data logic out of a large component into a `use<Thing>` hook in the same file.
  Move the hook to `hooks/` when another file needs it.
- Use the generated fragment type for a prop that holds GraphQL data, such as `ReservationTitleSectionFieldsFragment`.
  Do not write the type by hand.

## Styling

- Use `styled-components`. Put the styled components for one component at the top of its file,
  or in a `styles.tsx` next to it when there are many.
- Prefix a prop that only styling reads with `$`, such as `$isSummary`, so it does not reach the DOM.
- Use HDS tokens and the CSS variables in `styles/variables.css`. Do not hard-code colours and sizes.
- Use the shared styled components in `ui/src/styled` before you write a new one.

## Forms

- Use `react-hook-form` with a Zod schema through `zodResolver`.
- Put the schema in the `schemas/` directory of the app, or in `ui/src/schemas` when both apps use it.

## Text and dates

- Every text that a user reads comes from a translation key. Use `useTranslation` from `next-i18next/pages`.
  Write keys as `namespace:key`.
- Use the helpers in `ui/src/modules/date-utils` to parse and format dates. They handle the Helsinki time zone.

## Accessibility

- Every interactive element works with a keyboard and has an accessible name.
- Prefer a native element or an HDS component to a `div` with a `role`.
- For the calendar, read the ADRs in `docs/adr/` first.

## Error handling

- Show mutation errors to the user with the helpers in `ui/src/hooks/useDisplayError.ts` and `ui/src/components/toast.tsx`.
- Never show the raw message of a caught error to the user. Show a translated, fixed message instead.
