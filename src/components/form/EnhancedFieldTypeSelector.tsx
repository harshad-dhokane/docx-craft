
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ImageIcon, Upload, Type, Hash, AlignLeft } from "lucide-react";
import { format } from "date-fns";

interface EnhancedFieldTypeSelectorProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export type FieldType = "text" | "number" | "date" | "image" | "textarea" | "email" | "phone";

const EnhancedFieldTypeSelector = ({ placeholder, value, onChange }: EnhancedFieldTypeSelectorProps) => {
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 150, height: 100 });
  const [selectedDate, setSelectedDate] = useState<Date>();

  const getFieldTypeIcon = (type: FieldType) => {
    switch (type) {
      case "text": return <Type className="h-4 w-4" />;
      case "number": return <Hash className="h-4 w-4" />;
      case "textarea": return <AlignLeft className="h-4 w-4" />;
      case "date": return <CalendarIcon className="h-4 w-4" />;
      case "image": return <ImageIcon className="h-4 w-4" />;
      case "email": return <Type className="h-4 w-4" />;
      case "phone": return <Hash className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        onChange(`[Image: ${file.name} - ${imageDimensions.width}x${imageDimensions.height}px]`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      onChange(format(date, "PPP"));
    }
  };

  const renderField = () => {
    switch (fieldType) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${placeholder.replace(/[_-]/g, ' ').toLowerCase()}`}
            className="mt-2"
          />
        );
      
      case "email":
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${placeholder.replace(/[_-]/g, ' ').toLowerCase()}`}
            className="mt-2"
          />
        );
      
      case "phone":
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${placeholder.replace(/[_-]/g, ' ').toLowerCase()}`}
            className="mt-2"
          />
        );
      
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${placeholder.replace(/[_-]/g, ' ').toLowerCase()}`}
            className="mt-2"
          />
        );
      
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${placeholder.replace(/[_-]/g, ' ').toLowerCase()}`}
            className="mt-2"
            rows={4}
          />
        );
      
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mt-2 h-10"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : `Select ${placeholder.replace(/[_-]/g, ' ').toLowerCase()}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      
      case "image":
        return (
          <div className="space-y-4 mt-2">
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id={`image-${placeholder}`}
              />
              <label htmlFor={`image-${placeholder}`}>
                <Button variant="outline" className="cursor-pointer h-10" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
              </label>
              {imageFile && (
                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                  {imageFile.name}
                </span>
              )}
            </div>
            
            {imageFile && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
                <div>
                  <Label htmlFor={`width-${placeholder}`} className="text-xs font-medium">
                    Width (px)
                  </Label>
                  <Input
                    id={`width-${placeholder}`}
                    type="number"
                    value={imageDimensions.width}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value) || 150;
                      setImageDimensions(prev => ({ ...prev, width: newWidth }));
                      if (imageFile) {
                        onChange(`[Image: ${imageFile.name} - ${newWidth}x${imageDimensions.height}px]`);
                      }
                    }}
                    className="mt-1 h-8"
                    min="50"
                    max="800"
                  />
                </div>
                <div>
                  <Label htmlFor={`height-${placeholder}`} className="text-xs font-medium">
                    Height (px)
                  </Label>
                  <Input
                    id={`height-${placeholder}`}
                    type="number"
                    value={imageDimensions.height}
                    onChange={(e) => {
                      const newHeight = parseInt(e.target.value) || 100;
                      setImageDimensions(prev => ({ ...prev, height: newHeight }));
                      if (imageFile) {
                        onChange(`[Image: ${imageFile.name} - ${imageDimensions.width}x${newHeight}px]`);
                      }
                    }}
                    className="mt-1 h-8"
                    min="50"
                    max="600"
                  />
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-800 capitalize">
          {placeholder.replace(/[_-]/g, ' ')}
        </Label>
        <Select value={fieldType} onValueChange={(value: FieldType) => setFieldType(value)}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <div className="flex items-center space-x-1">
              {getFieldTypeIcon(fieldType)}
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">
              <div className="flex items-center space-x-2">
                <Type className="h-3 w-3" />
                <span>Text</span>
              </div>
            </SelectItem>
            <SelectItem value="textarea">
              <div className="flex items-center space-x-2">
                <AlignLeft className="h-3 w-3" />
                <span>Long Text</span>
              </div>
            </SelectItem>
            <SelectItem value="number">
              <div className="flex items-center space-x-2">
                <Hash className="h-3 w-3" />
                <span>Number</span>
              </div>
            </SelectItem>
            <SelectItem value="email">
              <div className="flex items-center space-x-2">
                <Type className="h-3 w-3" />
                <span>Email</span>
              </div>
            </SelectItem>
            <SelectItem value="phone">
              <div className="flex items-center space-x-2">
                <Hash className="h-3 w-3" />
                <span>Phone</span>
              </div>
            </SelectItem>
            <SelectItem value="date">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-3 w-3" />
                <span>Date</span>
              </div>
            </SelectItem>
            <SelectItem value="image">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-3 w-3" />
                <span>Image</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {renderField()}
    </div>
  );
};

export default EnhancedFieldTypeSelector;
