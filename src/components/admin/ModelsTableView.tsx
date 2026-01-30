import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Image as ImageIcon, Check, X, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useMobileModelsWithCaseAvailability, MobileModelWithDetails } from '@/hooks/useMobileBrands';

interface ModelsTableViewProps {
  brandId?: string;
  brandName?: string;
  onEditModel: (model: MobileModelWithDetails) => void;
  onDeleteModel: (id: string) => void;
}

type SortField = 'name' | 'brand' | 'metal' | 'snap';
type SortOrder = 'asc' | 'desc';
type AvailabilityFilter = 'all' | 'metal' | 'snap' | 'both' | 'none';

const ModelsTableView = ({ brandId, brandName, onEditModel, onDeleteModel }: ModelsTableViewProps) => {
  const { data: models, isLoading } = useMobileModelsWithCaseAvailability(brandId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');

  // Filter and sort models
  const filteredModels = useMemo(() => {
    if (!models) return [];

    let result = [...models];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.brand.name.toLowerCase().includes(query)
      );
    }

    // Availability filter
    switch (availabilityFilter) {
      case 'metal':
        result = result.filter(m => m.metal_available);
        break;
      case 'snap':
        result = result.filter(m => m.snap_available);
        break;
      case 'both':
        result = result.filter(m => m.metal_available && m.snap_available);
        break;
      case 'none':
        result = result.filter(m => !m.metal_available && !m.snap_available);
        break;
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'brand':
          comparison = a.brand.name.localeCompare(b.brand.name);
          break;
        case 'metal':
          comparison = (a.metal_available ? 1 : 0) - (b.metal_available ? 1 : 0);
          break;
        case 'snap':
          comparison = (a.snap_available ? 1 : 0) - (b.snap_available ? 1 : 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [models, searchQuery, sortField, sortOrder, availabilityFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" /> 
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header with Brand Name */}
      {brandName && (
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{brandName} Models</h3>
          <Badge variant="secondary">{filteredModels.length} models</Badge>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search models or brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as AvailabilityFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by case" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="metal">Metal Case Available</SelectItem>
            <SelectItem value="snap">Snap Case Available</SelectItem>
            <SelectItem value="both">Both Available</SelectItem>
            <SelectItem value="none">No Cases</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {!filteredModels?.length ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card">
          {searchQuery || availabilityFilter !== 'all' 
            ? 'No models match your filters.' 
            : 'No models found. Add models or change the brand filter.'}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>
                  <button 
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Model Name
                    <SortIcon field="name" />
                  </button>
                </TableHead>
                <TableHead>
                  <button 
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('brand')}
                  >
                    Brand
                    <SortIcon field="brand" />
                  </button>
                </TableHead>
                <TableHead className="text-center w-[120px]">
                  <button 
                    className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                    onClick={() => handleSort('metal')}
                  >
                    Metal Case
                    <SortIcon field="metal" />
                  </button>
                </TableHead>
                <TableHead className="text-center w-[120px]">
                  <button 
                    className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                    onClick={() => handleSort('snap')}
                  >
                    Snap Case
                    <SortIcon field="snap" />
                  </button>
                </TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    {model.image ? (
                      <img 
                        src={model.image} 
                        alt={model.name}
                        className="w-12 h-12 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{model.brand.name}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {model.metal_available ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        <Check className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <X className="w-3 h-3 mr-1" />
                        N/A
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {model.snap_available ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        <Check className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <X className="w-3 h-3 mr-1" />
                        N/A
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditModel(model)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteModel(model.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results Summary */}
      {filteredModels.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredModels.length} of {models?.length || 0} models
        </div>
      )}
    </motion.div>
  );
};

export default ModelsTableView;
