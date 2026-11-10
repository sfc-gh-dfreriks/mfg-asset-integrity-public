/** Shown when the selected SAP sources carry no IS-Oil data (BW or BDC), so wells, downtime and deferred production are empty. */
export default function IsOilNotice({ gaps }: { gaps?: { sourceSlot: string; sourceSystem: string; gapReason: string }[] }) {
  if (!gaps || gaps.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
      <b>IS-Oil coverage gap.</b> {gaps.map((g) => `${g.sourceSlot} (${g.sourceSystem}): ${g.gapReason}`).join(' ')} Deferred production and
      production at risk are shown only for instances read from ECC or S/4HANA.
    </div>
  );
}
