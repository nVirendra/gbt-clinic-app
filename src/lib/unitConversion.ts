export const ALL_UNIT_OPTIONS = [
  'Tablet',
  'Capsule',
  'Strip',
  'Box',
  'Bottle',
  'Piece',
  'Vial',
  'Ampoule',
  'Tube',
  'Sachet',
  'Pack',
  'ml',
  'mg',
  'gm',
  'Dose',
  'Other'
] as const;

export interface MedicineUnitConfig {
  unit_label?: string | null;
  base_unit?: string | null;
  inner_unit?: string | null;
  units_per_inner?: number | null;
  purchase_unit?: string | null;
  inner_units_per_purchase?: number | null;
  type?: string | null;
}

/**
 * Returns unit conversion multiplier to convert a specified unit quantity into base units.
 */
export function getUnitConversionFactor(medicine: MedicineUnitConfig, unit?: string | null): number {
  if (!unit || !unit.trim()) return 1.0;

  const targetUnit = unit.trim().toLowerCase();
  const baseUnit = (medicine.base_unit || medicine.unit_label || 'Piece').trim().toLowerCase();
  const innerUnit = medicine.inner_unit ? medicine.inner_unit.trim().toLowerCase() : null;
  const purchaseUnit = medicine.purchase_unit ? medicine.purchase_unit.trim().toLowerCase() : null;

  const unitsPerInner = medicine.units_per_inner && medicine.units_per_inner > 0 ? medicine.units_per_inner : 1.0;
  const innerUnitsPerPurchase = medicine.inner_units_per_purchase && medicine.inner_units_per_purchase > 0 ? medicine.inner_units_per_purchase : 1.0;

  if (purchaseUnit && targetUnit === purchaseUnit) {
    if (innerUnit && innerUnit !== baseUnit) {
      return innerUnitsPerPurchase * unitsPerInner;
    }
    return innerUnitsPerPurchase;
  }

  if (innerUnit && targetUnit === innerUnit) {
    return unitsPerInner;
  }

  if (targetUnit === baseUnit) {
    return 1.0;
  }

  const legacyLabel = medicine.unit_label ? medicine.unit_label.trim().toLowerCase() : null;
  if (legacyLabel && targetUnit === legacyLabel) {
    if (purchaseUnit && legacyLabel === purchaseUnit) {
      return innerUnit && innerUnit !== baseUnit ? innerUnitsPerPurchase * unitsPerInner : innerUnitsPerPurchase;
    }
    if (innerUnit && legacyLabel === innerUnit) {
      return unitsPerInner;
    }
  }

  return 1.0;
}

/**
 * Converts a quantity from a specified unit into base quantity.
 */
export function convertToBaseQuantity(medicine: MedicineUnitConfig, qty: number, unit?: string | null): number {
  const factor = getUnitConversionFactor(medicine, unit);
  return qty * factor;
}

/**
 * Formats a total base quantity into multi-tiered unit string (e.g. "2 Boxes, 5 Strips, 8 Tablets").
 */
