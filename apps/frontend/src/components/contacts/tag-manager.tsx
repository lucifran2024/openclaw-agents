'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Tag } from '@/hooks/use-contacts';

interface TagManagerProps {
  contactId: string;
  currentTags: Array<{ id: string; name: string; color?: string }>;
  allTags: Tag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  isAdding?: boolean;
  isRemoving?: boolean;
}

export function TagManager({
  contactId,
  currentTags,
  allTags,
  onAddTag,
  onRemoveTag,
  isAdding,
  isRemoving,
}: TagManagerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTagIds = new Set(currentTags.map((t) => t.id));

  const filteredTags = useMemo(() => {
    return allTags.filter(
      (tag) =>
        !currentTagIds.has(tag.id) &&
        tag.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [allTags, currentTagIds, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearch('');
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentTags.length === 0 && (
          <p className="text-sm text-[var(--color-muted-foreground)]">Nenhuma tag adicionada</p>
        )}
        {currentTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="flex items-center gap-1 pr-1"
            style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
          >
            {tag.name}
            <button
              onClick={() => onRemoveTag(tag.id)}
              disabled={isRemoving}
              className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--color-accent)]"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Tag
        </Button>

        {showDropdown && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tag..."
                  className="pl-8 h-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto px-1 pb-1">
              {filteredTags.length === 0 ? (
                <p className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                  Nenhuma tag encontrada
                </p>
              ) : (
                filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onAddTag(tag.id);
                      setSearch('');
                    }}
                    disabled={isAdding}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--color-foreground)] hover:bg-[var(--color-accent)]"
                  >
                    {tag.color && (
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
