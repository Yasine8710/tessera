/** Text alternative for a chart: the same numbers in a table. */
export function ChartTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer rounded-sm py-1 font-medium text-accent">View as table</summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-md border border-line">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 border-b border-line bg-surface2 text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className="px-3 py-1.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j} className="px-3 py-1.5 tabular-nums">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
