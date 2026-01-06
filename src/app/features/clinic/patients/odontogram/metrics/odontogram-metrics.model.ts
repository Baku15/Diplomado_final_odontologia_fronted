export interface ToothStatusMetric {
  status: string;
  count: number;
}

export interface ProcedureMetric {
  open: number;
  completed: number;
}

export interface ToothLoadMetric {
  toothNumber: number;
  procedures: number;
}

export interface OdontogramMetrics {
  toothStatus: ToothStatusMetric[];
  procedures: ProcedureMetric;
  toothLoad: ToothLoadMetric[];
  totalTeeth: number;
}
