export type ContentBlockType = 'title' | 'square_image' | 'banner' | 'image_text' | 'paragraph';

export interface BaseContentBlock {
  id: string;
  type: ContentBlockType;
}

export interface TitleBlock extends BaseContentBlock {
  type: 'title';
  text: string;
  size: 'small' | 'medium' | 'large';
}

export interface SquareImageBlock extends BaseContentBlock {
  type: 'square_image';
  imageUrl: string;
  alt: string;
}

export interface BannerBlock extends BaseContentBlock {
  type: 'banner';
  imageUrl: string;
  alt: string;
}

export interface ImageTextBlock extends BaseContentBlock {
  type: 'image_text';
  imageUrl: string;
  alt: string;
  text: string;
  imagePosition: 'left' | 'right';
}

export interface ParagraphBlock extends BaseContentBlock {
  type: 'paragraph';
  text: string;
}

export type ContentBlock = TitleBlock | SquareImageBlock | BannerBlock | ImageTextBlock | ParagraphBlock;

export const createEmptyBlock = (type: ContentBlockType): ContentBlock => {
  const id = crypto.randomUUID();
  
  switch (type) {
    case 'title':
      return { id, type: 'title', text: '', size: 'medium' };
    case 'square_image':
      return { id, type: 'square_image', imageUrl: '', alt: '' };
    case 'banner':
      return { id, type: 'banner', imageUrl: '', alt: '' };
    case 'image_text':
      return { id, type: 'image_text', imageUrl: '', alt: '', text: '', imagePosition: 'left' };
    case 'paragraph':
      return { id, type: 'paragraph', text: '' };
  }
};
