export interface AppointmentTodayMetrics {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  noShowRate: number;
}

export interface AppointmentHistoricalMetrics {
  completedByDate: Record<string, number>;
  noShowByDate: Record<string, number>;
}

export interface AppointmentFutureMetrics {
  nextWeekScheduled: number;
  nextMonthScheduled: number;
  nextWeekOccupancyRate: number;
  nextMonthOccupancyRate: number;
}

export interface AppointmentDashboardMetrics {
  today: AppointmentTodayMetrics;
  historical: AppointmentHistoricalMetrics;
  future: AppointmentFutureMetrics;
}
