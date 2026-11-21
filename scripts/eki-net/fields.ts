export const KEYS = ['from', 'to', 'date', 'hour', 'minute', 'depArr', 'adult', 'child'] as const;

/** Search conditions kept between visits. */
export type Condition = Record<(typeof KEYS)[number], string>;

type FormSpec = {
  form: string;
  /** Field name for each condition (radio groups included). */
  names: Record<keyof Condition, string>;
};

const common = {
  from: 'form_station_geton',
  to: 'form_station_getoff',
  depArr: 'form_date_oneway_DepArr',
  adult: 'top_formEntryAdlutInput',
  child: 'top_formEntryChildInput',
} as const;

/** The train search form on each supported page. */
export const FORMS: FormSpec[] = [
  // Top page
  {
    form: '#form_search_train',
    names: { ...common, date: 'OnewayDate', hour: 'OnewayHour', minute: 'OnewayMinute' },
  },
  // Route search condition input
  {
    form: '#top_formEntry',
    names: {
      ...common,
      date: 'form_date_oneway_date',
      hour: 'form_date_oneway_hour',
      minute: 'form_date_oneway_minute',
    },
  },
];
