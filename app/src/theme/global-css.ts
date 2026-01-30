export const globalCss = {
  extend: {
    "*": {
      "--global-color-border": "colors.border",
      "--global-color-placeholder": "colors.fg.subtle",
      "--global-color-selection": {
        _light: "#f6e7a8",
        _dark: "#3e3615",
      },
      "--global-color-focus-ring": "colors.colorPalette.solid.bg",
    },
    "::selection": {
      backgroundColor: "var(--global-color-selection)",
      color: "fg.default",
    },
    "::-moz-selection": {
      backgroundColor: "var(--global-color-selection)",
      color: "fg.default",
    },
    html: {
      colorPalette: "gray",
    },
    body: {
      background: "canvas",
      color: "fg.default",
    },
  },
};
