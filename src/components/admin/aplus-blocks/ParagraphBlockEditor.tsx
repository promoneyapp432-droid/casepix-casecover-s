import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ParagraphBlock } from '@/types/aplus';
import { AlignLeft } from 'lucide-react';

interface ParagraphBlockEditorProps {
  block: ParagraphBlock;
  onChange: (block: ParagraphBlock) => void;
}

const ParagraphBlockEditor = ({ block, onChange }: ParagraphBlockEditorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <AlignLeft className="w-4 h-4" />
        Paragraph Block
      </div>
      
      <div>
        <Label htmlFor={`paragraph-${block.id}`}>Paragraph Text</Label>
        <Textarea
          id={`paragraph-${block.id}`}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Enter your paragraph text..."
          rows={5}
        />
      </div>
      
      {/* Preview */}
      {block.text && (
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <p className="text-sm leading-relaxed">{block.text}</p>
        </div>
      )}
    </div>
  );
};

export default ParagraphBlockEditor;
