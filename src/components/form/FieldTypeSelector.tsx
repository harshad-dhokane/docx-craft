
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ImageIcon, Upload } from "lucide-react";
import { format } from "date-fns";

interface FieldTypeSelectorProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export type FieldType = "text" | "number" | "date" | "image" | "textarea";

const FieldTypeSelector = ({ placeholder, value, onChange }: FieldTypeSelectorProps) => {
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 100, height: 100 });
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      onChange(`[Image: ${file.name}]`);
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
            placeholder={`Enter ${placeholder.replace(/[_-]/g, ' ')}`}
            className="mt-1"
          />
        );
      
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${placeholder.replace(/[_-]/g, ' ')}`}
            className="mt-1"
          />
        );
      
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${placeholder.replace(/[_-]/g, ' ')}`}
            className="mt-1"
            rows={3}
          />
        );
      
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal mt-1"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
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
          <div className="space-y-3 mt-1">
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id={`image-${placeholder}`}
              />
              <label htmlFor={`image-${placeholder}`}>
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
              </label>
              {imageFile && (
                <span className="text-sm text-gray-600">{imageFile.name}</span>
              )}
            </div>
            
            {imageFile && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`width-${placeholder}`} className="text-xs">Width (px)</Label>
                  <Input
                    id={`width-${placeholder}`}
                    type="number"
                    value={imageDimensions.width}
                    onChange={(e) => setImageDimensions(prev => ({ ...prev, width: parseInt(e.target.value) || 100 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`height-${placeholder}`} className="text-xs">Height (px)</Label>
                  <Input
                    id={`height-${placeholder}`}
                    type="number"
                    value={imageDimensions.height}
                    onChange={(e) => setImageDimensions(prev => ({ ...prev, height: parseInt(e.target.value) || 100 }))}
                    className="mt-1"
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
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <Label className="capitalize text-sm font-medium text-gray-700">
          {placeholder.replace(/[_-]/g, ' ')}
        </Label>
        <Select value={fieldType} onValueChange={(value: FieldType) => setFieldType(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="textarea">Long Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {renderField()}
    </div>
  );
};

export default FieldTypeSelector;
