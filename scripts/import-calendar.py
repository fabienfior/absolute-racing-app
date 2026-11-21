"""Turn the team's yearly calendar spreadsheet into src/data/calendar.ts.

Usage: python3 scripts/import-calendar.py path/to/Absolute_Racing_2027_Calendar.xlsx 2027

The sheet has 12 month blocks (4 columns each, Jan-Jun on top, Jul-Dec below).
A venue name in a day row marks a race day; the cell colour says which series
(matched against the colour legend at the top of the sheet). Consecutive days
at the same venue for the same series become one event.
"""
import datetime as dt
import json
import pathlib
import re
import sys

import openpyxl

LEGEND_TO_ID = {'GTWC ASIA': 'gtwca', 'CHINA GT': 'chinagt', 'JAPAN CUP': 'japancup', 'IGTC': 'igtc',
                'CARRERA CUP ASIA': 'pcca', 'PCCA': 'pcca', 'FIA GT WORLD CUP': 'fiagtwc', 'ENDURANCE': 'endurance'}
SERIES_LABEL = {'gtwca': 'GTWC Asia', 'chinagt': 'China GT', 'japancup': 'Japan Cup', 'igtc': 'IGTC',
                'pcca': 'Carrera Cup Asia', 'fiagtwc': 'FIA GT World Cup', 'endurance': 'Endurance'}
# venue -> (display name, circuit, location, lat, lon)
VENUES = {
    'BATHURST': ('Bathurst 12 Hour', 'Mount Panorama Circuit', 'Bathurst, Australia', -33.4474, 149.5578),
    'SEPANG': ('Sepang', 'Sepang International Circuit', 'Kuala Lumpur, Malaysia', 2.7608, 101.7382),
    'SHANGHAI': ('Shanghai', 'Shanghai International Circuit', 'Shanghai, China', 31.3389, 121.2197),
    'CHANG': ('Buriram', 'Chang International Circuit', 'Buriram, Thailand', 14.9633, 103.0847),
    'MOTEGI': ('Motegi', 'Mobility Resort Motegi', 'Motegi, Japan', 36.5326, 140.2272),
    'NINGBO': ('Ningbo', 'Ningbo International Circuit', 'Ningbo, China', 29.9015, 121.8697),
    'SUZUKA': ('Suzuka', 'Suzuka Circuit', 'Suzuka, Japan', 34.8431, 136.5410),
    'SUZUKA 1000': ('Suzuka 1000km', 'Suzuka Circuit', 'Suzuka, Japan', 34.8431, 136.5410),
    'FUJI': ('Fuji', 'Fuji Speedway', 'Oyama, Japan', 35.3717, 138.9275),
    'OKAYAMA': ('Okayama', 'Okayama International Circuit', 'Mimasaka, Japan', 34.9147, 134.2211),
    'BEIJING': ('Beijing', 'Beijing (circuit to be confirmed)', 'Beijing, China', 39.9042, 116.4074),
}


def rgb(cell):
    return cell.fill.fgColor.rgb if cell.fill and cell.fill.fill_type == 'solid' else None


def main(path, year):
    ws = openpyxl.load_workbook(path).active
    colours = {}
    for row in ws.iter_rows(max_row=6):
        for c in row:
            if isinstance(c.value, str) and c.value.strip().upper() in LEGEND_TO_ID:
                colours[rgb(c)] = LEGEND_TO_ID[c.value.strip().upper()]

    days = []  # (date, series, venue)
    month_rows = [r for r in range(1, ws.max_row + 1) if str(ws.cell(r, 1).value or '').upper() in ('JANUARY', 'JULY')]
    for half, start in enumerate(month_rows):
        for block in range(6):
            month = half * 6 + block + 1
            day_col = block * 4 + 1
            for r in range(start + 1, start + 33):
                m = re.match(r'(\d+)', str(ws.cell(r, day_col).value or ''))
                if not m:
                    continue
                for col in range(day_col + 1, day_col + 4):
                    cell = ws.cell(r, col)
                    if isinstance(cell.value, str) and cell.value.strip():
                        series = colours.get(rgb(cell))
                        venue = cell.value.strip().upper()
                        if not series:
                            print(f'! no series colour for {venue} on {year}-{month}-{m.group(1)}', file=sys.stderr)
                            continue
                        days.append((dt.date(year, month, int(m.group(1))), series, venue))

    days.sort()
    events = []
    for d, series, venue in days:
        prev = next((e for e in events if e['series'] == series and e['venue'] == venue
                     and (d - e['end']).days == 1), None)
        if prev:
            prev['end'] = d
        else:
            events.append({'series': series, 'venue': venue, 'start': d, 'end': d})

    out = []
    for e in sorted(events, key=lambda e: (e['start'], e['series'])):
        if e['venue'] not in VENUES:
            print(f"! unknown venue {e['venue']}: add it to VENUES", file=sys.stderr)
            continue
        name, circuit, location, lat, lon = VENUES[e['venue']]
        title = name if e['series'] == 'igtc' else f"{SERIES_LABEL[e['series']]} – {name}"
        out.append({
            'id': f"{year}-{e['series']}-{e['venue'].lower().replace(' ', '')}-{e['start'].strftime('%m%d')}",
            'name': title, 'championshipId': e['series'], 'circuit': circuit, 'location': location,
            'latitude': lat, 'longitude': lon,
            'startDate': e['start'].isoformat(), 'endDate': e['end'].isoformat(),
            'summary': f'Provisional date from the team {year} calendar.',
            'sessions': [], 'travel': [], 'crew': [], 'links': [],
        })

    target = pathlib.Path(__file__).resolve().parent.parent / 'src/data/calendar.ts'
    target.write_text(
        "import type { RaceEvent } from '@/lib/types';\n\n"
        f"/** Generated by scripts/import-calendar.py from the team {year} calendar. Do not edit by hand. */\n"
        f"export const calendarEvents: RaceEvent[] = {json.dumps(out, indent=2, ensure_ascii=False)};\n")
    print(f'{len(out)} events written to {target}')


if __name__ == '__main__':
    main(sys.argv[1], int(sys.argv[2]))
