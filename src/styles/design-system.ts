/**
 * CotaJá Design System
 * SISTEMA COMPLETO: Premium Minimalista & Neon Accent (#83E509)
 * 
 * Abrangência: TODO o sistema (Sidebar, Modais, Cards, Tabelas, etc.)
 */

export const designSystem = {
    // ============================================
    // VARIAVEIS BASE (Primitivos)
    // ============================================
    primitives: {
        brand: "#83E509", // Neon Green Principal
        brandHover: "#72cc00",
        white: "#FFFFFF",
        black: "#09090b", // Zinc 950
        zinc: {
            50: "#fafafa",
            100: "#f4f4f5",
            200: "#e4e4e7",
            300: "#d4d4d8",
            400: "#a1a1aa",
            500: "#71717a",
            600: "#52525b",
            700: "#3f3f46",
            800: "#27272a",
            900: "#18181b",
            950: "#09090b",
        }
    },

    // ============================================
    // CORES SEMÂNTICAS (Tokens)
    // ============================================
    colors: {
        brand: {
            primary: "#83E509",
            hover: "#72cc00",
            light: "rgba(131,229,9,0.1)"
        },
        text: {
            primary: "text-zinc-700 dark:text-zinc-50", // Cinza no modo claro
            secondary: "text-zinc-500 dark:text-zinc-400",
            muted: "text-zinc-400 dark:text-zinc-500",
            onBrand: "text-zinc-950",
            inverted: "text-zinc-50 dark:text-zinc-900"
        },
        surface: {
            page: "bg-background", // Sincronizado com index.css
            card: "bg-card",       // Sincronizado com index.css
            section: "bg-muted/30 dark:bg-zinc-900/50",
            hover: "hover:bg-accent dark:hover:bg-zinc-800",
            active: "active:bg-accent/80 dark:active:bg-zinc-700"
        },
        border: {
            default: "border-border", // Sincronizado com index.css
            subtle: "border-border/50 dark:border-zinc-900",
            active: "border-primary",
            brand: "border-primary"
        }
    },

    // ============================================
    // TIPOGRAFIA
    // ============================================
    typography: {
        fontFamily: {
            sans: "font-sans",
            mono: "font-mono"
        },
        weight: {
            regular: "font-normal",
            medium: "font-medium",
            semibold: "font-semibold",
            bold: "font-bold",
            extrabold: "font-extrabold"
        },
        size: {
            xs: "text-[11px] leading-3",
            sm: "text-[13px] leading-5",
            base: "text-[15px] leading-6",
            lg: "text-[17px] leading-7",
            xl: "text-[20px] leading-7",
            "2xl": "text-[24px] leading-8",
            "3xl": "text-[32px] leading-9",
            "4xl": "text-[40px] leading-tight"
        }
    },

    // ============================================
    // LAYOUT GLOBAL
    // ============================================
    layout: {
        // Container Principal da Aplicação
        app: {
            wrapper: "min-h-screen bg-background text-foreground font-sans antialiased selection:bg-[#83E509]/30",
            main: "flex-1 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        },
        // Containers Comuns
        container: {
            glass: "bg-card/80 backdrop-blur-xl border border-white/5 shadow-sm", // Token Mestre para Sidebar/Header
            page: "container mx-auto px-4 pt-6 pb-8 md:px-6 md:pt-6 md:pb-8 max-w-7xl space-y-6", // Balanced padding
            section: "space-y-4",
            grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        },
        // Sidebar (Painel Lateral)
        sidebar: {
            wrapper: "h-full w-full bg-card/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden flex flex-col",
            header: "flex items-center h-16 px-4 border-b border-white/5 transition-all duration-300",
            body: "flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar",
            footer: "p-2 border-t border-white/5",

            // Itens de Menu
            item: {
                base: "flex items-center gap-3 px-3 py-3 transition-colors duration-200 group relative text-sm font-medium select-none cursor-pointer rounded-none",
                active: "text-[#83E509] border-b-2 border-[#83E509] bg-transparent shadow-none",
                inactive: "text-muted-foreground hover:text-foreground hover:bg-transparent", // Removido bg no hover também para limpeza total
                icon: {
                    active: "text-[#83E509]",
                    inactive: "opacity-70 group-hover:opacity-100 group-hover:text-[#83E509]"
                }
            },

            // Indicadores
            activeIndicator: "absolute left-0 top-1/2 -translate-x-1/2 w-1 h-6 bg-[#83E509] rounded-r-full shadow-[0_0_12px_rgba(131,229,9,0.5)]"
        }
    },

    // ============================================
    // COMPONENTES PRINCIPAIS
    // ============================================
    components: {
        // Header/Navbar Superior
        header: {
            wrapper: "sticky top-0 z-30 w-full h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between shadow-sm"
        },

        // Cartões (Cards)
        card: {
            root: "bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200",
            flat: "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl",
            interactive: "cursor-pointer active:scale-[0.99] transition-transform",
            header: "px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between",
            title: "text-lg font-semibold text-zinc-900 dark:text-zinc-50",
            body: "p-6",
            footer: "px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 rounded-b-xl text-sm text-zinc-500"
        },

        // Botões
        button: {
            // Primário "Brand" (Ação principal)
            primary: "inline-flex items-center justify-center gap-2 bg-[#83E509] hover:bg-[#72cc00] text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all rounded-lg text-sm font-bold px-4 py-2.5 disabled:opacity-50 disabled:pointer-events-none tracking-tight",
            // Secundário (Outline)
            secondary: "inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white active:scale-[0.98] transition-all rounded-lg text-sm font-medium px-4 py-2.5",
            // Ghost (Link/Ação sutil)
            ghost: "inline-flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium px-3 py-2 transition-colors",
            // Destructive (Apagar/Erro)
            danger: "inline-flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 rounded-lg text-sm font-medium px-4 py-2.5 transition-all",
            // Tamanhos
            size: {
                sm: "h-8 px-3 text-xs",
                default: "h-10 px-4 py-2",
                lg: "h-12 px-8 text-base",
                icon: "h-9 w-9 p-0 flex items-center justify-center rounded-lg"
            }
        },

        // Modais (Dialogs) & Drawers
        modal: {
            overlay: "fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-[2px] animate-in fade-in duration-200",
            content: "fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl p-0 duration-200 animate-in zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] flex flex-col max-h-[90vh]", // Flex col + Max Height viewport
            header: "flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-transparent rounded-t-xl",
            title: "text-lg font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-50",
            body: "p-6 overflow-y-auto flex-1 custom-scrollbar", // Scroll interno dinâmico
            footer: "flex-shrink-0 flex items-center justify-end gap-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 rounded-b-xl"
        },

        // Tabelas (Data Display) - Padrão de Linhas Flutuantes (Floating Rows)
        table: {
            root: "w-full text-sm text-left border-separate border-spacing-y-2", // Espaçamento vertical entre linhas
            container: "bg-background w-full", // Fundo do sistema para as linhas flutuarem
            header: "bg-transparent",
            headerCell: "h-12 px-6 text-left align-middle font-bold text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-wider",
            row: "bg-card border border-border/40 shadow-sm rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:scale-[1.002]",
            cell: "p-0 align-middle", // Padrão 0 para que o container interno da linha controle o padding
            caption: "mt-4 text-sm text-muted-foreground"
        },

        // Inputs & Forms
        input: {
            root: "flex w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#83E509] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-200 mb-2 block",
            group: "space-y-2"
        },

        // Badges/Status Indicators
        badge: {
            base: "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            active: "border-transparent bg-[#83E509] text-zinc-950 hover:bg-[#83E509]/80", // Brand
            outline: "text-zinc-500 border-zinc-200 dark:border-zinc-800 dark:text-zinc-400",
            secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-50",
            destructive: "border-transparent bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
            success: "border-transparent bg-emerald-50 text-emerald-600 border border-emerald-100"
        },

        // Abas (Tabs)
        tabs: {
            list: "inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 text-muted-foreground w-full sm:w-auto",
            trigger: "inline-flex items-center justify-center white-space-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground data-[state=active]:shadow-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
            content: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        },

        // Tooltips
        tooltip: {
            content: "z-50 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-100 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 shadow-md"
        },

        // Separadores/Divisores
        separator: {
            horizontal: "h-[1px] w-full bg-zinc-200 dark:bg-zinc-800 my-4",
            vertical: "h-full w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-4"
        }
    },

    // ============================================
    // UTLITÁRIOS VISUAIS
    // ============================================
    utils: {
        shadows: {
            highlight: "shadow-[0_0_0_1px_rgba(131,229,9,0.3),0_0_0_4px_rgba(131,229,9,0.1)]", // Focus ring effect
            card: "shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]"
        },
        // Efeitos de vidro
        glass: "backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border border-white/20 shadow-xl",
        // Scrollbar customizada
        scrollbar: "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-300 dark:hover:scrollbar-thumb-zinc-700"
    }
} as const;

export type DesignSystem = typeof designSystem;
export const ds = designSystem;
