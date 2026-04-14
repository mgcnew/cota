import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StockCount, StockCountItem } from "@/hooks/useStockCounts";
import { StockSector } from "@/hooks/useStockSectors";

const CLIENT_RAZAO_SOCIAL = "Novo Boi Dias Mercadão Ltda";
const CLIENT_CNPJ = "63.195.471/0001-12";

export class InventoryPDFGenerator {
  private doc: jsPDF;
  private currentY: number;
  private pageHeight: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF();
    this.currentY = 20;
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
  }

  private addHeader(date: Date) {
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Fechamento de Estoque Consolidado", this.margin, this.currentY);

    this.currentY += 8;
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(CLIENT_RAZAO_SOCIAL, this.margin, this.currentY);
    
    this.currentY += 6;
    this.doc.setFontSize(10);
    this.doc.text(`CNPJ: ${CLIENT_CNPJ}`, this.margin, this.currentY);

    this.currentY += 6;
    const formattedDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    this.doc.text(`Data Base: ${formattedDate}`, this.margin, this.currentY);
    this.doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 140, this.currentY);

    // Separator line
    this.currentY += 5;
    this.doc.line(this.margin, this.currentY, 190, this.currentY);
    this.currentY += 10;
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        105,
        this.pageHeight - 10,
        { align: "center" }
      );
    }
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addSectorSection(sectorName: string, items: StockCountItem[], isMonthlyBalance: boolean) {
    this.checkPageBreak(15);
    
    // Sector Title
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(this.margin, this.currentY - 5, 170, 10, "F");
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(`Setor: ${sectorName}`, this.margin + 2, this.currentY + 2);
    
    if (isMonthlyBalance) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(0, 100, 0);
      this.doc.text("(Balanço Mensal)", 150, this.currentY + 2);
      this.doc.setTextColor(0, 0, 0);
    }

    this.currentY += 12;

    if (!items || items.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "italic");
      this.doc.text("Nenhum item registrado para este setor.", this.margin + 5, this.currentY);
      this.currentY += 10;
      return;
    }

    // Table Headers
    const startY = this.currentY;
    this.doc.setFillColor(220, 220, 220);
    this.doc.rect(this.margin, startY, 170, 8, "F");
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    
    this.doc.text("Produto", this.margin + 2, startY + 5);
    this.doc.text("Quantidade Contada", 120, startY + 5);
    this.doc.text("Unidade", 160, startY + 5);
    
    this.doc.setFont("helvetica", "normal");
    let currentRowY = startY + 8;
    
    items.forEach((item, index) => {
      this.checkPageBreak(8);

      // Reset positions if page broke
      if (this.currentY === this.margin) {
        currentRowY = this.margin;
        
        // Re-draw headers on new page
        this.doc.setFillColor(220, 220, 220);
        this.doc.rect(this.margin, currentRowY, 170, 8, "F");
        this.doc.setFontSize(9);
        this.doc.setFont("helvetica", "bold");
        this.doc.text("Produto", this.margin + 2, currentRowY + 5);
        this.doc.text("Quantidade Contada", 120, currentRowY + 5);
        this.doc.text("Unidade", 160, currentRowY + 5);
        this.doc.setFont("helvetica", "normal");
        
        currentRowY += 8;
      }

      if (index % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, currentRowY, 170, 6, "F");
      }

      const prodName = item.product_name || "Desconhecido";
      const quantity = item.quantity_counted?.toString() || "0";
      const unit = item.unit || "un";

      // Product Name (Truncated if too long)
      const truncatedName = prodName.length > 50 ? prodName.substring(0, 47) + "..." : prodName;

      this.doc.text(truncatedName, this.margin + 2, currentRowY + 4);
      this.doc.text(quantity, 120, currentRowY + 4);
      this.doc.text(unit, 160, currentRowY + 4);
      
      currentRowY += 6;
    });

    this.currentY = currentRowY + 10;
  }

  generateConsolidatedReport(
    date: Date,
    countsBySector: { 
      sectorName: string; 
      items: StockCountItem[]; 
      isMonthlyBalance: boolean 
    }[]
  ): void {
    this.addHeader(date);
    
    countsBySector.forEach(({ sectorName, items, isMonthlyBalance }) => {
      this.addSectorSection(sectorName, items, isMonthlyBalance);
    });

    this.addFooter();
  }

  save(filename: string): void {
    this.doc.save(filename);
  }
}

