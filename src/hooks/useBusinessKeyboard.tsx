import { useEffect, useCallback, useRef } from "react";

interface FormNavigationConfig {
  onSubmit?: () => void;
  onCancel?: () => void;
  onNew?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onPrint?: () => void;
  onSave?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}

// Enhanced keyboard navigation for business forms
export const useBusinessKeyboard = (config: FormNavigationConfig) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't interfere with input fields unless specifically handled
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isContentEditable = target.isContentEditable || target.hasAttribute('contenteditable');
    
    // If we're in an input field or contenteditable element, don't handle most shortcuts
    if (isInputField || isContentEditable) {
      // Allow Escape and some special keys even in inputs
      if (e.key === 'Escape' && config.onCancel) {
        e.preventDefault();
        config.onCancel();
      }
      return;
    }
    
    // F2 - Edit
    if (e.key === 'F2' && config.onEdit) {
      e.preventDefault();
      config.onEdit();
    }
    // F3 - Search/Find
    else if (e.key === 'F3' && config.onSearch) {
      e.preventDefault();
      config.onSearch();
    }
    // F4 - New
    else if (e.key === 'F4' && config.onNew) {
      e.preventDefault();
      config.onNew();
    }
    // F5 - Refresh (prevent default browser refresh)
    else if (e.key === 'F5') {
      e.preventDefault();
    }
    // F9 - Save (common in business apps)
    else if (e.key === 'F9' && config.onSave) {
      e.preventDefault();
      config.onSave();
    }
    // F10 - Print
    else if (e.key === 'F10' && config.onPrint) {
      e.preventDefault();
      config.onPrint();
    }
    // Delete key
    else if (e.key === 'Delete' && config.onDelete) {
      e.preventDefault();
      config.onDelete();
    }
    // Enter in forms (submit)
    else if (e.key === 'Enter' && config.onSubmit && !e.shiftKey) {
      e.preventDefault();
      config.onSubmit();
    }
    // Escape (cancel)
    else if (e.key === 'Escape' && config.onCancel) {
      e.preventDefault();
      config.onCancel();
    }
    // Ctrl+N - New
    else if ((e.ctrlKey || e.metaKey) && e.key === 'n' && config.onNew) {
      e.preventDefault();
      config.onNew();
    }
    // Ctrl+S - Save
    else if ((e.ctrlKey || e.metaKey) && e.key === 's' && config.onSave) {
      e.preventDefault();
      config.onSave();
    }
    // Ctrl+P - Print
    else if ((e.ctrlKey || e.metaKey) && e.key === 'p' && config.onPrint) {
      e.preventDefault();
      config.onPrint();
    }
    // Arrow Up - Only handle in list views, not in forms
    else if (e.key === 'ArrowUp' && config.onUp) {
      // Check if we're in a form by looking for common form container elements
      const isInForm = target.closest('form') !== null;
      if (!isInForm) {
        e.preventDefault();
        config.onUp();
      }
    }
    // Arrow Down - Only handle in list views, not in forms
    else if (e.key === 'ArrowDown' && config.onDown) {
      // Check if we're in a form by looking for common form container elements
      const isInForm = target.closest('form') !== null;
      if (!isInForm) {
        e.preventDefault();
        config.onDown();
      }
    }
  }, [config]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Hook for table navigation with keyboard
export const useTableNavigation = (items: any[], selectedIndex: number, setSelectedIndex: (index: number) => void) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isContentEditable = target.isContentEditable || target.hasAttribute('contenteditable');
    
    if (isInputField || isContentEditable) return;
    
    // Check if we're in a form by looking for common form container elements
    const isInForm = target.closest('form') !== null;
    if (isInForm) return; // Don't handle arrow keys in forms
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setSelectedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setSelectedIndex(items.length - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 10, items.length - 1));
        break;
      case 'PageUp':
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 10, 0));
        break;
    }
  }, [items.length, selectedIndex, setSelectedIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Enhanced form field navigation (Tab/Enter/Arrow sequence)
export const useFormNavigation = (formRef: React.RefObject<HTMLFormElement>, onSubmit?: () => void) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!formRef.current) return;
    
    const target = e.target as HTMLElement;
    const formElements = Array.from(formRef.current.querySelectorAll(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
    )) as HTMLElement[];
    
    const currentIndex = formElements.indexOf(target);
    
    // Check if we're in a text input and cursor is at start/end
    const isTextInput = target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text';
    const isTextarea = target.tagName === 'TEXTAREA';
    
    if (e.key === 'Enter' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
      e.preventDefault();
      
      // Move to next field
      const nextIndex = currentIndex + 1;
      if (nextIndex < formElements.length) {
        formElements[nextIndex].focus();
      } else if (onSubmit) {
        // Reached end of form, submit
        onSubmit();
      }
    }
    
    // Arrow Right - Move to next field (only if cursor is at end or not in text field)
    if (e.key === 'ArrowRight' && !isTextarea) {
      if (isTextInput) {
        const input = target as HTMLInputElement;
        const cursorAtEnd = input.selectionStart === input.value.length;
        if (!cursorAtEnd) return; // Let cursor move naturally
      }
      
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < formElements.length) {
        formElements[nextIndex].focus();
        // If it's a text input, move cursor to start
        if (formElements[nextIndex] instanceof HTMLInputElement) {
          (formElements[nextIndex] as HTMLInputElement).setSelectionRange(0, 0);
        }
      }
    }
    
    // Arrow Left - Move to previous field (only if cursor is at start or not in text field)
    if (e.key === 'ArrowLeft' && !isTextarea) {
      if (isTextInput) {
        const input = target as HTMLInputElement;
        const cursorAtStart = input.selectionStart === 0;
        if (!cursorAtStart) return; // Let cursor move naturally
      }
      
      e.preventDefault();
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        formElements[prevIndex].focus();
        // If it's a text input, move cursor to end
        if (formElements[prevIndex] instanceof HTMLInputElement) {
          const input = formElements[prevIndex] as HTMLInputElement;
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }
    
    if (e.key === 'Tab') {
      // Let browser handle tab navigation but ensure it's visible
      setTimeout(() => {
        const focusedElement = document.activeElement as HTMLElement;
        if (focusedElement) {
          focusedElement.scrollIntoView({ block: 'nearest' });
        }
      }, 0);
    }
  }, [formRef, onSubmit]);

  useEffect(() => {
    const form = formRef.current;
    if (form) {
      form.addEventListener('keydown', handleKeyDown);
      return () => form.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);
};

// Hook for business shortcuts displayed in help
export const getBusinessShortcuts = () => [
  { category: "Form Actions", shortcuts: [
    { key: "F2", description: "Edit selected record" },
    { key: "F4", description: "Add new record" },
    { key: "F9", description: "Save current form" },
    { key: "F10", description: "Print current document" },
    { key: "Delete", description: "Delete selected record" },
    { key: "Escape", description: "Cancel current operation" },
    { key: "Enter", description: "Confirm/Submit" },
  ]},
  { category: "Navigation", shortcuts: [
    { key: "Tab", description: "Move to next field" },
    { key: "Shift+Tab", description: "Move to previous field" },
    { key: "↑/↓", description: "Navigate table rows" },
    { key: "Home/End", description: "First/Last row" },
    { key: "Page Up/Down", description: "Jump 10 rows" },
  ]},
  { category: "Quick Actions", shortcuts: [
    { key: "Ctrl+N", description: "New record" },
    { key: "Ctrl+S", description: "Save" },
    { key: "Ctrl+P", description: "Print" },
    { key: "F3", description: "Find/Search" },
    { key: "F5", description: "Refresh (disabled)" },
  ]}
];