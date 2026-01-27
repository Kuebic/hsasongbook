/**
 * QuoteManager Component
 *
 * Manages an array of quotes with source citation.
 * Each quote includes text, source (dropdown), and reference with smart placeholders.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Quote as QuoteIcon, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quote } from '@/types/SpiritualContext.types';
import {
  QUOTE_SOURCES,
  getReferencePlaceholder,
} from '../validation/songSchemas';

export interface QuoteManagerProps {
  value: Quote[];
  onChange: (quotes: Quote[]) => void;
  disabled?: boolean;
}

interface QuoteFormData {
  text: string;
  source: string;
  reference: string;
}

export function QuoteManager({
  value,
  onChange,
  disabled = false,
}: QuoteManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<QuoteFormData>({
    text: '',
    source: 'csg',
    reference: '',
  });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const resetForm = () => {
    setFormData({ text: '', source: 'csg', reference: '' });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
  };

  const startEditing = (index: number) => {
    const quote = value[index];
    setFormData({
      text: quote.text,
      source: quote.source,
      reference: quote.reference,
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (
      !formData.text.trim() ||
      !formData.source.trim() ||
      !formData.reference.trim()
    ) {
      return;
    }

    const newQuote: Quote = {
      text: formData.text.trim(),
      source: formData.source.trim(),
      reference: formData.reference.trim(),
    };

    if (editingIndex !== null) {
      // Update existing quote
      const updated = [...value];
      updated[editingIndex] = newQuote;
      onChange(updated);
    } else {
      // Add new quote
      onChange([...value, newQuote]);
    }

    resetForm();
  };

  const handleDelete = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
    if (editingIndex === index) {
      resetForm();
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getSourceLabel = (sourceValue: string) => {
    return (
      QUOTE_SOURCES.find((s) => s.value === sourceValue)?.label || sourceValue
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <QuoteIcon className="h-4 w-4" />
          Quotes
        </Label>
        {!isAdding && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startAdding}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Quote
          </Button>
        )}
      </div>

      {/* Existing quotes list */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((quote, index) => (
            <Card
              key={index}
              className={cn(
                'transition-colors',
                editingIndex === index && 'ring-2 ring-primary'
              )}
            >
              <CardContent className="p-4">
                {editingIndex === index ? (
                  // Edit form
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`edit-text-${index}`}>
                        Quote Text <span className="text-destructive">*</span>
                      </Label>
                      <textarea
                        id={`edit-text-${index}`}
                        value={formData.text}
                        onChange={(e) =>
                          setFormData({ ...formData, text: e.target.value })
                        }
                        placeholder="Enter the quote text..."
                        disabled={disabled}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-source-${index}`}>
                        Source <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.source}
                        onValueChange={(value) =>
                          setFormData({ ...formData, source: value })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger id={`edit-source-${index}`}>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUOTE_SOURCES.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`edit-reference-${index}`}>
                        Reference <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`edit-reference-${index}`}
                        value={formData.reference}
                        onChange={(e) =>
                          setFormData({ ...formData, reference: e.target.value })
                        }
                        placeholder={getReferencePlaceholder(formData.source)}
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={
                          disabled ||
                          !formData.text.trim() ||
                          !formData.source.trim() ||
                          !formData.reference.trim()
                        }
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetForm}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(index)}
                          className={cn(
                            'text-sm italic text-muted-foreground text-left hover:text-foreground transition-colors',
                            expandedIndex !== index &&
                              quote.text.length > 120 &&
                              'line-clamp-2'
                          )}
                        >
                          "{quote.text}"
                        </button>
                        {quote.text.length > 120 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(index)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            {expandedIndex === index ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                      {!disabled && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {getSourceLabel(quote.source)}
                      </Badge>
                      <span>—</span>
                      <span>{quote.reference}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <Card className="ring-2 ring-primary">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="add-text">
                  Quote Text <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="add-text"
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                  placeholder="Enter the quote text..."
                  disabled={disabled}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="add-source">
                  Source <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData({ ...formData, source: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger id="add-source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTE_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="add-reference">
                  Reference <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder={getReferencePlaceholder(formData.source)}
                  disabled={disabled}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={
                    disabled ||
                    !formData.text.trim() ||
                    !formData.source.trim() ||
                    !formData.reference.trim()
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Quote
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  disabled={disabled}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {value.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">
          No quotes added yet. Click "Add Quote" to get started.
        </p>
      )}
    </div>
  );
}
