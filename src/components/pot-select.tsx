import { Select } from "@/components/forms";

export function PotSelect({
  pots,
  name,
  defaultValue,
  allowEmpty = false,
  className,
}: {
  pots: Array<{ id: string; name: string }>;
  name: string;
  defaultValue?: string | null;
  allowEmpty?: boolean;
  className?: string;
}) {
  const current = defaultValue && pots.some((pot) => pot.id === defaultValue) ? defaultValue : allowEmpty ? "" : pots[0]?.id ?? "";
  return (
    <Select name={name} defaultValue={current} className={className}>
      {allowEmpty ? <option value="">Belum dipilih</option> : null}
      {pots.map((pot) => (
        <option key={pot.id} value={pot.id}>
          {pot.name}
        </option>
      ))}
    </Select>
  );
}
