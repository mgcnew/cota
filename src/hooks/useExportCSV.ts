import { useCallback } from 'react';

interface ExportCSVOptions {
  filename: string;
  data: Record<string, any>[];
  columns?: Record<string, string>;
}

export function useExportCSV() {
  const exportToCSV = useCallback(({ filename, data, columns }: ExportCSVOptions) => {
    if (!data || data.length === 0) {
      console.warn('Nenhum dado para exportar');
      return;
    }

    const columnMapping = columns || Object.keys(data[0]).reduce((acc, key) => {
      acc[key] = key;
      return acc;
    }, {} as Record<string, string>);

    const headers = Object.values(columnMapping);
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        Object.keys(columnMapping).map(key => {
          const value = item[key] ?? '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return { exportToCSV };
}
