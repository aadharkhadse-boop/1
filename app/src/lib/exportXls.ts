function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function download(html: string, filename: string) {
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function table(head: string[], rowsHtml: string[]): string {
  return (
    '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">' +
    '<tr style="background:#003143;color:#fff;font-weight:bold">' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr>' +
    rowsHtml.join('') +
    '</table></body></html>'
  );
}

export interface DashboardExportRow {
  imo: string; vessel: string; owner: string; ep: number | null; condition: string;
  dev6m: number | null; devAct: number | null; dd: number | null; hc: number | null; stw: number | null; age: number | null;
}

export function exportXls(rows: DashboardExportRow[], filename: string) {
  const head = ['IMO', 'Vessel', 'Owner', 'ME excess power (%)', 'Condition', 'Δ over 6 months (%)', 'Δ since hull activity (%)', 'Since dry dock (mo)', 'Since hull clean (mo)', 'Hindcast-log STW (kn)', 'Age (yr)'];
  const rowsHtml = rows.map((r) => (
    '<tr><td>' + esc(r.imo) + '</td><td>' + esc(r.vessel) + '</td><td>' + esc(r.owner) + '</td><td>' + (r.ep == null ? '' : r.ep.toFixed(1)) + '</td><td>' + esc(r.condition) + '</td><td>' + (r.dev6m == null ? 'N/A' : r.dev6m) + '</td><td>' + (r.devAct == null ? 'N/A' : r.devAct) + '</td><td>' + (r.dd == null ? '' : r.dd) + '</td><td>' + (r.hc == null ? '' : r.hc) + '</td><td>' + (r.stw == null ? '' : r.stw) + '</td><td>' + (r.age == null ? '' : r.age) + '</td></tr>'
  ));
  download(table(head, rowsHtml), filename + '.xls');
}

export interface ListExportRow {
  imo: string; vessel: string; owner: string; conditionLabel: string; ep: number | null; epDev: number | null; stwDev: number | null; actionYes: boolean;
}

export function exportList(rows: ListExportRow[], filename: string) {
  const head = ['IMO', 'Vessel', 'Owner', 'Condition', 'ME excess power (%)', 'Deviation of excess power (%)', 'Hindcast − log STW (kn)', 'Action required'];
  const rowsHtml = rows.map((c) => (
    '<tr><td>' + esc(c.imo) + '</td><td>' + esc(c.vessel) + '</td><td>' + esc(c.owner) + '</td><td>' + esc(c.conditionLabel) + '</td><td>' + (c.ep == null ? '' : c.ep.toFixed(1)) + '</td><td>' + (c.epDev == null ? 'N/A' : c.epDev) + '</td><td>' + (c.stwDev == null ? 'N/A' : c.stwDev) + '</td><td>' + (c.actionYes ? 'Yes' : 'Keep monitoring') + '</td></tr>'
  ));
  download(table(head, rowsHtml), filename + '.xls');
}

export interface SaExportRow {
  imo: string; vessel: string; owner: string; level: string; meSfoc: string; meDev: string; scoc: string; auxDev: string; boiler: string;
}

export function exportSaList(rows: SaExportRow[], filename: string) {
  const head = ['IMO', 'Vessel', 'Owner', 'Level', 'ME SFOC (g/kWh)', 'ME SFOC deviation (g/kWh)', 'ME SCOC (g/kWh)', 'Aux GE SFOC deviation (g/kWh)', 'Boiler excess (t)'];
  const rowsHtml = rows.map((r) => (
    '<tr><td>' + esc(r.imo) + '</td><td>' + esc(r.vessel) + '</td><td>' + esc(r.owner) + '</td><td>' + esc(r.level) + '</td><td>' + esc(r.meSfoc) + '</td><td>' + esc(r.meDev) + '</td><td>' + esc(r.scoc) + '</td><td>' + esc(r.auxDev) + '</td><td>' + esc(r.boiler) + '</td></tr>'
  ));
  download(table(head, rowsHtml), filename + '.xls');
}

export interface EngListExportRow {
  imo: string; vessel: string; owner: string; cond: string; me: string; ax: string; bo: string;
}

export function exportEngList(rows: EngListExportRow[], filename: string) {
  const head = ['IMO', 'Vessel', 'Owner', 'Condition', 'ME SFOC deviation (g/kWh)', 'Aux GE SFOC deviation (g/kWh)', 'Boiler excess (t)'];
  const rowsHtml = rows.map((r) => (
    '<tr><td>' + esc(r.imo) + '</td><td>' + esc(r.vessel) + '</td><td>' + esc(r.owner) + '</td><td>' + esc(r.cond) + '</td><td>' + esc(r.me) + '</td><td>' + esc(r.ax) + '</td><td>' + esc(r.bo) + '</td></tr>'
  ));
  download(table(head, rowsHtml), filename + '.xls');
}
