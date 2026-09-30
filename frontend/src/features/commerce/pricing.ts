import type { MessageKey } from "../../i18n/catalog";

// Modelo de negocio. B2C: paquete de pago unico segun el tamano de la protesis,
// con un mes de seguimiento gratis y despues una mensualidad. B2B: cobro por
// pulgada escaneada con la plataforma.
export type PackageId = "small" | "medium" | "large";

export interface ProsthesisPackage {
  id: PackageId;
  price: number;
  name: MessageKey;
  examples: MessageKey;
  featured?: boolean;
}

export const PACKAGES: ProsthesisPackage[] = [
  {
    id: "small",
    price: 3000,
    name: "Pricing.pequena",
    examples: "Pricing.pequena_ejemplos",
  },
  {
    id: "medium",
    price: 6000,
    name: "Pricing.mediana",
    examples: "Pricing.mediana_ejemplos",
    featured: true,
  },
  {
    id: "large",
    price: 12000,
    name: "Pricing.grande",
    examples: "Pricing.grande_ejemplos",
  },
];

export const PACKAGE_INCLUDES: MessageKey[] = [
  "Pricing.incluye_escaneo",
  "Pricing.incluye_diseno",
  "Pricing.incluye_fabricacion",
  "Pricing.incluye_mes_gratis",
];

export const FOLLOW_UP_MONTHLY = 500;
export const FREE_FOLLOW_UP_MONTHS = 1;
export const SCAN_PRICE_PER_INCH = 300;

export const packageById = (id: PackageId) =>
  PACKAGES.find((item) => item.id === id)!;

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
export const formatMXN = (amount: number) => currency.format(amount);
