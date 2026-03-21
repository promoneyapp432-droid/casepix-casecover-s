import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useImageUpload } from '@/hooks/useImageUpload';
import { CaseTemplate, Design } from '@/hooks/useDesigns';

type ProductSyncOptions = {
  upsertExisting?: boolean;
};

export const useAutoProductCreation = () => {
  const { uploadImage } = useImageUpload();

  const getBasePrice = useCallback((caseType: CaseTemplate['case_type']) => (
    caseType === 'metal' ? 699 : 499
  ), []);

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

        ctx.drawImage(designImg, srcX, srcY, srcW, srcH, maskX, maskY, maskW, maskH);
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

  const buildMergedProductImages = useCallback(async (
    design: Design,
    template: CaseTemplate,
  ): Promise<{ mainUrl: string; additionalUrls: string[] } | null> => {
    const images = design.design_images || [];
    if (images.length === 0) return null;

    const mainMerged = await mergeImages(images[0].image_url, template);
    const mainResp = await fetch(mainMerged);
    const mainBlob = await mainResp.blob();
    const mainFile = new File([mainBlob], `product-${Date.now()}.png`, { type: 'image/png' });
    const mainUrl = await uploadImage(mainFile, 'products');
    if (!mainUrl) return null;

    const additionalUrls: string[] = [];
    for (let i = 1; i < Math.min(images.length, 6); i++) {
      try {
        const merged = await mergeImages(images[i].image_url, template);
        const resp = await fetch(merged);
        const blob = await resp.blob();
        const file = new File([blob], `product-${Date.now()}-${i}.png`, { type: 'image/png' });
        const url = await uploadImage(file, 'products');
        if (url) additionalUrls.push(url);
      } catch {
        // Skip failed additional image merges
      }
    }

    return { mainUrl, additionalUrls };
  }, [mergeImages, uploadImage]);

  const upsertVariant = useCallback(async (
    productId: string,
    designName: string,
    template: CaseTemplate,
    imageUrl: string,
  ) => {
    const price = getBasePrice(template.case_type);
    const title = `${designName} - ${template.case_type === 'metal' ? 'Metal' : 'Snap'} Case`;

    const { data: existingVariant, error: existingVariantError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId)
      .eq('case_type', template.case_type)
      .limit(1);

    if (existingVariantError) throw existingVariantError;

    if (existingVariant && existingVariant.length > 0) {
      const { error } = await supabase
        .from('product_variants')
        .update({
          title,
          price,
          stock: 100,
          image: imageUrl,
          case_type: template.case_type,
        })
        .eq('id', existingVariant[0].id);

      if (error) throw error;
      return;
    }

    const { error } = await supabase.from('product_variants').insert({
      product_id: productId,
      case_type: template.case_type,
      title,
      price,
      stock: 100,
      image: imageUrl,
    });

    if (error) throw error;
  }, [getBasePrice]);

  const createProductFromDesignAndTemplate = useCallback(async (
    design: Design,
    template: CaseTemplate,
    options: ProductSyncOptions = {}
  ): Promise<boolean> => {
    try {
      const { upsertExisting = false } = options;

      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .filter('design_id', 'eq', design.id)
        .filter('template_id', 'eq', template.id)
        .limit(1);
      const existingProduct = existing?.[0];

      if (existingProduct && !upsertExisting) {
        return false;
      }

      const mergedImages = await buildMergedProductImages(design, template);
      if (!mergedImages) return false;

      const basePrice = getBasePrice(template.case_type);

      const productPayload = {
        name: design.name,
        category_id: design.category_id || null,
        design_id: design.id,
        template_id: template.id,
        image: mergedImages.mainUrl,
        image_2: mergedImages.additionalUrls[0] || null,
        image_3: mergedImages.additionalUrls[1] || null,
        image_4: mergedImages.additionalUrls[2] || null,
        image_5: mergedImages.additionalUrls[3] || null,
        image_6: mergedImages.additionalUrls[4] || null,
        base_price: basePrice,
        is_new: true,
      };

      let productId = existingProduct?.id;

      if (productId) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productPayload as any)
          .eq('id', productId);

        if (updateError) throw updateError;
      } else {
        const { data: product, error: insertError } = await supabase
          .from('products')
          .insert(productPayload as any)
          .select('id')
          .single();

        if (insertError) throw insertError;
        productId = product.id;
      }

      await upsertVariant(productId!, design.name, template, mergedImages.mainUrl);

      return true;
    } catch (err) {
      console.error('Auto-product creation failed:', err);
      return false;
    }
  }, [buildMergedProductImages, getBasePrice, upsertVariant]);

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

  const createProductsForTemplate = useCallback(async (
    template: CaseTemplate,
    options: ProductSyncOptions = {}
  ) => {
    const { data: designs } = await supabase
      .from('designs')
      .select('*, design_images(*)');
    if (!designs?.length) return 0;

    let created = 0;
    for (const design of designs) {
      const success = await createProductFromDesignAndTemplate(design as Design, template, options);
      if (success) created++;
    }
    return created;
  }, [createProductFromDesignAndTemplate]);

  const deleteProductsByField = useCallback(async (
    field: 'design_id' | 'template_id',
    value: string,
  ) => {
    const { data: linkedProducts, error: linkedProductsError } = await supabase
      .from('products')
      .select('id')
      .eq(field as any, value);

    if (linkedProductsError) throw linkedProductsError;
    if (!linkedProducts?.length) return 0;

    const productIds = linkedProducts.map((product) => product.id);

    const { error: variantsError } = await supabase
      .from('product_variants')
      .delete()
      .in('product_id', productIds);

    if (variantsError) throw variantsError;

    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .in('id', productIds);

    if (productsError) throw productsError;

    return productIds.length;
  }, []);

  const deleteProductsForDesign = useCallback(async (designId: string) => {
    try {
      return await deleteProductsByField('design_id', designId);
    } catch (err) {
      console.error('Delete products by design failed:', err);
      return 0;
    }
  }, [deleteProductsByField]);

  const deleteProductsForTemplate = useCallback(async (templateId: string) => {
    try {
      return await deleteProductsByField('template_id', templateId);
    } catch (err) {
      console.error('Delete products by template failed:', err);
      return 0;
    }
  }, [deleteProductsByField]);

  return {
    createProductsForDesign,
    createProductsForTemplate,
    createProductFromDesignAndTemplate,
    deleteProductsForDesign,
    deleteProductsForTemplate,
    mergeImages,
  };
};
