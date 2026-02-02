import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Save, Plus, X, Loader2, GripVertical, Trash2, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUploader from './ImageUploader';
import { useAPlusContent, useUpsertAPlusContent, APlusContent } from '@/hooks/useAPlusContent';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ContentBlock, ContentBlockType, createEmptyBlock } from '@/types/aplus';
import ContentBlockRenderer from './aplus-blocks/ContentBlockRenderer';
import AddBlockButton from './aplus-blocks/AddBlockButton';

type CaseType = Database['public']['Enums']['case_type'];

interface ContentFormState {
  title: string;
  description: string;
  features: string[];
  price: number;
  compare_price: number | null;
  default_image_2: string | null;
  default_image_3: string | null;
  default_image_4: string | null;
  default_image_5: string | null;
  default_image_6: string | null;
  content_blocks: ContentBlock[];
}

const defaultFormState: ContentFormState = {
  title: '',
  description: '',
  features: [],
  price: 499,
  compare_price: null,
  default_image_2: null,
  default_image_3: null,
  default_image_4: null,
  default_image_5: null,
  default_image_6: null,
  content_blocks: [],
};

const APlusContentEditor = () => {
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType>('metal');
  const [formState, setFormState] = useState<ContentFormState>(defaultFormState);
  const [newFeature, setNewFeature] = useState('');

  const { data: allContent, isLoading } = useAPlusContent();
  const upsertContent = useUpsertAPlusContent();

  // Get current content for selected case type
  const currentContent = allContent?.find(c => c.case_type === selectedCaseType);

  // Update form when content or case type changes
  useEffect(() => {
    if (currentContent) {
      setFormState({
        title: currentContent.title || '',
        description: currentContent.description || '',
        features: Array.isArray(currentContent.features) ? currentContent.features : [],
        price: currentContent.price ?? (selectedCaseType === 'metal' ? 799 : 499),
        compare_price: currentContent.compare_price ?? null,
        default_image_2: currentContent.default_image_2,
        default_image_3: currentContent.default_image_3,
        default_image_4: currentContent.default_image_4,
        default_image_5: currentContent.default_image_5,
        default_image_6: currentContent.default_image_6,
        content_blocks: Array.isArray(currentContent.content_blocks) ? currentContent.content_blocks : [],
      });
    } else {
      setFormState({
        ...defaultFormState,
        price: selectedCaseType === 'metal' ? 799 : 499,
      });
    }
  }, [currentContent, selectedCaseType]);

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormState(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormState(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addBlock = (type: ContentBlockType) => {
    const newBlock = createEmptyBlock(type);
    setFormState(prev => ({
      ...prev,
      content_blocks: [...prev.content_blocks, newBlock],
    }));
  };

  const updateBlock = (updatedBlock: ContentBlock) => {
    setFormState(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.map(block =>
        block.id === updatedBlock.id ? updatedBlock : block
      ),
    }));
  };

  const removeBlock = (blockId: string) => {
    setFormState(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.filter(block => block.id !== blockId),
    }));
  };

  const handleSave = async () => {
    await upsertContent.mutateAsync({
      case_type: selectedCaseType,
      ...formState,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedCaseType} onValueChange={(v) => setSelectedCaseType(v as CaseType)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="metal" className="gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-muted-foreground/60 to-muted-foreground" />
              Metal Case
            </TabsTrigger>
            <TabsTrigger value="snap" className="gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-primary/60 to-primary" />
              Snap Case
            </TabsTrigger>
          </TabsList>

          <Button 
            onClick={handleSave} 
            disabled={upsertContent.isPending}
            className="gradient-primary"
          >
            {upsertContent.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <TabsContent value={selectedCaseType} className="mt-4 space-y-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Pricing
              </CardTitle>
              <CardDescription>
                Set the default price for all {selectedCaseType} case products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="price">Selling Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formState.price}
                    onChange={(e) => setFormState(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="499"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="compare_price">Compare at Price (₹)</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    value={formState.compare_price || ''}
                    onChange={(e) => setFormState(prev => ({ 
                      ...prev, 
                      compare_price: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    placeholder="899 (optional - shows strikethrough)"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Shows as strikethrough price for discounts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rich Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>Rich Description</CardTitle>
              <CardDescription>
                Default A+ content that will be used for all {selectedCaseType} case products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={`Premium ${selectedCaseType === 'metal' ? 'Metal' : 'Snap-On'} Case`}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter a detailed description for this case type..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Features</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" variant="outline" onClick={addFeature}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formState.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Blocks Card */}
          <Card>
            <CardHeader>
              <CardTitle>Content Blocks</CardTitle>
              <CardDescription>
                Add and arrange content blocks. You can use each block type multiple times.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Reorder.Group
                axis="y"
                values={formState.content_blocks}
                onReorder={(newBlocks) => setFormState(prev => ({ ...prev, content_blocks: newBlocks }))}
                className="space-y-4"
              >
                <AnimatePresence mode="popLayout">
                  {formState.content_blocks.map((block) => (
                    <Reorder.Item
                      key={block.id}
                      value={block}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative"
                    >
                      <div className="flex gap-2">
                        <div className="flex flex-col items-center gap-1 pt-2">
                          <div className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeBlock(block.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex-1 p-4 border rounded-lg bg-card">
                          <ContentBlockRenderer
                            block={block}
                            onChange={updateBlock}
                            caseType={selectedCaseType}
                          />
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>

              <AddBlockButton onAdd={addBlock} />
            </CardContent>
          </Card>

          {/* Default Images Card */}
          <Card>
            <CardHeader>
              <CardTitle>Default Product Images</CardTitle>
              <CardDescription>
                These images will be used as defaults (2nd-6th) for products without custom images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ImageUploader
                  label="2nd Image"
                  value={formState.default_image_2 || undefined}
                  onChange={(url) => setFormState(prev => ({ ...prev, default_image_2: url }))}
                  folder={`a-plus/${selectedCaseType}`}
                />
                <ImageUploader
                  label="3rd Image"
                  value={formState.default_image_3 || undefined}
                  onChange={(url) => setFormState(prev => ({ ...prev, default_image_3: url }))}
                  folder={`a-plus/${selectedCaseType}`}
                />
                <ImageUploader
                  label="4th Image"
                  value={formState.default_image_4 || undefined}
                  onChange={(url) => setFormState(prev => ({ ...prev, default_image_4: url }))}
                  folder={`a-plus/${selectedCaseType}`}
                />
                <ImageUploader
                  label="5th Image"
                  value={formState.default_image_5 || undefined}
                  onChange={(url) => setFormState(prev => ({ ...prev, default_image_5: url }))}
                  folder={`a-plus/${selectedCaseType}`}
                />
                <ImageUploader
                  label="6th Image"
                  value={formState.default_image_6 || undefined}
                  onChange={(url) => setFormState(prev => ({ ...prev, default_image_6: url }))}
                  folder={`a-plus/${selectedCaseType}`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APlusContentEditor;
