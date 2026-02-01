import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TitleBlock } from '@/types/aplus';
import { Type } from 'lucide-react';

interface TitleBlockEditorProps {
  block: TitleBlock;
  onChange: (block: TitleBlock) => void;
}

const TitleBlockEditor = ({ block, onChange }: TitleBlockEditorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Type className="w-4 h-4" />
        Title Block
      </div>
      
      <div className="grid gap-4 md:grid-cols-[1fr,150px]">
        <div>
          <Label htmlFor={`title-${block.id}`}>Title Text</Label>
          <Input
            id={`title-${block.id}`}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Enter title..."
          />
        </div>
        
        <div>
          <Label>Size</Label>
          <Select
            value={block.size}
            onValueChange={(size: 'small' | 'medium' | 'large') => onChange({ ...block, size })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Preview */}
      {block.text && (
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <h3 className={
            block.size === 'large' ? 'text-3xl font-bold' :
            block.size === 'medium' ? 'text-2xl font-semibold' :
            'text-xl font-medium'
          }>
            {block.text}
          </h3>
        </div>
      )}
    </div>
  );
};

export default TitleBlockEditor;
