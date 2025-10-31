import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-gray-800 dark:group-[.toaster]:text-gray-100 dark:group-[.toaster]:border-gray-700",
          description: "group-[.toast]:text-muted-foreground dark:group-[.toast]:text-gray-300",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground dark:group-[.toast]:bg-primary dark:group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground dark:group-[.toast]:bg-gray-700 dark:group-[.toast]:text-gray-200",
          success: "group-[.toast]:bg-green-50 group-[.toast]:text-green-900 group-[.toast]:border-green-200 dark:group-[.toast]:bg-green-900/20 dark:group-[.toast]:text-green-100 dark:group-[.toast]:border-green-800",
          error: "group-[.toast]:bg-red-50 group-[.toast]:text-red-900 group-[.toast]:border-red-200 dark:group-[.toast]:bg-red-900/20 dark:group-[.toast]:text-red-100 dark:group-[.toast]:border-red-800",
          warning: "group-[.toast]:bg-amber-50 group-[.toast]:text-amber-900 group-[.toast]:border-amber-200 dark:group-[.toast]:bg-amber-900/20 dark:group-[.toast]:text-amber-100 dark:group-[.toast]:border-amber-800",
          info: "group-[.toast]:bg-blue-50 group-[.toast]:text-blue-900 group-[.toast]:border-blue-200 dark:group-[.toast]:bg-blue-900/20 dark:group-[.toast]:text-blue-100 dark:group-[.toast]:border-blue-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
