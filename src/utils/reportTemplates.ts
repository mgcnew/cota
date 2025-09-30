import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { formatCurrency, formatDate, formatPercentage } from './reportData';
import type { EconomiaData, FornecedorData, ProdutoData, CotacaoData } from './reportData';

export interface ReportData {
  economiaData: EconomiaData;
  fornecedores: FornecedorData[];
  produtos: ProdutoData[];
  cotacoes: CotacaoData[];
}

export class PDFReportGenerator {
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

  private addHeader(titulo: string) {
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Sistema de Cotações', this.margin, this.currentY);
    
    this.currentY += 10;
    this.doc.setFontSize(16);
    this.doc.text(titulo, this.margin, this.currentY);
    
    this.currentY += 5;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Gerado em: ${formatDate(new Date())}`, this.margin, this.currentY);
    
    // Linha separadora
    this.currentY += 5;
    this.doc.line(this.margin, this.currentY, 190, this.currentY);
    this.currentY += 10;
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        105,
        this.pageHeight - 10,
        { align: 'center' }
      );
      this.doc.text(
        'Sistema de Cotações - Relatório Confidencial',
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  private checkPageBreak(height: number) {
    if (this.currentY + height > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addSection(titulo: string) {
    this.checkPageBreak(15);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(titulo, this.margin, this.currentY);
    this.currentY += 8;
  }

  private addTable(headers: string[], rows: string[][], startY?: number) {
    const tableStartY = startY || this.currentY;
    const colWidth = (170) / headers.length; // 170mm width divided by number of columns
    
    // Headers
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, tableStartY, 170, 8, 'F');
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      this.doc.text(header, this.margin + 2 + (index * colWidth), tableStartY + 5);
    });
    
    // Rows
    this.doc.setFont('helvetica', 'normal');
    let currentRowY = tableStartY + 8;
    
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(8);
      
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, currentRowY, 170, 6, 'F');
      }
      
      row.forEach((cell, colIndex) => {
        this.doc.text(
          cell.substring(0, 30), // Limit text length
          this.margin + 2 + (colIndex * colWidth),
          currentRowY + 4
        );
      });
      
      currentRowY += 6;
    });
    
    this.currentY = currentRowY + 5;
  }

  generateEconomiaReport(data: ReportData): void {
    this.addHeader('Relatório de Economia');
    
    // Resumo Executivo
    this.addSection('Resumo Executivo');
    this.doc.setFontSize(10);
    
    const resumoData = [
      ['Período:', data.economiaData.periodo],
      ['Economia Total:', formatCurrency(data.economiaData.economiaGerada)],
      ['Percentual de Economia:', formatPercentage(data.economiaData.economiaPercentual)],
      ['Cotações Realizadas:', data.economiaData.cotacoesRealizadas.toString()],
      ['Fornecedores Participantes:', data.economiaData.fornecedoresParticipantes.toString()],
      ['Produtos Cotados:', data.economiaData.produtosCotados.toString()]
    ];
    
    resumoData.forEach(([label, value]) => {
      this.doc.text(label, this.margin, this.currentY);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(value, this.margin + 60, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.currentY += 6;
    });
    
    this.currentY += 10;
    
    // Tabela de Cotações
    this.addSection('Detalhamento das Cotações');
    const cotacaoHeaders = ['ID', 'Produto', 'Fornecedor', 'Valor', 'Data', 'Economia'];
    const cotacaoRows = data.cotacoes.map(cotacao => [
      cotacao.id,
      cotacao.produto.substring(0, 25),
      cotacao.fornecedor.substring(0, 20),
      formatCurrency(cotacao.preco),
      cotacao.dataFechamento.toLocaleDateString('pt-BR'),
      formatCurrency(cotacao.economiaGerada)
    ]);
    
    this.addTable(cotacaoHeaders, cotacaoRows);
    
    this.addFooter();
  }

  generateFornecedoresReport(data: ReportData): void {
    this.addHeader('Relatório de Performance de Fornecedores');
    
    this.addSection('Análise de Performance');
    
    const fornecedorHeaders = ['Fornecedor', 'Cotações', 'Tempo Resp.', 'Preço Médio', 'Economia', 'Avaliação'];
    const fornecedorRows = data.fornecedores.map(fornecedor => [
      fornecedor.nome.substring(0, 25),
      fornecedor.cotacoesParticipadas.toString(),
      `${fornecedor.tempoMedioResposta}h`,
      formatCurrency(fornecedor.precoMedio),
      formatCurrency(fornecedor.economiaGerada),
      `${fornecedor.avaliacaoPerformance}/10`
    ]);
    
    this.addTable(fornecedorHeaders, fornecedorRows);
    
    this.addFooter();
  }

  generateProdutosReport(data: ReportData): void {
    this.addHeader('Relatório de Análise de Produtos');
    
    this.addSection('Histórico de Preços e Variações');
    
    const produtoHeaders = ['Produto', 'Categoria', 'Preço Atual', 'Preço Anterior', 'Variação', 'Melhor Preço'];
    const produtoRows = data.produtos.map(produto => [
      produto.nome.substring(0, 30),
      produto.categoria,
      formatCurrency(produto.precoAtual),
      formatCurrency(produto.precoAnterior),
      formatPercentage(produto.variacao),
      formatCurrency(produto.melhorPreco)
    ]);
    
    this.addTable(produtoHeaders, produtoRows);
    
    this.addFooter();
  }

  save(filename: string): void {
    this.doc.save(filename);
  }
}

export class ExcelReportGenerator {
  generateEconomiaReport(data: ReportData, filename: string): void {
    const workbook = XLSX.utils.book_new();
    
    // Aba Resumo
    const resumoData = [
      ['Relatório de Economia', ''],
      ['Gerado em:', formatDate(new Date())],
      ['', ''],
      ['Período:', data.economiaData.periodo],
      ['Economia Total:', data.economiaData.economiaGerada],
      ['Percentual de Economia:', data.economiaData.economiaPercentual],
      ['Cotações Realizadas:', data.economiaData.cotacoesRealizadas],
      ['Fornecedores Participantes:', data.economiaData.fornecedoresParticipantes],
      ['Produtos Cotados:', data.economiaData.produtosCotados]
    ];
    
    const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');
    
    // Aba Cotações
    const cotacaoData = [
      ['ID', 'Produto', 'Fornecedor', 'Preço', 'Data Abertura', 'Data Fechamento', 'Status', 'Economia Gerada'],
      ...data.cotacoes.map(cotacao => [
        cotacao.id,
        cotacao.produto,
        cotacao.fornecedor,
        cotacao.preco,
        cotacao.dataAbertura.toLocaleDateString('pt-BR'),
        cotacao.dataFechamento.toLocaleDateString('pt-BR'),
        cotacao.status,
        cotacao.economiaGerada
      ])
    ];
    
    const cotacaoSheet = XLSX.utils.aoa_to_sheet(cotacaoData);
    XLSX.utils.book_append_sheet(workbook, cotacaoSheet, 'Cotações');
    
    // Aba Fornecedores
    const fornecedorData = [
      ['Nome', 'Cotações Participadas', 'Tempo Médio Resposta (h)', 'Preço Médio', 'Economia Gerada', 'Avaliação', 'Status'],
      ...data.fornecedores.map(fornecedor => [
        fornecedor.nome,
        fornecedor.cotacoesParticipadas,
        fornecedor.tempoMedioResposta,
        fornecedor.precoMedio,
        fornecedor.economiaGerada,
        fornecedor.avaliacaoPerformance,
        fornecedor.statusAtivo ? 'Ativo' : 'Inativo'
      ])
    ];
    
    const fornecedorSheet = XLSX.utils.aoa_to_sheet(fornecedorData);
    XLSX.utils.book_append_sheet(workbook, fornecedorSheet, 'Fornecedores');
    
    // Aba Produtos
    const produtoData = [
      ['Nome', 'Categoria', 'Preço Atual', 'Preço Anterior', 'Variação (%)', 'Cotações', 'Fornecedores', 'Melhor Preço', 'Melhor Fornecedor'],
      ...data.produtos.map(produto => [
        produto.nome,
        produto.categoria,
        produto.precoAtual,
        produto.precoAnterior,
        produto.variacao,
        produto.cotacoesRealizadas,
        produto.fornecedoresCotaram,
        produto.melhorPreco,
        produto.melhorFornecedor
      ])
    ];
    
    const produtoSheet = XLSX.utils.aoa_to_sheet(produtoData);
    XLSX.utils.book_append_sheet(workbook, produtoSheet, 'Produtos');
    
    // Salvar arquivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  }
}

export const generateZipReport = async (data: ReportData, filename: string): Promise<void> => {
  // Para simplificar, vamos gerar cada relatório individualmente
  // Em uma implementação real, você usaria uma biblioteca como JSZip
  
  const pdfGen = new PDFReportGenerator();
  const excelGen = new ExcelReportGenerator();
  
  // Gerar relatório de economia
  pdfGen.generateEconomiaReport(data);
  pdfGen.save(`${filename}_economia.pdf`);
  
  // Aguardar um pouco para evitar conflitos
  setTimeout(() => {
    excelGen.generateEconomiaReport(data, `${filename}_economia.xlsx`);
  }, 500);
  
  // Gerar relatório de fornecedores
  setTimeout(() => {
    const pdfGen2 = new PDFReportGenerator();
    pdfGen2.generateFornecedoresReport(data);
    pdfGen2.save(`${filename}_fornecedores.pdf`);
  }, 1000);
  
  // Gerar relatório de produtos
  setTimeout(() => {
    const pdfGen3 = new PDFReportGenerator();
    pdfGen3.generateProdutosReport(data);
    pdfGen3.save(`${filename}_produtos.pdf`);
  }, 1500);
};