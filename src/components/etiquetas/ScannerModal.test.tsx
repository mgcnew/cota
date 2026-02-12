import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { ScannerModal } from './ScannerModal';

vi.mock('@/hooks/use-mobile-device', () => ({
  useIsMobileDevice: () => true,
}));

vi.mock('@/components/responsive/ResponsiveModal', () => ({
  ResponsiveModal: ({ children, open, title }: any) =>
    open ? (
      <div role="dialog">
        <div>{title}</div>
        {children}
      </div>
    ) : null,
}));

const decodeFromConstraints = vi.fn();
const reset = vi.fn();

vi.mock('@zxing/library', async () => {
  const actual: any = await vi.importActual('@zxing/library');

  class MockReader {
    timeBetweenDecodingAttempts = 0;
    decodeFromConstraints = decodeFromConstraints;
    reset = reset;

    constructor(_hints?: any, _timeBetweenScansMillis?: number) {}
  }

  return {
    ...actual,
    BrowserMultiFormatReader: MockReader,
  };
});

beforeEach(() => {
  decodeFromConstraints.mockReset();
  reset.mockReset();
  (globalThis as any).navigator.mediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  };
});

describe('ScannerModal', () => {
  it('renders when open on mobile', () => {
    decodeFromConstraints.mockResolvedValue(undefined);

    render(
      <ScannerModal open={true} onOpenChange={() => {}} onScan={() => {}} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Escanear Código de Barras')).toBeInTheDocument();
  });

  it('falls back when first strategy fails with OverconstrainedError', async () => {
    decodeFromConstraints
      .mockRejectedValueOnce({ name: 'OverconstrainedError', message: 'no rear cam' })
      .mockResolvedValueOnce(undefined);

    render(
      <ScannerModal open={true} onOpenChange={() => {}} onScan={() => {}} />
    );

    await waitFor(() => {
      expect(decodeFromConstraints).toHaveBeenCalledTimes(2);
    });
  });

  it('shows permission error when getUserMedia is denied', async () => {
    decodeFromConstraints.mockRejectedValue({ name: 'NotAllowedError', message: 'denied' });

    render(
      <ScannerModal open={true} onOpenChange={() => {}} onScan={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Acesso à câmera negado/i)).toBeInTheDocument();
    });
  });
});
