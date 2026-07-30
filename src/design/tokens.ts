import { derive } from "./derive";
import { DEFAULT_SEED } from "./seed";

export const theme = derive(DEFAULT_SEED);
export const NC = theme.nc;

export type { NcCompat, Theme } from "./derive";
