import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface Party {
  id: string;
  party_code: string;
  name: string;
  nse_code: string | null;
  trading_slab: number;
  delivery_slab: number;
}

interface EditableCellWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  className?: string;
  isPartyColumn?: boolean;
  parties?: Party[]; // Make parties optional
}

export const EditableCellWithSuggestions: React.FC<EditableCellWithSuggestionsProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  autoFocus = false,
  className = "",
  isPartyColumn = false,
  parties = []
}) => {
  const [suggestions, setSuggestions] = useState<Party[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle input change and show suggestions for party codes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Debug logging
    // console.log('Input change:', { inputValue, isPartyColumn, partiesCount: parties?.length });
    
    // Only show suggestions for party columns and when parties data is available
    if (isPartyColumn && parties && parties.length > 0) {
      let filtered;
      
      if (inputValue.length > 0) {
        // Filter parties based on input
        filtered = parties.filter(party => 
          party.party_code.toLowerCase().includes(inputValue.toLowerCase()) ||
          party.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          (party.nse_code && party.nse_code.toLowerCase().includes(inputValue.toLowerCase()))
        ).sort((a, b) => {
          // Sort by best match - exact matches first, then starts with, then contains
          const aCodeMatch = a.party_code.toLowerCase().indexOf(inputValue.toLowerCase());
          const bCodeMatch = b.party_code.toLowerCase().indexOf(inputValue.toLowerCase());
          
          // Exact match first
          if (aCodeMatch === 0 && inputValue.toLowerCase() === a.party_code.toLowerCase()) return -1;
          if (bCodeMatch === 0 && inputValue.toLowerCase() === b.party_code.toLowerCase()) return 1;
          
          // Starts with match
          if (aCodeMatch === 0) return -1;
          if (bCodeMatch === 0) return 1;
          
          // Contains match
          return aCodeMatch - bCodeMatch;
        });
      } else {
        // Show all parties when input is empty (up to 10)
        filtered = parties.slice(0, 10);
      }
      
      // Debug logging
      // console.log('Filtered parties:', filtered);
      
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      onKeyDown(e);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else {
      onKeyDown(e);
    }
  };

  // Select a suggestion
  const selectSuggestion = (party: Party) => {
    onChange(party.party_code);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setTimeout(() => {
      onBlur();
    }, 100);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node) &&
          suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        className={className}
      />
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((party, index) => (
            <div
              key={party.id}
              className={`px-3 py-2 text-sm cursor-pointer ${
                index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => selectSuggestion(party)}
            >
              <div className="flex justify-between">
                <span className="font-medium">{party.party_code}</span>
                {party.trading_slab > 0 && (
                  <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                    {party.trading_slab}%
                  </span>
                )}
              </div>
              <div className="text-gray-600 text-xs truncate">{party.name}</div>
              {party.nse_code && (
                <div className="text-gray-500 text-xs">NSE: {party.nse_code}</div>
              )}
            </div>
          ))}
          {suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No matching parties found
            </div>
          )}
        </div>
      )}
    </div>
  );
};