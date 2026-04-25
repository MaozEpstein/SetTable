import { HDate, HebrewCalendar } from '@hebcal/core';

export type HebrewContext = {
  hebrewDate: string; // e.g. "כ״ה תשרי תשפ״ז"
  parsha: string | null; // e.g. "פרשת בראשית"
  holiday: string | null; // e.g. "חנוכה: ב' נרות"
};

// Returns Hebrew calendar context for a given Gregorian date.
// - hebrewDate: localized Hebrew date string
// - parsha: the Torah portion of the relevant Saturday (today if Sat,
//   next day if Fri, otherwise the previous Saturday)
// - holiday: the major holiday on this exact date, if any
export function getHebrewContext(date: Date): HebrewContext {
  return {
    hebrewDate: formatHebrewDate(date),
    parsha: findParsha(date),
    holiday: findHoliday(date),
  };
}

function formatHebrewDate(date: Date): string {
  // Intl supports the Hebrew calendar natively, and it formats with
  // gershayim (״) — same look as Hebrew dates printed in Israel.
  try {
    return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    // Fallback if the runtime's Intl doesn't support Hebrew calendar
    return new HDate(date).render('he');
  }
}

function findRelevantSaturday(date: Date): Date {
  const d = new Date(date.getTime());
  const day = d.getDay(); // 0=Sun … 6=Sat
  if (day === 6) return d;
  if (day === 5) {
    // Friday → tomorrow's parsha
    d.setDate(d.getDate() + 1);
    return d;
  }
  // Sun=0 (-1), Mon=1 (-2), … Thu=4 (-5)
  d.setDate(d.getDate() - (day + 1));
  return d;
}

function findParsha(date: Date): string | null {
  const sat = findRelevantSaturday(date);
  const satHd = new HDate(sat);
  try {
    const events = HebrewCalendar.calendar({
      start: satHd,
      end: satHd,
      sedrot: true,
      il: true,
      noHolidays: true,
    });
    for (const e of events) {
      if (e.getCategories().includes('parashat')) {
        return e.render('he');
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function findHoliday(date: Date): string | null {
  const hd = new HDate(date);
  try {
    const events = HebrewCalendar.calendar({
      start: hd,
      end: hd,
      sedrot: false,
      il: true,
      noMinorFast: true,
    });
    // Prefer "major" holidays (Pesach, Sukkot, Rosh Hashana, etc.).
    // Fall back to anything categorized as a holiday (Hanukkah, Purim,
    // Yom HaAtzma'ut, etc. — these aren't tagged "major" but still
    // qualify as חג in everyday speech).
    let major: string | null = null;
    let other: string | null = null;
    for (const e of events) {
      const cats = e.getCategories();
      if (!cats.includes('holiday')) continue;
      const name = e.render('he');
      if (cats.includes('major')) {
        if (!major) major = name;
      } else if (!other) {
        other = name;
      }
    }
    return major ?? other;
  } catch {
    return null;
  }
}
