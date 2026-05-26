/**
 * Normalizes Supabase / Postgres errors into user-facing strings.
 *
 * Triggers like `enforce_active_subscription` raise `SUBSCRIPTION_INACTIVE: ...`.
 * We detect those known codes and return a clean message; otherwise we fall
 * back to the original message or a generic one.
 */

export interface FriendlyError {
  title: string;
  description: string;
  code?: string;
}

const KNOWN_PREFIXES: Array<{ prefix: string; title: string; description: string; code: string }> = [
  {
    prefix: "SUBSCRIPTION_INACTIVE",
    code: "SUBSCRIPTION_INACTIVE",
    title: "Assinatura inativa",
    description:
      "A assinatura da empresa não está ativa. Renove o plano ou entre em contato com o administrador para continuar.",
  },
];

export function friendlyError(err: unknown, fallbackTitle = "Algo deu errado"): FriendlyError {
  const raw =
    (typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: unknown }).message === "string"
      ? (err as { message: string }).message
      : typeof err === "string"
        ? err
        : "") || "";

  for (const k of KNOWN_PREFIXES) {
    if (raw.includes(k.prefix)) {
      return { title: k.title, description: k.description, code: k.code };
    }
  }

  return {
    title: fallbackTitle,
    description: raw || "Tente novamente em instantes.",
  };
}
