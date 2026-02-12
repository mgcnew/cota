import { render, screen } from '@testing-library/react';
import { ScannerModal } from './ScannerModal';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('react-zxing', () => ({
  useZxing: () => ({
    ref: { current: null },
  }),
}));

vi.mock('@/hooks/use-mobile-device', () => ({
  useIsMobileDevice: () => true,
}));

vi.mock('@/components/responsive/ResponsiveModal', () => ({
  ResponsiveModal: ({ children, open, title }: any) => (
    open ? <div role="dialog" title={title}>{children}</div> : null
  ),
}));

describe('ScannerModal', () => {
  it('renders correctly when open on mobile', () => {
    render(
      <ScannerModal 
        open={true} 
        onOpenChange={() => {}} 
        onScan={() => {}} 
      />
    );
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Escanear Código de Barras')).toBeInTheDocument();
    expect(screen.getByText(/Iniciando câmera/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ScannerModal 
        open={false} 
        onOpenChange={() => {}} 
        onScan={() => {}} 
      />
    );
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
