import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContentBlockType } from '@/types/aplus';
import { Plus, Type, Square, RectangleHorizontal, LayoutPanelLeft, AlignLeft } from 'lucide-react';

interface AddBlockButtonProps {
  onAdd: (type: ContentBlockType) => void;
}

const blockTypes: { type: ContentBlockType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'title', label: 'Title', icon: <Type className="w-4 h-4" />, description: 'Add a heading' },
  { type: 'square_image', label: 'Square Image', icon: <Square className="w-4 h-4" />, description: '1:1 aspect ratio image' },
  { type: 'banner', label: 'Banner', icon: <RectangleHorizontal className="w-4 h-4" />, description: 'Wide banner image' },
  { type: 'image_text', label: 'Image + Text', icon: <LayoutPanelLeft className="w-4 h-4" />, description: 'Image with side text' },
  { type: 'paragraph', label: 'Paragraph', icon: <AlignLeft className="w-4 h-4" />, description: 'Text paragraph' },
];

const AddBlockButton = ({ onAdd }: AddBlockButtonProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" />
          Add Content Block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        {blockTypes.map((item) => (
          <DropdownMenuItem
            key={item.type}
            onClick={() => onAdd(item.type)}
            className="flex items-start gap-3 py-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddBlockButton;
