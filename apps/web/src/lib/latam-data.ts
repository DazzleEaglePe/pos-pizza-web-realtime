/**
 * LATAM countries data: flags, phone codes, currencies.
 * Single source of truth for currency selectors and phone inputs.
 */

export type LatamCountry = {
  /** ISO 3166-1 alpha-2 */
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
};

export const LATAM_COUNTRIES: LatamCountry[] = [
  { code: "PE", name: "Perú", flag: "🇵🇪", phoneCode: "+51", currencyCode: "PEN", currencyName: "Soles", currencySymbol: "S/" },
  { code: "MX", name: "México", flag: "🇲🇽", phoneCode: "+52", currencyCode: "MXN", currencyName: "Pesos Mexicanos", currencySymbol: "$" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", phoneCode: "+57", currencyCode: "COP", currencyName: "Pesos Colombianos", currencySymbol: "$" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", phoneCode: "+54", currencyCode: "ARS", currencyName: "Pesos Argentinos", currencySymbol: "$" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phoneCode: "+56", currencyCode: "CLP", currencyName: "Pesos Chilenos", currencySymbol: "$" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", phoneCode: "+593", currencyCode: "USD", currencyName: "Dólar Estadounidense", currencySymbol: "$" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", phoneCode: "+591", currencyCode: "BOB", currencyName: "Bolivianos", currencySymbol: "Bs" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", phoneCode: "+595", currencyCode: "PYG", currencyName: "Guaraníes", currencySymbol: "₲" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", phoneCode: "+598", currencyCode: "UYU", currencyName: "Pesos Uruguayos", currencySymbol: "$U" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", phoneCode: "+58", currencyCode: "VES", currencyName: "Bolívares", currencySymbol: "Bs.S" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", phoneCode: "+55", currencyCode: "BRL", currencyName: "Reales", currencySymbol: "R$" },
  { code: "PA", name: "Panamá", flag: "🇵🇦", phoneCode: "+507", currencyCode: "PAB", currencyName: "Balboas", currencySymbol: "B/." },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", phoneCode: "+506", currencyCode: "CRC", currencyName: "Colones", currencySymbol: "₡" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", phoneCode: "+502", currencyCode: "GTQ", currencyName: "Quetzales", currencySymbol: "Q" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", phoneCode: "+504", currencyCode: "HNL", currencyName: "Lempiras", currencySymbol: "L" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", phoneCode: "+503", currencyCode: "USD", currencyName: "Dólar Estadounidense", currencySymbol: "$" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", phoneCode: "+505", currencyCode: "NIO", currencyName: "Córdobas", currencySymbol: "C$" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", phoneCode: "+53", currencyCode: "CUP", currencyName: "Pesos Cubanos", currencySymbol: "$" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴", phoneCode: "+1-809", currencyCode: "DOP", currencyName: "Pesos Dominicanos", currencySymbol: "RD$" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷", phoneCode: "+1-787", currencyCode: "USD", currencyName: "Dólar Estadounidense", currencySymbol: "$" },
  { code: "HT", name: "Haití", flag: "🇭🇹", phoneCode: "+509", currencyCode: "HTG", currencyName: "Gourdes", currencySymbol: "G" },
];

/** Unique currencies (deduplicated by currencyCode) */
export const LATAM_CURRENCIES = LATAM_COUNTRIES.reduce<
  { code: string; name: string; symbol: string; flag: string; country: string }[]
>((acc, c) => {
  if (!acc.some((x) => x.code === c.currencyCode)) {
    acc.push({
      code: c.currencyCode,
      name: c.currencyName,
      symbol: c.currencySymbol,
      flag: c.flag,
      country: c.name,
    });
  }
  return acc;
}, []);

/** Quick lookup: ISO currency code → symbol */
const symbolMap = new Map(LATAM_COUNTRIES.map((c) => [c.currencyCode, c.currencySymbol]));

export function getCurrencySymbol(code: string): string {
  return symbolMap.get(code.toUpperCase()) ?? code;
}

/** Quick lookup: ISO currency code → human-readable currency name */
const nameMap = new Map(LATAM_COUNTRIES.map((c) => [c.currencyCode, c.currencyName]));

export function getCurrencyName(code: string): string {
  return nameMap.get(code.toUpperCase()) ?? code;
}

/** Finds country by phone code prefix (best match) */
export function findCountryByPhone(phone: string): LatamCountry | undefined {
  const cleaned = phone.replace(/\s/g, "");
  return LATAM_COUNTRIES.find((c) => cleaned.startsWith(c.phoneCode.replace("-", "")));
}

/** Finds country by currency code */
export function findCountryByCurrency(currencyCode: string): LatamCountry | undefined {
  return LATAM_COUNTRIES.find((c) => c.currencyCode === currencyCode.toUpperCase());
}
