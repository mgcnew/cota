/**
 * Utilitário para exportação de dados em CSV
 */

interface ExportOptions {
  filename: string;
  headers: string[];
  data: (string | number | null | undefined)[][];
}

/**
 * Exporta dados para um arquivo CSV
 */
export function exportToCSV({ filename, headers, data }: ExportOptions): void {
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      row.map(cell => {
        const value = cell?.toString() ?? "";
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Formata data para exibição
 */
export function formatDateForExport(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrencyForExport(value: number | null | undefined): string {
  if (value == null) return "";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
