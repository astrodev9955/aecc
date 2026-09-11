import { MATERIALS } from '../data/materials'
import { applyLinePatch, formatCarbon, formatUsd, metricsFor } from '../lib/calc'
import { emptyLine } from '../lib/lines'
import type { LineItem, Unit } from '../types'
import { UNITS } from '../types'

export function LineEditor({
  lines,
  onChange,
}: {
  lines: LineItem[]
  onChange: (lines: LineItem[]) => void
}) {
  function update(id: string, patch: Partial<LineItem>) {
    onChange(lines.map((line) => (line.id === id ? applyLinePatch(line, patch) : line)))
  }

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Description</th>
            <th>Material</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Unit cost</th>
            <th>Mass (kg)</th>
            <th>Carbon</th>
            <th>Salvage</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const m = metricsFor(line)
            return (
              <tr key={line.id}>
                <td>
                  <input
                    value={line.description}
                    onChange={(e) => update(line.id, { description: e.target.value })}
                    aria-label="Line description"
                  />
                </td>
                <td>
                  <select
                    value={line.materialId}
                    onChange={(e) => update(line.id, { materialId: e.target.value })}
                    aria-label="Material"
                  >
                    {MATERIALS.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={line.quantity}
                    onChange={(e) => update(line.id, { quantity: Number(e.target.value) || 0 })}
                    aria-label="Quantity"
                  />
                </td>
                <td>
                  <select
                    value={line.unit}
                    onChange={(e) => update(line.id, { unit: e.target.value as Unit })}
                    aria-label="Unit"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={line.unitCost}
                    onChange={(e) => update(line.id, { unitCost: Number(e.target.value) || 0 })}
                    aria-label="Unit cost"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={Math.round(line.massKg * 100) / 100}
                    onChange={(e) => update(line.id, { massKg: Number(e.target.value) || 0 })}
                    aria-label="Mass in kilograms"
                  />
                </td>
                <td>{formatCarbon(m.carbonKg)}</td>
                <td>{formatUsd(m.salvageUsd)}</td>
                <td>
                  <button
                    type="button"
                    className="text-btn inline"
                    onClick={() => onChange(lines.filter((item) => item.id !== line.id))}
                    disabled={lines.length === 1}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <button type="button" className="text-btn add-line" onClick={() => onChange([...lines, emptyLine()])}>
        Add line
      </button>
    </div>
  )
}
