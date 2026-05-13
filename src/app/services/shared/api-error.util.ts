export function getApiErrorMessage(error: any, fallback = 'Ocurrió un error inesperado'): string {
  return error?.error?.message || error?.message || fallback;
}
