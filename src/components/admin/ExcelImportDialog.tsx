import { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Loader2, ExternalLink, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useBulkAddModels, MobileBrand } from '@/hooks/useMobileBrands';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: MobileBrand[];
}

interface ParsedModel {
  name: string;
  link?: string;
  image?: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

const ExcelImportDialog = ({ open, onOpenChange, brands }: ExcelImportDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [parsedModels, setParsedModels] = useState<ParsedModel[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'review' | 'importing'>('upload');
  
  const bulkAddMutation = useBulkAddModels();

  const downloadTemplate = () => {
    // Create CSV template content
    const templateContent = `Model Name,Link (Optional)
Galaxy S24 Ultra,https://www.samsung.com/galaxy-s24-ultra
Galaxy S24+,https://www.samsung.com/galaxy-s24-plus
Galaxy S24,
iPhone 16 Pro Max,https://www.apple.com/iphone-16-pro
iPhone 16 Pro,
Pixel 9 Pro,https://store.google.com/product/pixel_9_pro`;

    // Create and download the file
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'mobile_models_import_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please upload a valid Excel or CSV file');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      // Read file content
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      setProgress(30);

      // Parse CSV/Excel (simple parsing for CSV)
      const models: ParsedModel[] = [];
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i];
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        if (columns.length >= 1 && columns[0]) {
          const model: ParsedModel = {
            name: columns[0],
            link: columns[1] || undefined,
            status: 'pending',
          };
          models.push(model);
        }
      }

      setProgress(50);
      setParsedModels(models);
      setStep('review');
      
      // If there are links, start scraping
      if (models.some(m => m.link)) {
        await scrapeLinks(models);
      }
      
      setProgress(100);
    } catch (error: any) {
      toast.error('Failed to parse file: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const scrapeLinks = async (models: ParsedModel[]) => {
    const modelsWithLinks = models.filter(m => m.link);
    
    for (let i = 0; i < modelsWithLinks.length; i++) {
      const model = modelsWithLinks[i];
      
      setParsedModels(prev => prev.map(m => 
        m.name === model.name ? { ...m, status: 'processing' } : m
      ));

      try {
        // Call edge function to scrape the link
        const { data, error } = await supabase.functions.invoke('scrape-mobile-info', {
          body: { url: model.link },
        });

        if (error) throw error;

        setParsedModels(prev => prev.map(m => 
          m.name === model.name 
            ? { 
                ...m, 
                status: 'success',
                image: data?.image || undefined,
                name: data?.name || m.name,
              } 
            : m
        ));
      } catch (error: any) {
        setParsedModels(prev => prev.map(m => 
          m.name === model.name 
            ? { ...m, status: 'error', error: error.message } 
            : m
        ));
      }

      setProgress(50 + ((i + 1) / modelsWithLinks.length) * 40);
    }
  };

  const handleImport = async () => {
    if (!selectedBrand) {
      toast.error('Please select a brand');
      return;
    }

    setStep('importing');
    setIsProcessing(true);

    try {
      const modelsToImport = parsedModels
        .filter(m => m.status !== 'error')
        .map(m => ({
          name: m.name,
          brand_id: selectedBrand,
          image: m.image,
        }));

      await bulkAddMutation.mutateAsync(modelsToImport);
      
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast.error('Import failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setParsedModels([]);
    setSelectedBrand('');
    setProgress(0);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedBrandName = brands.find(b => b.id === selectedBrand)?.name;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Models from Excel
            {selectedBrandName && (
              <Badge variant="secondary" className="ml-2">
                {selectedBrandName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file with model names and optional links. 
            Links will be scraped to extract images and model details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Brand Selection */}
          <div>
            <Label>Select Brand for Import</Label>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {step === 'upload' && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>File format:</strong> CSV or Excel with columns: Model Name, Link (optional)
                  <br />
                  The first row should be headers. Links will be scraped for images.
                </AlertDescription>
              </Alert>

              {/* Download Template Button */}
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Import Template (CSV)
              </Button>

              <div 
                className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Click to upload file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports .csv, .xlsx, .xls
                </p>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scraping links for images...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <ScrollArea className="flex-1 border rounded-lg">
                <div className="divide-y">
                  {parsedModels.map((model, index) => (
                    <div key={index} className="flex items-center gap-4 p-3">
                      {model.image ? (
                        <img 
                          src={model.image} 
                          alt={model.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{model.name}</p>
                        {model.link && (
                          <a 
                            href={model.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View source
                          </a>
                        )}
                      </div>

                      <Badge 
                        variant={
                          model.status === 'success' ? 'default' :
                          model.status === 'error' ? 'destructive' :
                          model.status === 'processing' ? 'secondary' :
                          'outline'
                        }
                      >
                        {model.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        {model.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-between items-center pt-2">
                <p className="text-sm text-muted-foreground">
                  {parsedModels.length} models found, {parsedModels.filter(m => m.status !== 'error').length} ready to import
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetState}>
                    Cancel
                  </Button>
                  <Button 
                    className="gradient-primary"
                    onClick={handleImport}
                    disabled={!selectedBrand || isProcessing || bulkAddMutation.isPending}
                  >
                    {bulkAddMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Import {parsedModels.filter(m => m.status !== 'error').length} Models
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Importing models...</p>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportDialog;
