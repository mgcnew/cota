import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ScannerModal } from './ScannerModal';
import { Html5Qrcode } from 'html5-qrcode';

// Define mocks using vi.hoisted to ensure they are available in the mock factory
const { mockStart, mockStop, mockClear } = vi.hoisted(() => {
  return {
    mockStart: vi.fn(),
    mockStop: vi.fn(),
    mockClear: vi.fn(),
  };
});

// Mock dependencies
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

// Mock html5-qrcode
vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: class {
      start = mockStart;
      stop = mockStop;
      clear = mockClear;
    },
    Html5QrcodeSupportedFormats: {
      EAN_13: 0,
      EAN_8: 1,
      UPC_A: 2,
      UPC_E: 3,
      CODE_128: 4,
      CODE_39: 5,
      QR_CODE: 6
    }
  };
});

describe('ScannerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStart.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
    mockClear.mockResolvedValue(undefined);
  });

  it('renders and attempts to start scanner when open', async () => {
    render(
      <ScannerModal open={true} onOpenChange={() => {}} onScan={() => {}} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    }, { timeout: 1000 });

    expect(mockStart).toHaveBeenCalledWith(
      { facingMode: "environment" },
      expect.objectContaining({
        fps: 10,
        qrbox: { width: 250, height: 250 }
      }),
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('handles start error correctly', async () => {
    mockStart.mockRejectedValueOnce('Some error');

    render(
      <ScannerModal open={true} onOpenChange={() => {}} onScan={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText('Some error')).toBeInTheDocument();
    });
  });

  it('handles permission denied error', async () => {
    const error = new Error('Permission denied');
    error.name = 'NotAllowedError';
    mockStart.mockRejectedValueOnce(error);

    render(
      <ScannerModal open={true} onOpenChange={() => {}} onScan={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText('Permissão da câmera negada.')).toBeInTheDocument();
    });
  });

  it('stops scanner when modal closes', async () => {
    const { rerender } = render(
      <ScannerModal open={true} onOpenChange={() => {}} onScan={() => {}} />
    );

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });

    rerender(
      <ScannerModal open={false} onOpenChange={() => {}} onScan={() => {}} />
    );

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
    });
  });

  it('calls onScan when code is detected', async () => {
    const onScan = vi.fn();
    const onOpenChange = vi.fn();

    mockStart.mockImplementation((_config, _opts, onSuccess, _onError) => {
      onSuccess('123456789');
      return Promise.resolve();
    });

    render(
      <ScannerModal open={true} onOpenChange={onOpenChange} onScan={onScan} />
    );

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledWith('123456789');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
