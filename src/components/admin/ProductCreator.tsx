import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Wand2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useDesigns, useCaseTemplates, Design, CaseTemplate } from '@/hooks/useDesigns';
import { useCategories } from '@/hooks/useCategories';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ProductCreator = () => {
  const { data: designs } = useDesigns();
  const { data: categories } = useCategories();
  const { data: templates } = useCaseTemplates();
  const { uploadImage } = useImageUpload();
  const queryClient = useQueryClient();

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedDesignId, setSelectedDesignId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [productName, setProductName] = useState('');
  const [mergedPreview, setMergedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedDesign = designs?.find(d => d.id === selectedDesignId);
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  // Filter designs by selected category
  const filteredDesigns = selectedCategoryId
    ? designs?.filter(d => d.category_id === selectedCategoryId)
    : designs;

  // Auto-set product name from design
  useEffect(() => {
    if (selectedDesign && !productName) {
      setProductName(selectedDesign.name);
    }
  }, [selectedDesign]);

  const mergeImages = useCallback(async (designImageUrl: string, template: CaseTemplate): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject('Canvas not found');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not found');

      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      const designImg = new Image();
      designImg.crossOrigin = 'anonymous';

      let loadedCount = 0;
      const onBothLoaded = () => {
        loadedCount++;
        if (loadedCount < 2) return;

        // Set canvas size to template
        canvas.width = templateImg.width;
        canvas.height = templateImg.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate mask area in pixels
        const maskX = (template.mask_x / 100) * canvas.width;
        const maskY = (template.mask_y / 100) * canvas.height;
        const maskW = (template.mask_width / 100) * canvas.width;
        const maskH = (template.mask_height / 100) * canvas.height;

        // Use "cover" approach: fill mask area while maintaining aspect ratio
        const designAspect = designImg.width / designImg.height;
        const maskAspect = maskW / maskH;
        let srcX = 0, srcY = 0, srcW = designImg.width, srcH = designImg.height;

        if (designAspect > maskAspect) {
          srcW = designImg.height * maskAspect;
          srcX = (designImg.width - srcW) / 2;
        } else {
          srcH = designImg.width / maskAspect;
          srcY = (designImg.height - srcH) / 2;
        }

        // Draw design in mask area first (behind template)
        ctx.drawImage(designImg, srcX, srcY, srcW, srcH, maskX, maskY, maskW, maskH);

        // Draw template on top (transparent areas show design through)
        ctx.drawImage(templateImg, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };

      templateImg.onload = onBothLoaded;
      designImg.onload = onBothLoaded;
      templateImg.onerror = () => reject('Failed to load template');
      designImg.onerror = () => reject('Failed to load design');

      templateImg.src = designImageUrl.startsWith('http') ? designImageUrl : designImageUrl;
      // Swap: template is the phone case, design goes behind
      designImg.src = designImageUrl;
      templateImg.src = template.template_image;
    });
  }, []);

  const generatePreview = async () => {
    if (!selectedDesign || !selectedTemplate) {
      toast.error('Select a design and template');
      return;
    }
    const firstImage = selectedDesign.design_images?.[0];
    if (!firstImage) {
      toast.error('Design has no images');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await mergeImages(firstImage.image_url, selectedTemplate);
      setMergedPreview(result);
    } catch (err: any) {
      toast.error('Failed to generate preview: ' + err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async () => {
      if (!selectedDesign || !selectedTemplate || !mergedPreview || !productName) {
        throw new Error('Missing required fields');
      }

      // Convert canvas data URL to blob and upload
      const response = await fetch(mergedPreview);
      const blob = await response.blob();
      const file = new File([blob], `product-${Date.now()}.png`, { type: 'image/png' });
      const imageUrl = await uploadImage(file, 'products');
      if (!imageUrl) throw new Error('Failed to upload merged image');

      // Generate additional merged images for other design images
      const additionalImages: string[] = [];
      const designImages = selectedDesign.design_images || [];
      for (let i = 1; i < Math.min(designImages.length, 6); i++) {
        try {
          const merged = await mergeImages(designImages[i].image_url, selectedTemplate);
          const resp = await fetch(merged);
          const b = await resp.blob();
          const f = new File([b], `product-${Date.now()}-${i}.png`, { type: 'image/png' });
          const url = await uploadImage(f, 'products');
          if (url) additionalImages.push(url);
        } catch { /* skip failed merges */ }
      }

      // Insert product
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name: productName,
          category_id: selectedCategoryId || null,
          image: imageUrl,
          image_2: additionalImages[0] || null,
          image_3: additionalImages[1] || null,
          image_4: additionalImages[2] || null,
          image_5: additionalImages[3] || null,
          image_6: additionalImages[4] || null,
          base_price: 499,
          is_new: true,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert variant for selected case type
      const { error: variantErr } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          case_type: selectedTemplate.case_type,
          title: `${productName} - ${selectedTemplate.case_type === 'metal' ? 'Metal' : 'Snap'} Case`,
          price: selectedTemplate.case_type === 'metal' ? 699 : 499,
          stock: 100,
          image: imageUrl,
        });
      if (variantErr) throw variantErr;

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created with merged images!');
      setProductName('');
      setSelectedDesignId('');
      setMergedPreview(null);
    },
    onError: (err: any) => {
      toast.error('Failed to create product: ' + err.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">Create Product from Design</h3>
        <p className="text-sm text-muted-foreground">
          Select a design + case template → auto-merge → create product
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div>
            <Label>Category (filter designs)</Label>
            <Select value={selectedCategoryId} onValueChange={(v) => { setSelectedCategoryId(v); setSelectedDesignId(''); }}>
              <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                {categories?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Design</Label>
            <Select value={selectedDesignId} onValueChange={setSelectedDesignId}>
              <SelectTrigger><SelectValue placeholder="Select design" /></SelectTrigger>
              <SelectContent>
                {filteredDesigns?.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.design_images?.length || 0} images)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Design images preview */}
          {selectedDesign?.design_images && selectedDesign.design_images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedDesign.design_images.map(img => (
                <img key={img.id} src={img.image_url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
              ))}
            </div>
          )}

          <div>
            <Label>Case Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger><SelectValue placeholder="Select case template" /></SelectTrigger>
              <SelectContent>
                {templates?.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.case_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Product Name</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Product name"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generatePreview}
              disabled={!selectedDesignId || !selectedTemplateId || isGenerating}
              variant="outline"
              className="flex-1"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
              Preview Merge
            </Button>
            <Button
              onClick={() => createProduct.mutate()}
              disabled={!mergedPreview || !productName || createProduct.isPending}
              className="gradient-primary flex-1"
            >
              {createProduct.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Create Product
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-xs aspect-[3/4] bg-muted rounded-xl border flex items-center justify-center overflow-hidden">
            {mergedPreview ? (
              <img src={mergedPreview} alt="Merged preview" className="w-full h-full object-contain" />
            ) : selectedTemplate ? (
              <div className="relative w-full h-full">
                <img src={selectedTemplate.template_image} alt="Template" className="w-full h-full object-contain" />
                <div
                  className="absolute border-2 border-dashed border-primary/50 bg-primary/10 rounded"
                  style={{
                    left: `${selectedTemplate.mask_x}%`,
                    top: `${selectedTemplate.mask_y}%`,
                    width: `${selectedTemplate.mask_width}%`,
                    height: `${selectedTemplate.mask_height}%`,
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center px-4">
                Select a design & template to preview the merged result
              </p>
            )}
          </div>
          {mergedPreview && (
            <p className="text-xs text-muted-foreground">
              ✅ Preview ready — Click "Create Product" to save
            </p>
          )}
        </div>
      </div>

      {/* Hidden canvas for merging */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ProductCreator;
