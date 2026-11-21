import type { RaceEvent } from '@/lib/types';

/** Porsche Carrera Cup Asia 2027, from the official calendar poster (Fabien, 2026-11-21). */
type Row = [id: string, name: string, start: string, end: string, circuit: string, location: string, lat: number, lon: number, summary: string];

const ZHUHAI = ['Zhuhai International Circuit', 'Zhuhai, China', 22.37, 113.5625] as const;
const SEPANG = ['Sepang International Circuit', 'Kuala Lumpur, Malaysia', 2.7608, 101.7382] as const;

const rows: Row[] = [
  ['2027-pcca-prologue', 'Carrera Cup Asia – Prologue', '2027-03-24', '2027-03-25', ...ZHUHAI, 'Pre-season test.'],
  ['2027-pcca-zhuhai', 'Carrera Cup Asia – Zhuhai', '2027-03-27', '2027-03-28', ...ZHUHAI, 'Rounds 1 & 2.'],
  ['2027-pcca-shanghai', 'Carrera Cup Asia – Shanghai', '2027-04-16', '2027-04-18', 'Shanghai International Circuit', 'Shanghai, China', 31.3389, 121.2197, 'Rounds 3 & 4.'],
  ['2027-pcca-fuji', 'Carrera Cup Asia – Fuji', '2027-05-21', '2027-05-23', 'Fuji Speedway', 'Oyama, Japan', 35.3717, 138.9275, 'Rounds 5, 6 & 7.'],
  ['2027-pcca-sepang-aug', 'Carrera Cup Asia – Sepang', '2027-08-20', '2027-08-22', ...SEPANG, 'Rounds 8, 9 & 10.'],
  ['2027-pcca-sepang-sep', 'Carrera Cup Asia – Sepang', '2027-09-17', '2027-09-19', ...SEPANG, 'Rounds 11, 12 & 13.'],
  ['2027-pcca-singapore', 'Carrera Cup Asia – Singapore', '2027-10-08', '2027-10-10', 'Marina Bay Street Circuit', 'Singapore', 1.2914, 103.864, 'Rounds 14 & 15.'],
];

export const pccaEvents: RaceEvent[] = rows.map(([id, name, startDate, endDate, circuit, location, latitude, longitude, summary]) => ({
  id,
  name,
  championshipId: 'pcca',
  circuit,
  location,
  latitude,
  longitude,
  startDate,
  endDate,
  summary,
  sessions: [],
  travel: [],
  crew: [],
  links: [],
}));
