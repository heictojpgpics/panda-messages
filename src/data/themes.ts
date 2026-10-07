export interface Theme {
  id: string;
  name: string;
  blurb: string;
  /** Envelope + page accent colors. */
  colors: {
    /** Outer envelope. */
    envelope: string;
    /** Envelope flap + inner glow. */
    flap: string;
    /** Card page background wash. */
    page: string;
    /** Seal wax color. */
    seal: string;
    /** Card paper tint. */
    paper: string;
    /** Header text color on the card. */
    heading: string;
    /** Texture key, see CardScene. */
    texture: "bamboo" | "petals" | "roses" | "stars" | "moon" | "velvet" | "sun" | "snow" | "leaves" | "candles" | "confetti";
  };
}

export const THEMES: Theme[] = [
  {
    id: "bamboo-grove",
    name: "Bamboo Grove",
    blurb: "Panda's own cream and jade, with little paw prints along the way.",
    colors: {
      envelope: "#E8F0E2",
      flap: "#CDE3CB",
      page: "#F4F8EF",
      seal: "#157A55",
      paper: "#FFFDF7",
      heading: "#157A55",
      texture: "bamboo",
    },
  },
  {
    id: "pressed-flowers",
    name: "Pressed Flowers",
    blurb: "Quiet and tender, for saying something that matters.",
    colors: {
      envelope: "#F2E9DC",
      flap: "#E4D3BC",
      page: "#F9F4EB",
      seal: "#B0713F",
      paper: "#FFFEF9",
      heading: "#8A5A33",
      texture: "petals",
    },
  },
  {
    id: "rose-garden",
    name: "Rose Garden",
    blurb: "Deep reds and gold, for saying something you mean.",
    colors: {
      envelope: "#8E1F35",
      flap: "#6E1226",
      page: "#F7E9E9",
      seal: "#C9A227",
      paper: "#FFF9F5",
      heading: "#8E1F35",
      texture: "roses",
    },
  },
  {
    id: "long-distance",
    name: "Long Distance",
    blurb: "Two windows, one moon, for the miles between you.",
    colors: {
      envelope: "#1B2A4A",
      flap: "#0F1B33",
      page: "#EDF1F8",
      seal: "#C9A227",
      paper: "#FDFFFF",
      heading: "#2A3D66",
      texture: "moon",
    },
  },
  {
    id: "moonlit-garden",
    name: "Moonlit Garden",
    blurb: "Blossoms falling under the moon, for something said softly.",
    colors: {
      envelope: "#3D2B56",
      flap: "#2A1B3E",
      page: "#F1ECF8",
      seal: "#B08BC9",
      paper: "#FEFCFF",
      heading: "#5A3E80",
      texture: "stars",
    },
  },
  {
    id: "midnight-velvet",
    name: "Midnight Velvet",
    blurb: "For the ones that deserve something a little grander.",
    colors: {
      envelope: "#101522",
      flap: "#070A12",
      page: "#EBEDF3",
      seal: "#C9A227",
      paper: "#FBFCFF",
      heading: "#1C2438",
      texture: "velvet",
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    blurb: "Warm light and a low sun, for when you want them to feel it.",
    colors: {
      envelope: "#E8A24C",
      flap: "#D07E1F",
      page: "#FCF1DE",
      seal: "#8C5A10",
      paper: "#FFFCF4",
      heading: "#9A6414",
      texture: "sun",
    },
  },
  {
    id: "winter-wonderland",
    name: "Winter Wonderland",
    blurb: "Snowfall and silver, for the cosiest time of the year.",
    colors: {
      envelope: "#D8E6F2",
      flap: "#BBD3E8",
      page: "#F2F7FC",
      seal: "#5B7FA6",
      paper: "#FFFFFF",
      heading: "#43689A",
      texture: "snow",
    },
  },
  {
    id: "autumn-leaves",
    name: "Autumn Leaves",
    blurb: "Falling leaves and a warm glow, for the cosiest months.",
    colors: {
      envelope: "#C26A2A",
      flap: "#9A4C16",
      page: "#F9EFE4",
      seal: "#6E3A10",
      paper: "#FFFCF6",
      heading: "#8A4A14",
      texture: "leaves",
    },
  },
  {
    id: "birthday-bash",
    name: "Birthday Bash",
    blurb: "Candlelight and balloons, for the day that is all about them.",
    colors: {
      envelope: "#F6D774",
      flap: "#EFC23D",
      page: "#FDF6DC",
      seal: "#E0607E",
      paper: "#FFFEF8",
      heading: "#B0770A",
      texture: "candles",
    },
  },
  {
    id: "confetti-pop",
    name: "Confetti Pop",
    blurb: "When the news is good and you want to make a fuss.",
    colors: {
      envelope: "#F28C5A",
      flap: "#E56A31",
      page: "#FDEFE6",
      seal: "#157A55",
      paper: "#FFFEF9",
      heading: "#C2531B",
      texture: "confetti",
    },
  },
  {
    id: "sea-glass",
    name: "Sea Glass",
    blurb: "Cool water, clear skies, and a note that feels like a deep breath.",
    colors: {
      envelope: "#9ACEC8",
      flap: "#65ACA8",
      page: "#E7F6F4",
      seal: "#267B78",
      paper: "#FBFFFE",
      heading: "#256B68",
      texture: "stars",
    },
  },
  {
    id: "berry-kiss",
    name: "Berry Kiss",
    blurb: "Raspberry, rose, and just enough shimmer for a proper love note.",
    colors: {
      envelope: "#B7365B",
      flap: "#86203F",
      page: "#FCECF1",
      seal: "#E6AD56",
      paper: "#FFFDFD",
      heading: "#8B2143",
      texture: "roses",
    },
  },
  {
    id: "night-market",
    name: "Night Market",
    blurb: "Ink blue, lantern gold, and a little bit of after-dark magic.",
    colors: {
      envelope: "#18335F",
      flap: "#0E2244",
      page: "#EEF2FB",
      seal: "#D7A637",
      paper: "#FEFEFF",
      heading: "#274E8F",
      texture: "moon",
    },
  },
];

export const FREE_THEMES = ["bamboo-grove"];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isPremiumTheme(id: string): boolean {
  return !FREE_THEMES.includes(id);
}
