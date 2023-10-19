export interface FormValues {
  purposes: string | null;
  unit: string | null;
  equipments: string | null;
  timeBegin: string | null;
  timeEnd: string | null;
  dateBegin: string | null;
  dateEnd: string | null;
  duration: number | null;
  minPersons: string | null;
  maxPersons: string | null;
  reservationUnitType: string;
  showOnlyAvailable?: boolean;
  textSearch?: string;
}
