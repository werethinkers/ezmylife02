import React, { useEffect, useRef } from 'react';

export interface AutocompleteSuggestion {
  key: string;
  value: string;
}

interface AutocompleteMenuProps {
  suggestions: AutocompleteSuggestion[];
  position: { top: number; left: number };
  selectedIndex: number;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
}

export const AutocompleteMenu: React.FC<AutocompleteMenuProps> = ({
  suggestions,
  position,
  selectedIndex,
  onSelect,
}) => {
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Scroll the selected item into view if the list is long
    if (menuRef.current) {
      const selectedItem = menuRef.current.children[selectedIndex] as HTMLLIElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', inline: 'start' });
      }
    }
  }, [selectedIndex]);

  return (
    <ul
      ref={menuRef}
      className="absolute z-20 w-80 max-h-60 overflow-y-auto bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-lg"
      style={{ top: position.top, left: position.left }}
      role="listbox"
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.key}
          className={`px-3 py-2 cursor-pointer ${
            index === selectedIndex
              ? 'bg-sky-100 dark:bg-sky-900'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'
          }`}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent editor from losing focus before selection
            onSelect(suggestion);
          }}
          role="option"
          aria-selected={index === selectedIndex}
        >
          <div className="flex justify-between items-center">
            <span className="font-bold text-sky-600 dark:text-sky-400">{suggestion.key}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate" title={suggestion.value}>
            {suggestion.value.replace(/\n/g, ' ')}
          </p>
        </li>
      ))}
    </ul>
  );
};