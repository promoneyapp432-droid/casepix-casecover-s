import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, X, Loader2 } from 'lucide-react';
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

type CaseType = Database['public']['Enums']['case_type'];

interface ContentFormState {
  title: string;
  description: string;
  features: string[];
  default_image_2: string | null;
  default_image_3: string | null;
  default_image_4: string | null;
  default_image_5: string | null;
  default_image_6: string | null;
}

const defaultFormState: ContentFormState = {
  title: '',
  description: '',
  features: [],
  default_image_2: null,
  default_image_3: null,
  default_image_4: null,
  default_image_5: null,
  default_image_6: null,
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
        default_image_2: currentContent.default_image_2,
        default_image_3: currentContent.default_image_3,
        default_image_4: currentContent.default_image_4,
        default_image_5: currentContent.default_image_5,
        default_image_6: currentContent.default_image_6,
      });
    } else {
      setFormState(defaultFormState);
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
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600" />
              Metal Case
            </TabsTrigger>
            <TabsTrigger value="snap" className="gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
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
