import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Smartphone, CheckCircle, QrCode, Zap, Shield } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10">
            <QrCode className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">QR Attendance</h1>
          <p className="text-muted-foreground">
            Install the app on your device for the best experience
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-success">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Already Installed!</h3>
                <p className="text-muted-foreground">
                  The app is installed on your device.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install App
              </CardTitle>
              <CardDescription>
                Add to your home screen for quick access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deferredPrompt ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Install Now
                </Button>
              ) : isIOS ? (
                <div className="space-y-3 text-sm">
                  <p className="font-medium">To install on iPhone/iPad:</p>
                  <ol className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">1</Badge>
                      Tap the Share button in Safari
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">2</Badge>
                      Scroll down and tap "Add to Home Screen"
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">3</Badge>
                      Tap "Add" to confirm
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="font-medium">To install:</p>
                  <ol className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">1</Badge>
                      Open browser menu (three dots)
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">2</Badge>
                      Tap "Install app" or "Add to Home Screen"
                    </li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Fast</p>
            <p className="text-xs text-muted-foreground">Instant loading</p>
          </Card>
          <Card className="p-4 text-center">
            <Shield className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-sm font-medium">Secure</p>
            <p className="text-xs text-muted-foreground">Encrypted data</p>
          </Card>
          <Card className="p-4 text-center">
            <Smartphone className="h-8 w-8 text-info mx-auto mb-2" />
            <p className="text-sm font-medium">Offline</p>
            <p className="text-xs text-muted-foreground">Works offline</p>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Works on Android, iPhone, iPad, and desktop browsers
        </p>
      </div>
    </div>
  );
}
