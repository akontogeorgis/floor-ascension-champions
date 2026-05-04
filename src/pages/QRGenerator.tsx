import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode as QrCodeIcon } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

export default function QRGenerator() {
  const [startQR, setStartQR] = useState<string>("");
  const [finishQR, setFinishQR] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const generateQRCodes = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      
      // Generate START QR code (single code, user selects floor on page)
      const startDataUrl = await QRCode.toDataURL(`${baseUrl}/qr/start`, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setStartQR(startDataUrl);
      
      // Generate FINISH QR code (single code, user selects floor on page)
      const finishDataUrl = await QRCode.toDataURL(`${baseUrl}/qr/finish`, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setFinishQR(finishDataUrl);
      
      toast.success("QR codes generated successfully!");
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast.error("Failed to generate QR codes");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (qrDataUrl: string, filename: string) => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${filename}.png`;
    link.click();
    toast.success(`Downloaded ${filename}`);
  };

  const printQR = (qrDataUrl: string, title: string, instructions: string) => {
    if (!qrDataUrl) return;

    const printWindow = window.open('', '', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${title}</title>
            <style>
              @media print {
                @page { margin: 1cm; }
                body { margin: 0; }
              }
              body { 
                display: flex; 
                flex-direction: column;
                justify-content: center; 
                align-items: center; 
                min-height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .container {
                text-align: center;
                page-break-after: always;
                max-width: 600px;
              }
              img { 
                max-width: 100%; 
                height: auto;
                margin: 30px 0;
                border: 2px solid #000;
                padding: 20px;
                background: white;
              }
              h1 {
                font-size: 64px;
                margin: 20px 0;
                color: #000;
              }
              .instructions {
                font-size: 24px;
                color: #333;
                line-height: 1.6;
                margin: 20px 0;
                text-align: left;
              }
              .footer {
                font-size: 18px;
                color: #666;
                margin-top: 40px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${title}</h1>
              <img src="${qrDataUrl}" alt="QR Code" />
              <div class="instructions">
                ${instructions}
              </div>
              <div class="footer">
                Floor Ascension Champions
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">QR Code Generator</h1>
        <p className="text-muted-foreground">
          Generate START and FINISH QR codes for stair climbing tracking
        </p>
      </div>

      <div className="mb-8 rounded-lg bg-blue-50 dark:bg-blue-950 p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-lg mb-3 text-blue-900 dark:text-blue-100">
          📱 Simplified QR System
        </h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          This system uses only <strong>2 QR codes</strong>:
        </p>
        <ul className="list-disc list-inside space-y-2 text-blue-700 dark:text-blue-300">
          <li><strong>START QR</strong> - Place on floors -1 and 0 (user selects floor on page)</li>
          <li><strong>FINISH QR</strong> - Place on floors 1-13 (user selects floor on page)</li>
        </ul>
      </div>

      <div className="mb-6">
        <Button onClick={generateQRCodes} size="lg" disabled={loading}>
          <QrCodeIcon className="w-5 h-5 mr-2" />
          {loading ? "Generating..." : "Generate QR Codes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* START QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span className="text-green-600">▶</span> START
            </CardTitle>
            <CardDescription>
              Place this QR code on floors -1 and 0 (near the stairs)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {startQR ? (
              <>
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <img src={startQR} alt="START QR Code" className="w-full max-w-md mx-auto" />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadQR(startQR, 'START-QR-Code')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => printQR(
                      startQR, 
                      '🏃 START YOUR CLIMB', 
                      '<ol style="padding-left: 20px;"><li>Scan this QR code with your phone</li><li>Enter your email and select starting floor</li><li>Click "Start Climbing Session"</li><li>Begin your climb!</li></ol>'
                    )}
                    variant="outline"
                    className="flex-1"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Print and post on floors -1 and 0
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                <QrCodeIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>Click "Generate QR Codes" to create</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FINISH QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span className="text-blue-600">🏁</span> FINISH
            </CardTitle>
            <CardDescription>
              Place this QR code on floors 1-13 (near the stairs)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {finishQR ? (
              <>
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <img src={finishQR} alt="FINISH QR Code" className="w-full max-w-md mx-auto" />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadQR(finishQR, 'FINISH-QR-Code')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => printQR(
                      finishQR, 
                      '🏁 FINISH YOUR CLIMB', 
                      '<ol style="padding-left: 20px;"><li>Scan this QR code with your phone</li><li>Select your destination floor</li><li>Click "Complete Climb"</li><li>Check the leaderboard!</li></ol>'
                    )}
                    variant="outline"
                    className="flex-1"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Print and post on floors 1-13
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                <QrCodeIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>Click "Generate QR Codes" to create</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-primary/5 rounded-lg">
        <h3 className="font-semibold mb-3">📋 Installation Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Click "Generate QR Codes" button above</li>
          <li>Download or print both QR codes</li>
          <li><strong>START QR</strong>: Print 2 copies and place on floors -1 and 0 (near stairs entrance)</li>
          <li><strong>FINISH QR</strong>: Print 13 copies and place on floors 1-13 (near stairs exit)</li>
          <li>Consider laminating printed QR codes for durability</li>
          <li>Ensure QR codes are at eye level and well-lit for easy scanning</li>
        </ol>
      </div>
    </div>
  );
}
