import { ContentBlock } from '@/types/aplus';
import TitleBlockEditor from './TitleBlockEditor';
import SquareImageBlockEditor from './SquareImageBlockEditor';
import BannerBlockEditor from './BannerBlockEditor';
import ImageTextBlockEditor from './ImageTextBlockEditor';
import ParagraphBlockEditor from './ParagraphBlockEditor';

interface ContentBlockRendererProps {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
  caseType: string;
}

const ContentBlockRenderer = ({ block, onChange, caseType }: ContentBlockRendererProps) => {
  switch (block.type) {
    case 'title':
      return (
        <TitleBlockEditor
          block={block}
          onChange={onChange}
        />
      );
    case 'square_image':
      return (
        <SquareImageBlockEditor
          block={block}
          onChange={onChange}
          caseType={caseType}
        />
      );
    case 'banner':
      return (
        <BannerBlockEditor
          block={block}
          onChange={onChange}
          caseType={caseType}
        />
      );
    case 'image_text':
      return (
        <ImageTextBlockEditor
          block={block}
          onChange={onChange}
          caseType={caseType}
        />
      );
    case 'paragraph':
      return (
        <ParagraphBlockEditor
          block={block}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
};

export default ContentBlockRenderer;
