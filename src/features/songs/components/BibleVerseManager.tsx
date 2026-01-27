/**
 * BibleVerseManager Component
 *
 * Manages an array of Bible verses with inline add/edit/delete functionality.
 * Each verse includes reference, text, and optional version.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BibleVerse } from '@/types/SpiritualContext.types';

export interface BibleVerseManagerProps {
  value: BibleVerse[];
  onChange: (verses: BibleVerse[]) => void;
  disabled?: boolean;
}

interface VerseFormData {
  reference: string;
  text: string;
  version: string;
}

export function BibleVerseManager({
  value,
  onChange,
  disabled = false,
}: BibleVerseManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<VerseFormData>({
    reference: '',
    text: '',
    version: '',
  });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const resetForm = () => {
    setFormData({ reference: '', text: '', version: '' });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
  };

  const startEditing = (index: number) => {
    const verse = value[index];
    setFormData({
      reference: verse.reference,
      text: verse.text,
      version: verse.version || '',
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.reference.trim() || !formData.text.trim()) {
      return;
    }

    const newVerse: BibleVerse = {
      reference: formData.reference.trim(),
      text: formData.text.trim(),
      version: formData.version.trim() || undefined,
    };

    if (editingIndex !== null) {
      // Update existing verse
      const updated = [...value];
      updated[editingIndex] = newVerse;
      onChange(updated);
    } else {
      // Add new verse
      onChange([...value, newVerse]);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="h-4 w-4" />
          Bible Verses
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
            Add Verse
          </Button>
        )}
      </div>

      {/* Existing verses list */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((verse, index) => (
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
                      <Label htmlFor={`edit-reference-${index}`}>
                        Reference <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`edit-reference-${index}`}
                        value={formData.reference}
                        onChange={(e) =>
                          setFormData({ ...formData, reference: e.target.value })
                        }
                        placeholder="e.g., John 3:16"
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-text-${index}`}>
                        Verse Text <span className="text-destructive">*</span>
                      </Label>
                      <textarea
                        id={`edit-text-${index}`}
                        value={formData.text}
                        onChange={(e) =>
                          setFormData({ ...formData, text: e.target.value })
                        }
                        placeholder="Enter the full verse text..."
                        disabled={disabled}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-version-${index}`}>
                        Version (optional)
                      </Label>
                      <Input
                        id={`edit-version-${index}`}
                        value={formData.version}
                        onChange={(e) =>
                          setFormData({ ...formData, version: e.target.value })
                        }
                        placeholder="e.g., NIV, ESV, KJV"
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
                          !formData.reference.trim() ||
                          !formData.text.trim()
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
                      <button
                        type="button"
                        onClick={() => toggleExpand(index)}
                        className="font-semibold text-sm text-left hover:text-primary transition-colors"
                      >
                        {verse.reference}
                      </button>
                      <div className="flex items-center gap-1">
                        {verse.version && (
                          <Badge variant="outline" className="text-xs">
                            {verse.version}
                          </Badge>
                        )}
                        {!disabled && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                    <p
                      className={cn(
                        'text-sm italic text-muted-foreground',
                        expandedIndex !== index &&
                          verse.text.length > 150 &&
                          'line-clamp-2'
                      )}
                    >
                      {verse.text}
                    </p>
                    {verse.text.length > 150 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(index)}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        {expandedIndex === index ? 'Show less' : 'Show more'}
                      </button>
                    )}
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
                <Label htmlFor="add-reference">
                  Reference <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="e.g., John 3:16"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="add-text">
                  Verse Text <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="add-text"
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                  placeholder="Enter the full verse text..."
                  disabled={disabled}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="add-version">Version (optional)</Label>
                <Input
                  id="add-version"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData({ ...formData, version: e.target.value })
                  }
                  placeholder="e.g., NIV, ESV, KJV"
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
                    !formData.reference.trim() ||
                    !formData.text.trim()
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Verse
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
          No Bible verses added yet. Click "Add Verse" to get started.
        </p>
      )}
    </div>
  );
}
