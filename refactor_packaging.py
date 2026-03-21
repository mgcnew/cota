import re
import os

file_path = "c:/Users/mgcin/OneDrive/Documentos/antigravity/cota/src/components/compras/embalagens/AddPackagingQuoteDialog.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update imports
content = content.replace(
    'ChevronRight, ChevronLeft, Check, FileText, Search, X, Clock',
    'ChevronRight, ChevronLeft, Check, FileText, Search, X, Clock, Settings2, ChevronsUpDown'
)
content = content.replace(
    'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";',
    'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";'
)

# Replace STEPS
content = re.sub(
    r'const STEPS = \[.*?\];',
    '''const STEPS = [
  { id: "embalagens", title: "Embalagens", icon: Package },
  { id: "configuracao", title: "Configuração", icon: Settings2 },
];''',
    content,
    flags=re.DOTALL
)

# Replace initial state and canProceed
content = content.replace('activeStep === "periodo_fornecedores"', 'activeStep === "configuracao"')
content = content.replace('activeStep: "periodo_fornecedores"', 'activeStep: "configuracao"')
content = content.replace('case "periodo_fornecedores": return selectedSuppliers.length > 0 && dataInicio && dataFim && dataFim > dataInicio;', 'case "configuracao": return selectedSuppliers.length > 0 && dataInicio && dataFim && dataFim > dataInicio && selectedItems.length > 0;')
content = content.replace('else if (activeStep === "periodo_fornecedores") supplierSearchRef.current?.focus();', 'else if (activeStep === "configuracao") { /* nothing to focus */ }')

# Now, we find the entire sections for "periodo_fornecedores" and "confirmar" and replace them with the new "configuracao" section.
start_marker = '{/* Step: Período & Fornecedores */}'
end_marker = '      </div>\n    </>\n  );'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_configuracao = '''{/* Step: Configuração (Merge Period, Suppliers and Confirmation) */}
        {activeStep === "configuracao" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 h-full content-start pb-20">
              
              {/* Coluna Esquerda: Configurações Gerais */}
              <div className="space-y-6">
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-visible relative z-30">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span>Período & Detalhes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Início</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-medium h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                              {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-gray-200 dark:border-gray-700 z-[100]" align="start">
                            <Calendar mode="single" selected={dataInicio} onSelect={(d) => d && setDataInicio(d)} locale={ptBR} />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Fim</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-medium h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800", dataFim <= dataInicio && "border-red-300 text-red-600 bg-red-50")}>
                              <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                              {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-gray-200 dark:border-gray-700 z-[100]" align="start">
                            <Calendar mode="single" selected={dataFim} onSelect={(d) => d && setDataFim(d)} locale={ptBR} disabled={(d) => d <= dataInicio} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Observações (opcional)</Label>
                      <Textarea placeholder="Instruções para os fornecedores..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} onFocus={handleInputFocus} rows={3} className="resize-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm focus:ring-gray-400/20" />
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo de Embalagens Selecionadas */}
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden relative z-10 w-full">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                      <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Package className="h-4 w-4 text-gray-500" />
                        Itens Selecionados
                      </span>
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">{selectedItems.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 p-4">
                     <ScrollArea className="h-[150px] pr-2">
                      <div className="flex flex-col gap-2">
                        {selectedItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                          </div>
                        ))}
                      </div>
                     </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna Direita: Fornecedores */}
              <div className="space-y-6 relative overflow-visible z-40">
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-visible h-full flex flex-col">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-t-xl flex-shrink-0">
                    <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                      <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Fornecedores
                      </span>
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">{selectedSuppliers.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4 flex-1 flex flex-col min-h-[300px]">
                    {/* Popover Selection for Suppliers (Prevents huge scroll) */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 h-10 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 text-xs text-gray-700 dark:text-gray-300">
                           <span><Building2 className="inline-block w-3.5 h-3.5 mr-2" /> {selectedSuppliers.length === 0 ? "Adicionar fornecedores..." : `${selectedSuppliers.length} convidados`}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] sm:w-[350px] p-0 border-gray-200 dark:border-gray-800 shadow-xl rounded-xl z-[100]" sideOffset={8}>
                        <Command className="bg-white dark:bg-gray-950">
                          <CommandInput placeholder="Buscar fornecedor..." className="h-10 text-xs" />
                          <CommandList className="max-h-[250px] custom-scrollbar">
                            <CommandEmpty className="py-4 text-center text-xs text-gray-500 font-medium">Nenhum fornecedor encontrado.</CommandEmpty>
                            <CommandGroup>
                              {suppliers.map(supplier => (
                                <CommandItem key={supplier.id} value={supplier.name} onSelect={() => toggleSupplier(supplier.id)} className="cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-white">
                                  <div className="flex items-center gap-2 w-full">
                                    <div className={cn("flex h-4 w-4 items-center justify-center rounded border", selectedSuppliers.includes(supplier.id) ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900" : "border-gray-300 dark:border-gray-600 opacity-50")}>
                                      {selectedSuppliers.includes(supplier.id) && <Check className="h-3 w-3" />}
                                    </div>
                                    <span className="truncate">{supplier.name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Selected Suppliers List */}
                    <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 flex-1 overflow-y-auto custom-scrollbar">
                      {selectedSuppliers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-10 opacity-50">
                          <Building2 className="h-8 w-8 mb-2" />
                          <p className="text-[11px] font-bold text-center">Clique acima para convidar fornecedores</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {selectedSuppliersData.map(supplier => (
                            <div key={supplier.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md group hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="h-3 w-3 text-gray-500" />
                                </div>
                                <span className="text-xs font-bold truncate text-gray-700 dark:text-gray-300">{supplier.name}</span>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => toggleSupplier(supplier.id)} className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end pt-4 absolute -bottom-12 right-0">
                  <div className="text-center sm:text-right hidden sm:block w-full">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <kbd className="font-sans text-xs bg-white dark:bg-gray-700 px-1 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-600">Ctrl</kbd> + <kbd className="font-sans text-xs bg-white dark:bg-gray-700 px-1 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-600">Enter</kbd> para criar cotação
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
'''

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_configuracao + content[end_idx:] # type: ignore
else:
    print("Could not find blocks to replace!")
    exit(1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully.")
