import React, { useState } from 'react';
import { Category } from '../types';
import { X, Plus, Check } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  onCreateCategory: (name: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      onCreateCategory(newCatName.trim());
      setNewCatName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0B]/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-[#2A2A2E] rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E]">
          <h3 className="text-sm font-bold text-[#E1E1E6]">Select Library Category</h3>
          <button onClick={onClose} className="text-[#94949D] hover:text-[#E1E1E6] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3 space-y-1.5 max-h-60 overflow-y-auto my-2">
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-[#E09F3E] text-black font-bold'
                : 'bg-[#161618] text-[#E1E1E6] hover:bg-[#2A2A2E]'
            }`}
          >
            <span>Default (Uncategorized)</span>
            {selectedCategoryId === null && <Check className="w-4 h-4" />}
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-[#E09F3E] text-black font-bold'
                  : 'bg-[#161618] text-[#E1E1E6] hover:bg-[#2A2A2E]'
              }`}
            >
              <span>{cat.name}</span>
              {selectedCategoryId === cat.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>

        {isAdding ? (
          <form onSubmit={handleCreate} className="flex gap-2 pt-2 border-t border-[#2A2A2E]">
            <input
              type="text"
              placeholder="Category name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 bg-[#0A0A0B] border border-[#2A2A2E] text-[#E1E1E6] px-3 py-1.5 rounded-lg text-xs focus:outline-hidden focus:border-[#E09F3E]"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#E09F3E] text-black text-xs font-bold rounded-lg hover:bg-[#c98e37]"
            >
              Add
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-[#E09F3E] hover:text-[#c98e37] font-semibold py-2 border-t border-[#2A2A2E]"
          >
            <Plus className="w-4 h-4" />
            Create new category
          </button>
        )}
      </div>
    </div>
  );
};
