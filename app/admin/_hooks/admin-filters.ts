export function normalizeAdminKeyword(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeOptionalFilterValue(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function matchesTextFilter(
  value: string | null | undefined,
  filter: string | null | undefined,
) {
  const normalizedFilter = normalizeAdminKeyword(filter);

  return (
    !normalizedFilter || normalizeAdminKeyword(value).includes(normalizedFilter)
  );
}

export function matchesAnyTextFilter(
  values: Array<string | null | undefined>,
  filter: string | null | undefined,
) {
  const normalizedFilter = normalizeAdminKeyword(filter);

  return (
    !normalizedFilter ||
    values.some((value) =>
      normalizeAdminKeyword(value).includes(normalizedFilter),
    )
  );
}

export function normalizeDateRangeFilters<
  T extends Record<string, string | undefined>,
>(filters: T, startKey: keyof T, endKey: keyof T) {
  const nextFilters = {
    ...filters,
  };
  const startValue = nextFilters[startKey];
  const endValue = nextFilters[endKey];

  if (
    typeof startValue === "string" &&
    typeof endValue === "string" &&
    startValue &&
    endValue &&
    startValue > endValue
  ) {
    nextFilters[startKey] = endValue;
    nextFilters[endKey] = startValue;
  }

  return nextFilters;
}

export function hasActiveFilterValues(filters: Record<string, unknown>) {
  return Object.values(filters).some(Boolean);
}