export function formatStockBreakdown(medicine: MedicineUnitConfig, totalBaseQty: number): {
  text: string;
  breakdown: string;
  baseQty: number;
  baseUnit: string;
} {
  const baseUnit = medicine.base_unit || medicine.unit_label || 'Piece';
  const innerUnit = medicine.inner_unit;
  const purchaseUnit = medicine.purchase_unit;

  const unitsPerInner = medicine.units_per_inner && medicine.units_per_inner > 0 ? medicine.units_per_inner : 1.0;
  const innerUnitsPerPurchase = medicine.inner_units_per_purchase && medicine.inner_units_per_purchase > 0 ? medicine.inner_units_per_purchase : 1.0;

  const purchaseUnitFactor = purchaseUnit ? (innerUnit && innerUnit !== baseUnit ? innerUnitsPerPurchase * unitsPerInner : innerUnitsPerPurchase) : 0;
  const innerUnitFactor = innerUnit && innerUnit !== baseUnit ? unitsPerInner : 0;

  let remaining = Math.max(0, totalBaseQty);
  const parts: string[] = [];

  if (purchaseUnit && purchaseUnitFactor > 1 && remaining >= purchaseUnitFactor) {
    const count = Math.floor(remaining / purchaseUnitFactor);
    remaining = remaining % purchaseUnitFactor;
    parts.push(`${count} ${count === 1 ? purchaseUnit : purchaseUnit + 's'}`);
  }

  if (innerUnit && innerUnitFactor > 1 && remaining >= innerUnitFactor) {
    const count = Math.floor(remaining / innerUnitFactor);
    remaining = remaining % innerUnitFactor;
    parts.push(`${count} ${count === 1 ? innerUnit : innerUnit + 's'}`);
  }

  if (remaining > 0 || parts.length === 0) {
    const formattedRem = Number.isInteger(remaining) ? remaining.toString() : remaining.toFixed(2);
    parts.push(`${formattedRem} ${remaining === 1 ? baseUnit : baseUnit + 's'}`);
  }

  const breakdownStr = parts.join(', ');
  const mainText = `${totalBaseQty} ${totalBaseQty === 1 ? baseUnit : baseUnit + 's'}`;

  return {
    text: mainText,
    breakdown: breakdownStr,
    baseQty: totalBaseQty,
    baseUnit,
  };
}

/**
 * Returns available units for a medicine (Purchase Unit, Inner Unit, Base Unit, + fallbacks).
 */
export function getAvailableUnitsForMedicine(medicine?: MedicineUnitConfig | null): string[] {
  if (!medicine) return [...ALL_UNIT_OPTIONS];

  const units: string[] = [];

  if (medicine.purchase_unit && medicine.purchase_unit.trim()) {
    units.push(medicine.purchase_unit.trim());
  }

  if (medicine.inner_unit && medicine.inner_unit.trim() && !units.some(u => u.toLowerCase() === medicine.inner_unit!.trim().toLowerCase())) {
    units.push(medicine.inner_unit.trim());
  }

  const baseUnit = medicine.base_unit || medicine.unit_label || 'Piece';
  if (baseUnit && !units.some(u => u.toLowerCase() === baseUnit.trim().toLowerCase())) {
    units.push(baseUnit.trim());
  }

  // Include ALL_UNIT_OPTIONS so user can pick any unit if needed
  ALL_UNIT_OPTIONS.forEach(opt => {
    if (!units.some(u => u.toLowerCase() === opt.toLowerCase())) {
      units.push(opt);
    }
  });

  return units;
}

/**
 * Returns live conversion summary string (e.g. "1 Box = 10 Strips = 100 Tablets").
 */
export function getLiveConversionSummary(config: MedicineUnitConfig): string {
  const base = config.base_unit || config.unit_label || 'Piece';
  const inner = config.inner_unit;
  const purchase = config.purchase_unit;

  const unitsPerInner = config.units_per_inner && config.units_per_inner > 0 ? config.units_per_inner : 1.0;
  const innerUnitsPerPurchase = config.inner_units_per_purchase && config.inner_units_per_purchase > 0 ? config.inner_units_per_purchase : 1.0;

  const parts: string[] = [];

  if (purchase && purchase.trim()) {
    parts.push(`1 ${purchase}`);
  }

  if (inner && inner.trim() && inner.toLowerCase() !== base.toLowerCase()) {
    if (purchase && purchase.trim()) {
      parts.push(`${innerUnitsPerPurchase} ${innerUnitsPerPurchase === 1 ? inner : inner + 's'}`);
    } else {
      parts.push(`1 ${inner}`);
    }
    const totalBase = (purchase && purchase.trim() ? innerUnitsPerPurchase * unitsPerInner : unitsPerInner);
    parts.push(`${totalBase} ${totalBase === 1 ? base : base + 's'}`);
  } else if (purchase && purchase.trim()) {
    parts.push(`${innerUnitsPerPurchase} ${innerUnitsPerPurchase === 1 ? base : base + 's'}`);
  } else {
    parts.push(`1 ${base}`);
  }

  return parts.join(' = ');
}
