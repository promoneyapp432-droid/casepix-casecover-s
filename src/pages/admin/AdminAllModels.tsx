import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  Plus, Search, Upload, Download, Smartphone, ChevronRight,
  Trash2, Pencil, Image as ImageIcon, X, Check, Loader2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  useMobileBrands, useMobileModels, useAddBrand, useDeleteBrand,
  useUpdateBrand, useBulkAddModels, useDeleteModel,
} from '@/hooks/useMobileBrands';
import { supabase } from '@/integrations/supabase/client';

interface ExtendedModel {
  id: string;
  name: string;
  brand_id: string;
  image: string | null;
  release_date: string | null;
  size_inch: number | null;
  height_mm: number | null;
  width_mm: number | null;
  screen_size_cm2: number | null;
  body_to_screen_ratio: number | null;
  battery_mah: number | null;
}

const AdminAllModels = () => {
  const { data: brands, isLoading: brandsLoading } = useMobileBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [editingBrand, setEditingBrand] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addBrand = useAddBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const bulkAddModels = useBulkAddModels();
  const deleteModel = useDeleteModel();

  // Fetch models for selected brand with extended fields
  const { data: rawModels } = useMobileModels(selectedBrandId || undefined);
  const [extModels, setExtModels] = useState<ExtendedModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Fetch extended model data when brand changes
  const fetchExtendedModels = async (brandId: string) => {
    setModelsLoading(true);
    const { data, error } = await supabase
      .from('mobile_models')
      .select('*')
      .eq('brand_id', brandId)
      .order('name');
    if (!error && data) {
      setExtModels(data as unknown as ExtendedModel[]);
    }
    setModelsLoading(false);
  };

  // Re-fetch when brand changes
  useState(() => {
    if (selectedBrandId) fetchExtendedModels(selectedBrandId);
  });

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSearchQuery('');
    fetchExtendedModels(brandId);
  };

  const selectedBrand = brands?.find(b => b.id === selectedBrandId);

  const filteredModels = useMemo(() => {
    if (!extModels) return [];
    if (!searchQuery.trim()) return extModels;
    const q = searchQuery.toLowerCase();
    return extModels.filter(m => m.name.toLowerCase().includes(q));
  }, [extModels, searchQuery]);

  // Brand CRUD
  const handleAddBrand = () => {
    if (!brandName.trim()) return;
    if (editingBrand) {
      updateBrand.mutate({ id: editingBrand.id, data: { name: brandName.trim() } }, {
        onSuccess: () => { setBrandDialogOpen(false); setBrandName(''); setEditingBrand(null); }
      });
    } else {
      addBrand.mutate({ name: brandName.trim() }, {
        onSuccess: () => { setBrandDialogOpen(false); setBrandName(''); }
      });
    }
  };

  const handleDeleteBrand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this brand and all its models?')) return;
    deleteBrand.mutate(id, {
      onSuccess: () => { if (selectedBrandId === id) { setSelectedBrandId(null); setExtModels([]); } }
    });
  };

  const handleEditBrand = (brand: { id: string; name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandDialogOpen(true);
  };

  // Model count per brand
  const [modelCounts, setModelCounts] = useState<Record<string, number>>({});
  const fetchModelCounts = async () => {
    if (!brands) return;
    const counts: Record<string, number> = {};
    for (const brand of brands) {
      const { count } = await supabase
        .from('mobile_models')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brand.id);
      counts[brand.id] = count || 0;
    }
    setModelCounts(counts);
  };
  useState(() => { if (brands) fetchModelCounts(); });

  // Smart column mapping - maps various header names to our DB fields
  const COLUMN_MAPPINGS: Record<string, string[]> = {
    name: ['modelname', 'model_name', 'model name', 'name', 'device', 'phone', 'mobile', 'device name', 'phone name', 'mobile name', 'model'],
    image: ['image', 'imageurl', 'image_url', 'image url', 'img', 'photo', 'picture', 'thumbnail', 'mobile model image', 'model image'],
    release_date: ['releasedate', 'release_date', 'release date', 'released', 'launch date', 'launchdate', 'date', 'year'],
    size_inch: ['sizeinch', 'size_inch', 'size (inch)', 'size', 'display size', 'screen inch', 'screeninch', 'size in inch', 'display'],
    height_mm: ['heightmm', 'height_mm', 'height (mm)', 'height', 'length', 'lengthmm', 'length_mm', 'height mm'],
    width_mm: ['widthmm', 'width_mm', 'width (mm)', 'width', 'breadth', 'width mm'],
    screen_size_cm2: ['screensizecm2', 'screen_size_cm2', 'screen size', 'screensize', 'screen area', 'screen size cm2', 'screen (cm2)', 'screen'],
    body_to_screen_ratio: ['bodytoscreenratio', 'body_to_screen_ratio', 'body to screen ratio', 'screen ratio', 'body/screen', 'screen%', 'ratio', 'body to screen', 'screen body ratio'],
    battery_mah: ['batterymah', 'battery_mah', 'battery (mah)', 'battery', 'battery mah', 'battery capacity'],
  };

  const detectColumnMapping = (headers: string[]): Record<string, number> => {
    const mapping: Record<string, number> = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim());

    for (const [dbField, aliases] of Object.entries(COLUMN_MAPPINGS)) {
      for (const alias of aliases) {
        const idx = normalizedHeaders.findIndex(h => h === alias || h.includes(alias));
        if (idx !== -1 && !Object.values(mapping).includes(idx)) {
          mapping[dbField] = idx;
          break;
        }
      }
    }
    return mapping;
  };

  // Import Excel/CSV
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length < 2) { toast.error('File is empty or has no data rows'); return; }

        const headers = jsonData[0].map((h: any) => String(h || ''));
        const columnMap = detectColumnMapping(headers);

        if (columnMap.name === undefined) {
          toast.error('Could not find a "Model Name" column. Please ensure your file has a column for model names.');
          return;
        }

        const rows = jsonData.slice(1)
          .filter(row => row && row[columnMap.name])
          .map(row => ({
            name: String(row[columnMap.name] || '').trim(),
            image: columnMap.image !== undefined ? String(row[columnMap.image] || '').trim() || null : null,
            release_date: columnMap.release_date !== undefined ? String(row[columnMap.release_date] || '').trim() || null : null,
            size_inch: columnMap.size_inch !== undefined ? parseNum(row[columnMap.size_inch]) : null,
            height_mm: columnMap.height_mm !== undefined ? parseNum(row[columnMap.height_mm]) : null,
            width_mm: columnMap.width_mm !== undefined ? parseNum(row[columnMap.width_mm]) : null,
            screen_size_cm2: columnMap.screen_size_cm2 !== undefined ? parseNum(row[columnMap.screen_size_cm2]) : null,
            body_to_screen_ratio: columnMap.body_to_screen_ratio !== undefined ? parseNum(row[columnMap.body_to_screen_ratio]) : null,
            battery_mah: columnMap.battery_mah !== undefined ? parseNum(row[columnMap.battery_mah]) : null,
          }))
          .filter(r => r.name);

        if (!rows.length) { toast.error('No valid model data found in file'); return; }

        setPreviewData(rows);
        setImportDialogOpen(true);
        toast.success(`Detected ${rows.length} models. Mapped columns: ${Object.keys(columnMap).join(', ')}`);
      } catch (err: any) {
        toast.error('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!selectedBrandId || !previewData.length) return;
    setImporting(true);
    try {
      const modelsToInsert = previewData.map(row => ({
        ...row,
        brand_id: selectedBrandId,
      }));

      const { error } = await supabase.from('mobile_models').insert(modelsToInsert as any);
      if (error) throw error;
      toast.success(`${modelsToInsert.length} models imported successfully`);
      setImportDialogOpen(false);
      setPreviewData([]);
      fetchExtendedModels(selectedBrandId);
      fetchModelCounts();
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    }
    setImporting(false);
  };

  const parseNum = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? null : n;
  };

  // Export
  const handleExport = () => {
    if (!extModels.length || !selectedBrand) return;
    const headers = ['modelName', 'image', 'releaseDate', 'sizeInch', 'heightMm', 'widthMm', 'screenSizeCm2', 'bodyToScreenRatio', 'batteryMah'];
    const csvRows = [headers.join(',')];
    extModels.forEach(m => {
      csvRows.push([
        `"${m.name}"`, `"${m.image || ''}"`, `"${m.release_date || ''}"`,
        m.size_inch ?? '', m.height_mm ?? '', m.width_mm ?? '',
        m.screen_size_cm2 ?? '', m.body_to_screen_ratio ?? '', m.battery_mah ?? ''
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBrand.name}_models.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteModel = (id: string) => {
    if (!confirm('Delete this model?')) return;
    deleteModel.mutate(id, {
      onSuccess: () => {
        setExtModels(prev => prev.filter(m => m.id !== id));
        fetchModelCounts();
      }
    });
  };

  return (
    <AdminLayout title="All Models">
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Left: Brands List */}
        <div className="w-[280px] shrink-0 flex flex-col bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Brands</h3>
            <Button size="sm" onClick={() => { setEditingBrand(null); setBrandName(''); setBrandDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {brandsLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
              ) : !brands?.length ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No brands yet</div>
              ) : brands.map(brand => (
                <motion.div
                  key={brand.id}
                  whileHover={{ x: 2 }}
                  onClick={() => handleSelectBrand(brand.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                    selectedBrandId === brand.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium truncate">{brand.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={selectedBrandId === brand.id ? 'secondary' : 'outline'} className="text-xs">
                      {modelCounts[brand.id] ?? 0}
                    </Badge>
                    <div className="hidden group-hover:flex gap-0.5">
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={(e) => handleEditBrand(brand, e)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={(e) => handleDeleteBrand(brand.id, e)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Models Table */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedBrand ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Smartphone className="w-12 h-12 mx-auto opacity-30" />
                <p>Select a brand to view models</p>
              </div>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selectedBrand.name}</h2>
                  <Badge variant="secondary">{extModels.length} models</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Import
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={!extModels.length}>
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto rounded-xl border bg-card">
                {modelsLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading models...</div>
                ) : !filteredModels.length ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {searchQuery ? 'No models match your search.' : 'No models yet. Import a CSV to add models.'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Image</TableHead>
                        <TableHead>Model Name</TableHead>
                        <TableHead>Release Date</TableHead>
                        <TableHead className="text-right">Size (in)</TableHead>
                        <TableHead className="text-right">Height (mm)</TableHead>
                        <TableHead className="text-right">Width (mm)</TableHead>
                        <TableHead className="text-right">Screen (cm²)</TableHead>
                        <TableHead className="text-right">Body/Screen %</TableHead>
                        <TableHead className="text-right">Battery (mAh)</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModels.map(model => (
                        <TableRow key={model.id}>
                          <TableCell>
                            {model.image ? (
                              <img src={model.image} alt={model.name} className="w-10 h-10 object-cover rounded border" />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{model.name}</TableCell>
                          <TableCell className="text-muted-foreground">{model.release_date || '—'}</TableCell>
                          <TableCell className="text-right">{model.size_inch ?? '—'}</TableCell>
                          <TableCell className="text-right">{model.height_mm ?? '—'}</TableCell>
                          <TableCell className="text-right">{model.width_mm ?? '—'}</TableCell>
                          <TableCell className="text-right">{model.screen_size_cm2 ?? '—'}</TableCell>
                          <TableCell className="text-right">{model.body_to_screen_ratio ? `${model.body_to_screen_ratio}%` : '—'}</TableCell>
                          <TableCell className="text-right">{model.battery_mah ?? '—'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDeleteModel(model.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Brand Dialog */}
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
            <DialogDescription>Enter the brand name.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g. Samsung, Oppo, Vivo..."
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddBrand()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBrand} disabled={!brandName.trim()}>
              {editingBrand ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import Preview — {previewData.length} models</DialogTitle>
            <DialogDescription>Review data before importing into {selectedBrand?.name}.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Name</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Battery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.slice(0, 50).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.release_date || '—'}</TableCell>
                    <TableCell>{row.size_inch ?? '—'}{row.size_inch ? '"' : ''}</TableCell>
                    <TableCell>{row.battery_mah ?? '—'}{row.battery_mah ? ' mAh' : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportDialogOpen(false); setPreviewData([]); }}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import {previewData.length} Models
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAllModels;
