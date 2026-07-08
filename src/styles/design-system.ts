/**
 * CotaJá Design System
 * SISTEMA COMPLETO: Premium Minimalista & Neon Accent
 *
 * Todos os tokens dark mode usam variáveis semânticas CSS (bg-card, border-border,
 * text-muted-foreground, etc.) para que o tema possa ser alterado em index.css
 * sem tocar em nenhum componente.
 */

const BRAND_COLOR = "#3B82F6"; // Azul Principal

export const designSystem = {
    // ============================================
    // VARIAVEIS BASE (Primitivos)
    // ============================================
    primitives: {
        brand: BRAND_COLOR,
        brandHover: "#2563EB",
        white: "#FFFFFF",
        black: "#09090b",
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
            primary: BRAND_COLOR,
            hover: "#2563EB",
            light: "rgba(59, 130, 246, 0.1)"
        },
        text: {
            primary: "text-foreground",
            secondary: "text-muted-foreground",
            muted: "text-muted-foreground/70",
            onBrand: "text-white",
            inverted: "text-zinc-50 dark:text-zinc-900"
        },
        surface: {
            page: "bg-background",
            card: "bg-card",
            section: "bg-muted/30 dark:bg-card/50",
            hover: "hover:bg-accent",
            active: "active:bg-accent/80"
        },
        border: {
            default: "border-border",
            subtle: "border-border/50",
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
            xs: "text-[10px] leading-3",
            sm: "text-[12px] leading-4",
            base: "text-[13px] leading-5",
            lg: "text-[15px] leading-6",
            xl: "text-[18px] leading-7",
            "2xl": "text-[22px] leading-8",
            "3xl": "text-[28px] leading-9",
            "4xl": "text-[36px] leading-tight"
        }
    },

    // ============================================
    // LAYOUT GLOBAL
    // ============================================
    layout: {
        app: {
            wrapper: "min-h-screen bg-background text-foreground font-sans antialiased selection:bg-brand/30",
            main: "flex-1 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        },
        container: {
            glass: "bg-card/80 backdrop-blur-xl border border-white/5 shadow-sm",
            page: "w-full mx-auto px-4 md:px-3 pt-4 pb-6 md:pt-4 md:pb-8 max-w-[1600px] space-y-4",
            section: "space-y-4",
            grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        },
        sidebar: {
            wrapper: "h-full w-full bg-card border-r border-border dark:border-white/5 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden flex flex-col",
            header: "flex items-center h-16 px-4 border-b border-white/5 transition-all duration-300",
            body: "flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar",
            footer: "p-2 border-t border-white/5",

            item: {
                base: "flex items-center gap-3 px-3 py-3 transition-colors duration-200 group relative text-sm font-medium select-none cursor-pointer rounded-none",
                active: "text-brand border-b-2 border-brand bg-transparent shadow-none",
                inactive: "text-muted-foreground hover:text-foreground hover:bg-transparent",
                icon: {
                    active: "text-brand",
                    inactive: "opacity-70 group-hover:opacity-100 group-hover:text-brand"
                }
            },

            activeIndicator: "absolute left-0 top-1/2 -translate-x-1/2 w-1 h-6 bg-brand rounded-r-full",

            secondary: {
                wrapper: "w-full md:w-72 flex-shrink-0 flex flex-col bg-muted/20 dark:bg-card/30 border-r border-border",
                header: "p-4 border-b border-border bg-muted/30 dark:bg-card/50",
                item: "w-full text-left p-3 rounded-md border transition-all duration-200 relative overflow-hidden group",
                itemActive: "bg-card border-border shadow-md ring-1 ring-brand/20",
                itemInactive: "bg-transparent border-transparent hover:bg-muted/50 dark:hover:bg-accent"
            }
        }
    },

    // ============================================
    // COMPONENTES PRINCIPAIS
    // ============================================
    components: {
        header: {
            wrapper: "sticky top-0 z-30 w-full h-14 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-5 flex items-center justify-between shadow-sm"
        },

        card: {
            root: "bg-card border border-border dark:border-white/5 rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] transition-all duration-200",
            flat: "bg-card border border-border dark:border-white/5 rounded-xl",
            interactive: "cursor-pointer active:scale-[0.99] transition-transform",
            header: "px-4 py-3 border-b border-border dark:border-white/5 flex items-center justify-between",
            title: "text-sm font-semibold text-foreground",
            body: "p-4",
            footer: "px-4 py-3 bg-muted/30 dark:bg-card/50 border-t border-border dark:border-white/5 rounded-b-xl text-xs text-muted-foreground"
        },

        metricCard: {
            root: "group relative overflow-hidden rounded-2xl p-5 transition-all duration-500 border",
            hover: "hover:shadow-2xl hover:scale-[1.04] hover:border-white/40 dark:hover:border-brand/30",
            silhouette: "absolute -right-6 -bottom-6 opacity-0 group-hover:opacity-[0.15] dark:group-hover:opacity-[0.07] transition-all duration-700 transform group-hover:-translate-y-4 group-hover:-translate-x-2 pointer-events-none rotate-6",
            variants: {
                light: {
                    default: "bg-brand text-white border-brand shadow-brand/20",
                    success: "bg-emerald-500 text-white border-emerald-500 shadow-emerald-200/40",
                    warning: "bg-amber-500 text-white border-amber-500 shadow-amber-200/40",
                    error: "bg-red-500 text-white border-red-500 shadow-red-200/40",
                    info: "bg-blue-500 text-white border-blue-500 shadow-blue-200/40"
                },
                dark: {
                    base: "dark:bg-card dark:text-foreground dark:border-border",
                    accent: "dark:hover:border-brand/30"
                }
            }
        },

        button: {
            base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-tight active:scale-[0.98]",

            variants: {
                primary: "bg-brand hover:bg-brand/90 text-white shadow-sm",
                secondary: "bg-background border border-border text-foreground/80 hover:bg-accent hover:text-foreground",
                ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
                danger: "text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-900"
            },

            size: {
                sm: "h-7 px-3 text-[11px]",
                default: "h-9 px-4 py-1.5 text-sm",
                lg: "h-11 px-8 text-base",
                icon: "h-9 w-9 p-0 flex items-center justify-center rounded-lg"
            },

            get primary() { return `${this.base} ${this.variants.primary} ${this.size.default}` },
            get secondary() { return `${this.base} ${this.variants.secondary} ${this.size.default}` },
            get ghost() { return `${this.base} ${this.variants.ghost} ${this.size.default}` },
            get danger() { return `${this.base} ${this.variants.danger} ${this.size.default}` }
        },

        modal: {
            overlay: "fixed inset-0 z-50 bg-background/60 backdrop-blur-[2px] animate-in fade-in duration-200",
            content: "relative z-50 w-full max-w-2xl bg-card border border-border dark:border-white/5 shadow-2xl rounded-xl p-0 animate-fade-in flex flex-col max-h-[90vh]",
            header: "flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border dark:border-white/5 bg-transparent rounded-t-xl",
            title: "text-sm font-semibold leading-none tracking-tight text-foreground",
            body: "p-4 overflow-y-auto flex-1 custom-scrollbar",
            footer: "flex-shrink-0 flex items-center justify-end gap-2 px-4 py-3 bg-muted/30 dark:bg-card/50 border-t border-border dark:border-white/5 rounded-b-xl",

            layout: {
                viewport: "h-[90vh] flex flex-col overflow-hidden border-none shadow-2xl",
                scrollable: "flex-1 min-h-0 overflow-y-auto custom-scrollbar",
                fixedArea: "flex-shrink-0"
            },

            splitView: {
                container: "flex flex-col md:flex-row w-full h-full bg-transparent overflow-hidden",
                main: "flex-1 flex flex-col bg-card overflow-hidden",
                content: "flex-1 overflow-y-auto custom-scrollbar p-4"
            }
        },

        table: {
            root: "w-full text-sm text-left border-separate border-spacing-y-2",
            container: "bg-background w-full",
            header: "bg-transparent",
            headerCell: "h-10 px-4 text-left align-middle font-semibold text-muted-foreground text-[11px] uppercase tracking-wider",
            headerWrapper: "flex items-center rounded-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] px-4 py-3 border border-border dark:border-white/5 bg-card mb-2",
            row: "bg-card border border-border dark:border-white/5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] rounded-xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] hover:scale-[1.002] mb-1.5",
            rowWrapper: "flex items-center px-4 py-2.5 transition-all duration-300",
            rowCompact: "group py-1.5 px-4 rounded-lg border transition-all duration-300 relative overflow-hidden",
            rowActive: "bg-brand/5 border-brand/20 ring-1 ring-brand/10",
            cell: "p-0 align-middle",

            accents: {
                brand: {
                    bg: "bg-brand/10 dark:bg-brand/20",
                    border: "border-brand/20",
                    text: "text-brand",
                    icon: "text-brand"
                },
                orange: {
                    bg: "bg-orange-50/80 dark:bg-orange-900/20",
                    border: "border-orange-200/60 dark:border-orange-800/40",
                    text: "text-orange-800 dark:text-orange-200",
                    icon: "text-orange-500"
                },
                blue: {
                    bg: "bg-blue-50/80 dark:bg-blue-900/20",
                    border: "border-blue-200/60 dark:border-blue-800/40",
                    text: "text-blue-800 dark:text-blue-200",
                    icon: "text-blue-500"
                }
            },
            caption: "mt-4 text-sm text-muted-foreground",

            headerContainer: "flex items-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] px-4 py-4 border border-border dark:border-white/5 bg-card rounded-xl mb-2",
            headerLabel: "uppercase tracking-wide text-[10px] font-bold text-muted-foreground",
            headerIcon: "w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 text-muted-foreground"
        },

        dataDisplay: {
            money: "font-bold text-emerald-600 dark:text-emerald-400 tracking-tight",
            category: "inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md",
            highlight: "font-bold text-sm text-foreground",
            secondary: "text-[11px] font-medium text-muted-foreground",
            code: "font-mono text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border",
            badge: {
                quotes: {
                    root: "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/10",
                    icon: "h-3.5 w-3.5 text-blue-500",
                    text: "font-bold text-blue-600 dark:text-blue-400 text-xs"
                }
            }
        },

        input: {
            root: "flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground mb-2 block",
            group: "space-y-2"
        },

        badge: {
            base: "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            active: "border-transparent bg-brand text-white hover:bg-brand/80",
            outline: "text-muted-foreground border-border",
            secondary: "border-transparent bg-muted text-foreground hover:bg-muted/80",
            destructive: "border-transparent bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
            success: "border-transparent bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
        },

        tabs: {
            list: "inline-flex h-10 items-center justify-center rounded-xl bg-muted/50 p-1 text-muted-foreground w-full sm:w-auto border border-border/50",
            trigger: "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-brand data-[state=active]:shadow-md text-muted-foreground hover:text-foreground",
            content: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            clean: {
                list: "inline-flex h-auto items-center justify-start !bg-transparent !bg-none p-0 gap-4 md:gap-8 w-full border-none !border-0 shadow-none !shadow-none backdrop-blur-none !bg-opacity-0",
                trigger: "relative h-11 px-0 pb-4 pt-2 text-sm font-bold transition-all rounded-none border-b-2 border-transparent bg-transparent !bg-transparent !bg-none shadow-none !shadow-none text-muted-foreground hover:text-foreground data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
            }
        },

        tooltip: {
            content: "z-50 overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 shadow-md"
        },

        separator: {
            horizontal: "h-[1px] w-full bg-border dark:bg-white/5 my-4",
            vertical: "h-full w-[1px] bg-border dark:bg-white/5 mx-4"
        },

        pagination: {
            wrapper: "flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-6 mt-2",
            results: "text-[13px] font-medium text-muted-foreground order-2 sm:order-1",
            controls: "flex items-center gap-3 order-1 sm:order-2",
            item: "flex items-center justify-center min-w-[36px] h-9 rounded-lg border text-[13px] font-semibold transition-all duration-200",
            active: "bg-brand border-brand text-white",
            inactive: "bg-card border-border text-foreground/80 hover:border-border hover:bg-accent",
            disabled: "opacity-40 pointer-events-none",
            nav: "flex items-center gap-1.5",
            navButton: "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-all disabled:opacity-30 disabled:pointer-events-none"
        }
    },

    // ============================================
    // UTLITÁRIOS VISUAIS
    // ============================================
    utils: {
        shadows: {
            highlight: "ring-2 ring-brand ring-offset-2",
            card: "shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]"
        },
        glass: "backdrop-blur-md bg-card/70 border border-border/20 shadow-xl",
        scrollbar: "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/70"
    }
} as const;

export type DesignSystem = typeof designSystem;
export const ds = designSystem;
