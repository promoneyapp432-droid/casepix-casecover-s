import { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Loader2, ExternalLink, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
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
import { firecrawlApi } from '@/lib/api/firecrawl';
import { toast } from 'sonner';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: MobileBrand[];
  preselectedBrandId?: string;
}

interface ParsedModel {
  name: string;
  link?: string;
  image?: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

const ExcelImportDialog = ({ open, onOpenChange, brands, preselectedBrandId }: ExcelImportDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>(preselectedBrandId || '');
  const [parsedModels, setParsedModels] = useState<ParsedModel[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'review' | 'importing'>('upload');
  
  const bulkAddMutation = useBulkAddModels();

  const downloadTemplate = () => {
    // Create CSV template content with GSM Arena links
    const templateContent = `Link (GSM Arena or other mobile page)
https://www.gsmarena.com/samsung_galaxy_s24_ultra-12771.php
https://www.gsmarena.com/samsung_galaxy_s24+-12713.php
https://www.gsmarena.com/apple_iphone_16_pro_max-12970.php
https://www.gsmarena.com/apple_iphone_16_pro-12969.php
https://www.gsmarena.com/google_pixel_9_pro-12871.php`;

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
      
      setProgress(20);

      // Parse CSV - expecting links (GSM Arena URLs)
      const models: ParsedModel[] = [];
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV with quotes and commas
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        const link = columns[0];
        
        if (link && link.startsWith('http')) {
          // Extract a temporary name from the URL
          const urlParts = link.split('/').pop()?.replace('.php', '').replace(/-/g, ' ') || `Model ${i}`;
          
          const model: ParsedModel = {
            name: urlParts,
            link: link,
            status: 'pending',
          };
          models.push(model);
        }
      }

      if (models.length === 0) {
        toast.error('No valid links found in file. Please ensure links start with http');
        setIsProcessing(false);
        return;
      }

      setProgress(30);
      setParsedModels(models);
      setStep('review');
      
      // Start scraping with Firecrawl
      await scrapeLinksWithFirecrawl(models);
      
      setProgress(100);
    } catch (error: any) {
      toast.error('Failed to parse file: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const scrapeLinksWithFirecrawl = async (models: ParsedModel[]) => {
    const modelsWithLinks = models.filter(m => m.link);
    
    for (let i = 0; i < modelsWithLinks.length; i++) {
      const model = modelsWithLinks[i];
      
      setParsedModels(prev => prev.map(m => 
        m.link === model.link ? { ...m, status: 'processing' } : m
      ));

      try {
        // Use Firecrawl API to scrape the link
        const result = await firecrawlApi.scrapeMobileInfo(model.link!);

        if (result.error) {
          throw new Error(result.error);
        }

        setParsedModels(prev => prev.map(m => 
          m.link === model.link 
            ? { 
                ...m, 
                status: 'success',
                image: result.image || undefined,
                name: result.name || m.name,
              } 
            : m
        ));
      } catch (error: any) {
        console.error('Scraping error for', model.link, error);
        setParsedModels(prev => prev.map(m => 
          m.link === model.link 
            ? { ...m, status: 'error', error: error.message } 
            : m
        ));
      }

      // Update progress
      setProgress(30 + ((i + 1) / modelsWithLinks.length) * 60);
      
      // Small delay to avoid rate limiting
      if (i < modelsWithLinks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
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
        .filter(m => m.status === 'success' || m.status === 'pending')
        .map(m => ({
          name: m.name,
          brand_id: selectedBrand,
          image: m.image,
        }));

      if (modelsToImport.length === 0) {
        toast.error('No models to import');
        setStep('review');
        setIsProcessing(false);
        return;
      }

      await bulkAddMutation.mutateAsync(modelsToImport);
      
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast.error('Import failed: ' + error.message);
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setParsedModels([]);
    setSelectedBrand(preselectedBrandId || '');
    setProgress(0);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedBrandName = brands.find(b => b.id === selectedBrand)?.name;
  const successCount = parsedModels.filter(m => m.status === 'success').length;
  const pendingCount = parsedModels.filter(m => m.status === 'pending').length;
  const errorCount = parsedModels.filter(m => m.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Models via Excel
            {selectedBrandName && (
              <Badge variant="secondary" className="ml-2">
                {selectedBrandName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Upload a CSV/Excel file with GSM Arena links. We'll use Firecrawl to extract mobile model images and names automatically.
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
                  <strong>How it works:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Upload a CSV file with GSM Arena mobile page links</li>
                    <li>Firecrawl will automatically scrape each link</li>
                    <li>Mobile model name and image will be extracted</li>
                    <li>Review and import into your selected brand</li>
                  </ol>
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
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {isProcessing ? 'Scraping with Firecrawl...' : 'Scraping complete'}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {successCount} scraped
                </Badge>
                {pendingCount > 0 && (
                  <Badge variant="outline">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    {pendingCount} pending
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    {errorCount} failed
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 border rounded-lg max-h-[300px]">
                <div className="divide-y">
                  {parsedModels.map((model, index) => (
                    <div key={index} className="flex items-center gap-4 p-3">
                      {model.image ? (
                        <img 
                          src={model.image} 
                          alt={model.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                          {model.status === 'processing' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'No img'
                          )}
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
                        {model.error && (
                          <p className="text-xs text-destructive">{model.error}</p>
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
                  {parsedModels.length} links found, {successCount + pendingCount} ready to import
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetState}>
                    Cancel
                  </Button>
                  <Button 
                    className="gradient-primary"
                    onClick={handleImport}
                    disabled={!selectedBrand || isProcessing || bulkAddMutation.isPending || (successCount + pendingCount) === 0}
                  >
                    {bulkAddMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Import {successCount + pendingCount} Models
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
