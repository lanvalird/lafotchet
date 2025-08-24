export function getFirstDayInWeek(date: number | string | Date) {
  const d = new Date(date);
  const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
  
  return new Date(d.setDate(diff));
}
