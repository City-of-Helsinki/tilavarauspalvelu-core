const breakpoints = {
  s: "576px",
  m: "768px",
  l: "992px",
  xl: "1248px",
};

const colors = {
  white: {
    dark: "#ffffff",
    medium: "#f0f0f0",
  },
  black: {
    dark: "#000000",
    medium: "#1A1A1A",
    light: "#CCCCCC",
  },
  blue: {
    dark: "#00005E",
    medium: "#0000bf",
  },
};

const fontSizes = {
  heading: {
    xxl: "4rem",
    xl: { desktop: "3rem", mobile: "2.5rem" },
    l: "2rem",
    m: "1.5rem",
    s: "1.25rem",
    xs: "1.125rem",
    xxs: "1rem",
  },
  body: {
    s: "0.875rem",
    m: "1rem",
    l: "1.125rem",
    xl: "1.25rem",
  },
};

const lineHeight = {
  s: "1",
  m: "1.2",
  l: "1.5",
  xl: " 1.75",
};

const spacing = {
  layout: {
    xxs: "1rem",
    xs: "1.5rem",
    s: "2rem",
    m: "3rem",
    l: "4rem",
    xl: "6rem",
    xxl: "8rem",
  },
  xxxxs: "0.125rem",
  xxxs: "0.25rem",
  xxs: "0.5rem",
  xs: "0.75rem",
  s: "1rem",
  m: "1.5rem",
  l: "2rem",
  xl: "2.5rem",
  xxl: "3.0rem",
  xxxl: "3.5rem",
  xxxxl: "4rem",
  xxxxxxl: "4.5rem",
};

const zIndex = {
  modal: "200",
  stickyContainer: "100",
  tooltip: "100",
  navigation: "100",
};

const theme = {
  breakpoints,
  colors,
  fontSizes,
  lineHeight,
  spacing,
  zIndex,
};

export { theme };
