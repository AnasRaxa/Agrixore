import { UNITS } from './constants';

export type AreaUnit = 'acre' | 'kanal' | 'marla';

const SQFT: Record<AreaUnit, number> = {
  acre: UNITS.sqFtPerAcre,
  kanal: UNITS.sqFtPerMarla * UNITS.marlaPerKanal,
  marla: UNITS.sqFtPerMarla,
};

export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  return (value * SQFT[from]) / SQFT[to];
}

export function kgToMaund(kg: number): number {
  return kg / UNITS.kgPerMaund;
}
