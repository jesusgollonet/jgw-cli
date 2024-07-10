// Units
const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export type TimeUnit =
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "quarters"
  | "years";

export function getUnitAndValueFormat(
  ellapsedTime: number,
): [number, TimeUnit] {
  let unit: TimeUnit = "seconds";
  let value = SECOND;
  if (ellapsedTime <= MINUTE) {
    unit = "seconds";
    value = SECOND;
  } else if (ellapsedTime <= HOUR) {
    unit = "minutes";
    value = MINUTE;
  } else if (ellapsedTime <= DAY) {
    unit = "hours";
    value = HOUR;
  } else if (ellapsedTime <= WEEK) {
    unit = "days";
    value = DAY;
  } else if (ellapsedTime <= MONTH) {
    unit = "weeks";
    value = WEEK;
  } else if (ellapsedTime <= YEAR) {
    unit = "months";
    value = MONTH;
  } else {
    unit = "years";
    value = YEAR;
  }
  return [value, unit];
}
