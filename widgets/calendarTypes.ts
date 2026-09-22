export interface CalEvent {
  id: string;
  title: string;
  startDate: string; // ISO string
  endDate: string;
  allDay: boolean;
  color: string;
}

export interface CalendarWidgetData {
  events: CalEvent[];
}

export const MONTH_NAMES_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
export const WEEKDAY_NAMES_FR = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
export const DAY_LETTERS = ['D','L','M','M','J','V','S'];
