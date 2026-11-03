export interface PaginationInput {
  pn?: number;
  ps?: number;
}
export interface Pagination {
  pn: number;
  ps: number;
  offset: number;
}

export function normalizePagination(input: PaginationInput, maxPs = 100): Pagination {
  const pn = Number.isInteger(input.pn) && (input.pn as number) > 0 ? (input.pn as number) : 1;
  const ps = Number.isInteger(input.ps) && (input.ps as number) > 0 ? Math.min(input.ps as number, maxPs) : 10;
  return { pn, ps, offset: (pn - 1) * ps };
}