/**
 * Organizes multiple stock counts into grouped sectors for reporting.
 */
export const groupItemsBySector = (counts: StockCount[], items: StockCountItem[], sectors: StockSector[]) => {
  // Map sector UUID to sector name for quick lookup
  const sectorMap = new Map<string, string>();
  sectors.forEach((s) => {
    sectorMap.set(s.id, s.name);
  });

  const grouped: Record<string, { sectorName: string; isMonthlyBalance: boolean; items: StockCountItem[] }> = {};

  counts.forEach((count) => {
    // Only include finalized counts generally, though caller handles the filter.
    if (count.status !== "finalizada") return;

    let sectorName = "Geral / Não Categorizado";
    if (count.inventory_sector && sectorMap.has(count.inventory_sector)) {
      sectorName = sectorMap.get(count.inventory_sector)!;
    }

    const countItems = items.filter((i) => i.stock_count_id === count.id);
    if (!grouped[sectorName]) {
      grouped[sectorName] = {
        sectorName,
        isMonthlyBalance: !!count.is_monthly_balance,
        items: [],
      };
    } else {
      // If any count in this sector is monthly balance, mark the whole sector as such
      grouped[sectorName].isMonthlyBalance = grouped[sectorName].isMonthlyBalance || !!count.is_monthly_balance;
    }

    // Combine items. If same product & unit, we sum them
    countItems.forEach(ci => {
      const existingItem = grouped[sectorName].items.find(
        (i) => i.product_id === ci.product_id && i.unit === ci.unit
      );
      if (existingItem) {
        existingItem.quantity_counted = (existingItem.quantity_counted || 0) + (ci.quantity_counted || 0);
      } else {
        // Deep copy so we don't mutate the original state
        grouped[sectorName].items.push({ ...ci });
      }
    });
  });

  // Convert to array and sort by sector name
  return Object.values(grouped).sort((a, b) => a.sectorName.localeCompare(b.sectorName));
};

/**
 * Generates a WhatsApp/Email plain text version of the consolidated report
 */
export const generateConsolidatedTextReport = (
  date: Date,
  countsBySector: { 
    sectorName: string; 
    items: StockCountItem[]; 
    isMonthlyBalance: boolean 
  }[]
): string => {
  const formattedDate = format(date, "dd/MM/yyyy");
  let message = `*FECHAMENTO DE ESTOQUE CONSOLIDADO*\n`;
  message += `${CLIENT_RAZAO_SOCIAL}\n`;
  message += `CNPJ: ${CLIENT_CNPJ}\n`;
  message += `Data Base: ${formattedDate}\n\n`;

  let totalItems = 0;

  countsBySector.forEach(({ sectorName, items, isMonthlyBalance }) => {
    message += `*--- SETOR: ${sectorName.toUpperCase()} ---*\n`;
    if (isMonthlyBalance) {
      message += `_(Balanço Mensal)_\n`;
    }
    
    if (items.length === 0) {
      message += `Nenhum item.\n\n`;
      return;
    }

    items.forEach((item) => {
      const prodName = item.product_name || "Desconhecido";
      const qtd = item.quantity_counted || 0;
      const unit = item.unit || "un";
      message += `🔹 ${prodName}\n`;
      message += `   Qtd: ${qtd} ${unit}\n`;
      totalItems += 1;
    });
    
    message += `\n`;
  });

  message += `*Resumo*\n`;
  message += `Total de produtos variados avaliados: ${totalItems}\n`;
  message += `\nGerado via CotaFlow (c) ${new Date().getFullYear()}`;
  return message;
};
