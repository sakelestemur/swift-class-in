import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMarkAttendance } from '@/hooks/useAttendance';
import { useToast } from '@/hooks/use-toast';
import { Camera, Flashlight, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

type ScanState = 'scanning' | 'processing' | 'success' | 'error';

export function QRScanner({ onSuccess, onClose }: QRScannerProps) {
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const markAttendance = useMarkAttendance();
  const { toast } = useToast();

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (scanState !== 'scanning') return;
            
            setScanState('processing');
            
            try {
              const result = await markAttendance.mutateAsync(decodedText);
              setScanState('success');
              
              toast({
                title: 'Attendance Marked!',
                description: result.isLate 
                  ? 'You have been marked as late.' 
                  : 'You have been marked as present.',
                variant: result.isLate ? 'default' : 'default',
              });

              setTimeout(() => {
                onSuccess?.();
              }, 2000);
            } catch (err: any) {
              setScanState('error');
              setError(err.message || 'Failed to mark attendance');
              
              setTimeout(() => {
                setScanState('scanning');
                setError(null);
              }, 3000);
            }
          },
          undefined
        );

        // Check if torch is available
        const capabilities = scanner.getRunningTrackCameraCapabilities();
        setHasTorch(capabilities.torchFeature().isSupported());
      } catch (err) {
        console.error('Failed to start scanner:', err);
        setError('Failed to access camera. Please grant camera permissions.');
      }
    };

    startScanner();

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, []);

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    
    try {
      const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
      await capabilities.torchFeature().apply(!torchOn);
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white font-semibold text-lg">Scan QR Code</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Scanner Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          ref={containerRef}
          id="qr-reader" 
          className="w-full max-w-md aspect-square"
        />

        {/* Scanning Frame Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

            {/* Status Overlay */}
            {scanState !== 'scanning' && (
              <div className={cn(
                'absolute inset-0 flex flex-col items-center justify-center rounded-lg',
                scanState === 'success' && 'bg-success/90',
                scanState === 'error' && 'bg-destructive/90',
                scanState === 'processing' && 'bg-primary/90'
              )}>
                {scanState === 'processing' && (
                  <>
                    <Loader2 className="h-16 w-16 text-white animate-spin" />
                    <p className="text-white font-medium mt-4">Processing...</p>
                  </>
                )}
                {scanState === 'success' && (
                  <>
                    <CheckCircle2 className="h-16 w-16 text-white animate-scale-in" />
                    <p className="text-white font-medium mt-4">Attendance Marked!</p>
                  </>
                )}
                {scanState === 'error' && (
                  <>
                    <AlertCircle className="h-16 w-16 text-white" />
                    <p className="text-white font-medium mt-4 text-center px-4">{error}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardContent className="p-4">
            <p className="text-white text-center">
              Point your camera at the QR code displayed by your teacher
            </p>
          </CardContent>
        </Card>

        {/* Torch Button */}
        {hasTorch && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={toggleTorch}
              className={cn(
                'border-white/30 text-white hover:bg-white/20',
                torchOn && 'bg-white/20'
              )}
            >
              <Flashlight className="h-5 w-5 mr-2" />
              {torchOn ? 'Turn Off Flash' : 'Turn On Flash'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}