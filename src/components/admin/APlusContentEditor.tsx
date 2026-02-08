import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Save, Plus, X, Loader2, GripVertical, Trash2, IndianRupee, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ImageUploader from './ImageUploader';
import APlusPreview from './APlusPreview';
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

  const currentContent = allContent?.find(c => c.case_type === selectedCaseType);

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
      setFormState(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormState(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const addBlock = (type: ContentBlockType) => {
    setFormState(prev => ({ ...prev, content_blocks: [...prev.content_blocks, createEmptyBlock(type)] }));
  };

  const updateBlock = (updatedBlock: ContentBlock) => {
    setFormState(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b),
    }));
  };

  const removeBlock = (blockId: string) => {
    setFormState(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.filter(b => b.id !== blockId),
    }));
  };

  const handleSave = async () => {
    await upsertContent.mutateAsync({ case_type: selectedCaseType, ...formState });
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
    <div className="space-y-4">
      {/* Top Bar: Case Type Tabs + Save */}
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

        <TabsContent value={selectedCaseType} className="mt-4">
          {/* Split Layout: Editor Left + Preview Right */}
          <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[600px]">
            {/* Editor Panel - Scrollable */}
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-4 pb-8">
                {/* 1. Pricing Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="price" className="text-xs">Selling Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formState.price}
                          onChange={(e) => setFormState(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="499"
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor="compare_price" className="text-xs">Compare Price (₹)</Label>
                        <Input
                          id="compare_price"
                          type="number"
                          value={formState.compare_price || ''}
                          onChange={(e) => setFormState(prev => ({
                            ...prev,
                            compare_price: e.target.value ? parseFloat(e.target.value) : null
                          }))}
                          placeholder="899 (strikethrough)"
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Default Images Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Default Images (2nd–6th)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Used for products without custom images
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <ImageUploader
                        label="2nd"
                        value={formState.default_image_2 || undefined}
                        onChange={(url) => setFormState(prev => ({ ...prev, default_image_2: url }))}
                        folder={`a-plus/${selectedCaseType}`}
                      />
                      <ImageUploader
                        label="3rd"
                        value={formState.default_image_3 || undefined}
                        onChange={(url) => setFormState(prev => ({ ...prev, default_image_3: url }))}
                        folder={`a-plus/${selectedCaseType}`}
                      />
                      <ImageUploader
                        label="4th"
                        value={formState.default_image_4 || undefined}
                        onChange={(url) => setFormState(prev => ({ ...prev, default_image_4: url }))}
                        folder={`a-plus/${selectedCaseType}`}
                      />
                      <ImageUploader
                        label="5th"
                        value={formState.default_image_5 || undefined}
                        onChange={(url) => setFormState(prev => ({ ...prev, default_image_5: url }))}
                        folder={`a-plus/${selectedCaseType}`}
                      />
                      <ImageUploader
                        label="6th"
                        value={formState.default_image_6 || undefined}
                        onChange={(url) => setFormState(prev => ({ ...prev, default_image_6: url }))}
                        folder={`a-plus/${selectedCaseType}`}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Rich Description */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Description & Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="title" className="text-xs">Title</Label>
                      <Input
                        id="title"
                        value={formState.title}
                        onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={`Premium ${selectedCaseType === 'metal' ? 'Metal' : 'Snap-On'} Case`}
                        className="mt-1 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-xs">Description</Label>
                      <Textarea
                        id="description"
                        value={formState.description}
                        onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Detailed description..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Features</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Add a feature..."
                          className="h-9"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="h-9 px-3">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {formState.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {formState.features.map((feature, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1 px-2.5 py-0.5 bg-secondary rounded-full text-xs"
                            >
                              {feature}
                              <button type="button" onClick={() => removeFeature(index)} className="ml-0.5 hover:text-destructive">
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Content Blocks */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">A+ Content Blocks</CardTitle>
                    <CardDescription className="text-xs">
                      Drag to reorder. Add multiple blocks of any type.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Reorder.Group
                      axis="y"
                      values={formState.content_blocks}
                      onReorder={(newBlocks) => setFormState(prev => ({ ...prev, content_blocks: newBlocks }))}
                      className="space-y-3"
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
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeBlock(block.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <div className="flex-1 p-3 border rounded-lg bg-card">
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
              </div>
            </ScrollArea>

            {/* Preview Panel - Sticky Right */}
            <div className="hidden lg:flex w-[340px] flex-shrink-0 rounded-xl border bg-card overflow-hidden">
              <APlusPreview
                title={formState.title}
                description={formState.description}
                features={formState.features}
                price={formState.price}
                comparePrice={formState.compare_price}
                contentBlocks={formState.content_blocks}
                defaultImages={[
                  formState.default_image_2,
                  formState.default_image_3,
                  formState.default_image_4,
                  formState.default_image_5,
                  formState.default_image_6,
                ]}
                caseType={selectedCaseType}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APlusContentEditor;
