// Query.Farm "Strata Sun" tokens — copied from query-farm-astro/src/styles/global.css.
// The contrast law from DESIGN_BRIEF.md applies here too: ink on paper, cream on
// dark, gold is display/accent only, and code always sits on rock-900.
import { loadFont as loadPetrona } from "@remotion/google-fonts/Petrona";
import { loadFont as loadNoto } from "@remotion/google-fonts/NotoSans";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const petrona = loadPetrona("normal", { weights: ["600", "700"], subsets: ["latin"] });
const noto = loadNoto("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });

export const fonts = {
  display: petrona.fontFamily,
  body: noto.fontFamily,
  mono: mono.fontFamily,
};

export const c = {
  // the mark's four bands, palest at top
  band1: "#f0c877",
  band2: "#d9a441",
  band3: "#a9762e",
  band4: "#7a5230",

  sun200: "#f6ddab",
  sun400: "#d9a441",
  sun700: "#7d5714",

  paper: "#f7f3ea", // soil-50
  soil100: "#efe9db",
  soil200: "#e6dbc2",
  soil300: "#cfc4ad",
  soil600: "#7a5230",
  soil700: "#5d4632",
  ink: "#211a12", // soil-900

  rock700: "#5f5750",
  rock800: "#2a2420",
  rock900: "#1a1512",

  field400: "#7a9a54",
  field600: "#5f7a3c",
  field700: "#45632f",
  linkDark: "#8cb878",

  pipe6: "#242b1d",
  cream: "#f4ece0",
  cream2: "#c6b8a2",
  card: "#fffdf7",

  // category tints (chip + ink pairs), used where colour carries meaning
  catGold: "#f3e4c4",
  catGoldInk: "#6d4718",
  catField: "#dee8d1",
  catFieldInk: "#3b5626",
  catClay: "#f2ded4",
  catClayInk: "#7d4028",
  catSlate: "#d8e3e8",
  catSlateInk: "#2f5058",
  catPlum: "#e7dbe6",
  catPlumInk: "#59385a",

  danger: "#b4452c",
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
