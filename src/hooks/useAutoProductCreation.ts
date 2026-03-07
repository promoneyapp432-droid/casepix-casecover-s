import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useImageUpload } from '@/hooks/useImageUpload';
import { CaseTemplate, Design } from '@/hooks/useDesigns';

export const useAutoProductCreation = () => {
  const { uploadImage } = useImageUpload();

  const mergeImages = useCallback(async (designImageUrl: string, template: CaseTemplate): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
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

        canvas.width = templateImg.width;
        canvas.height = templateImg.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const maskX = (template.mask_x / 100) * canvas.width;
        const maskY = (template.mask_y / 100) * canvas.height;
        const maskW = (template.mask_width / 100) * canvas.width;
        const maskH = (template.mask_height / 100) * canvas.height;

        ctx.drawImage(designImg, maskX, maskY, maskW, maskH);
        ctx.drawImage(templateImg, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };

      templateImg.onload = onBothLoaded;
      designImg.onload = onBothLoaded;
      templateImg.onerror = () => reject('Failed to load template');
      designImg.onerror = () => reject('Failed to load design');

      designImg.src = designImageUrl;
      templateImg.src = template.template_image;
    });
  }, []);

  const createProductFromDesignAndTemplate = useCallback(async (
    design: Design,
    template: CaseTemplate
  ): Promise<boolean> => {
    try {
      const images = design.design_images || [];
      if (images.length === 0) return false;

      // Check for duplicate
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('design_id' as any, design.id)
        .eq('template_id' as any, template.id)
        .limit(1);
      if (existing && existing.length > 0) return false;

      // Merge first image
      const mainMerged = await mergeImages(images[0].image_url, template);
      const mainResp = await fetch(mainMerged);
      const mainBlob = await mainResp.blob();
      const mainFile = new File([mainBlob], `product-${Date.now()}.png`, { type: 'image/png' });
      const mainUrl = await uploadImage(mainFile, 'products');
      if (!mainUrl) return false;

      // Merge additional images
      const additionalUrls: string[] = [];
      for (let i = 1; i < Math.min(images.length, 6); i++) {
        try {
          const merged = await mergeImages(images[i].image_url, template);
          const resp = await fetch(merged);
          const blob = await resp.blob();
          const file = new File([blob], `product-${Date.now()}-${i}.png`, { type: 'image/png' });
          const url = await uploadImage(file, 'products');
          if (url) additionalUrls.push(url);
        } catch { /* skip */ }
      }

      // Insert product
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name: design.name,
          category_id: design.category_id || null,
          design_id: design.id,
          template_id: template.id,
          image: mainUrl,
          image_2: additionalUrls[0] || null,
          image_3: additionalUrls[1] || null,
          image_4: additionalUrls[2] || null,
          image_5: additionalUrls[3] || null,
          image_6: additionalUrls[4] || null,
          base_price: template.case_type === 'metal' ? 699 : 499,
          is_new: true,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Insert variant
      await supabase.from('product_variants').insert({
        product_id: product.id,
        case_type: template.case_type,
        title: `${design.name} - ${template.case_type === 'metal' ? 'Metal' : 'Snap'} Case`,
        price: template.case_type === 'metal' ? 699 : 499,
        stock: 100,
        image: mainUrl,
      });

      return true;
    } catch (err) {
      console.error('Auto-product creation failed:', err);
      return false;
    }
  }, [mergeImages, uploadImage]);

  const createProductsForDesign = useCallback(async (design: Design) => {
    const { data: templates } = await supabase
      .from('case_templates')
      .select('*');
    if (!templates?.length) return 0;

    let created = 0;
    for (const template of templates) {
      const success = await createProductFromDesignAndTemplate(design, template as CaseTemplate);
      if (success) created++;
    }
    return created;
  }, [createProductFromDesignAndTemplate]);

  const createProductsForTemplate = useCallback(async (template: CaseTemplate) => {
    const { data: designs } = await supabase
      .from('designs')
      .select('*, design_images(*)');
    if (!designs?.length) return 0;

    let created = 0;
    for (const design of designs) {
      const success = await createProductFromDesignAndTemplate(design as Design, template);
      if (success) created++;
    }
    return created;
  }, [createProductFromDesignAndTemplate]);

  return {
    createProductsForDesign,
    createProductsForTemplate,
    createProductFromDesignAndTemplate,
    mergeImages,
  };
};
