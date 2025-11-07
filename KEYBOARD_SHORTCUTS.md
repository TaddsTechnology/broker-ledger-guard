# Keyboard Navigation Guide

## 🎯 Quick Entry Workflow

### Essential Keys for Fast Data Entry:
- **Tab** or **→** - Move to next field
- **Shift+Tab** or **←** - Move to previous field  
- **Enter** - Move to next field (or submit at end)
- **F9** - Save form
- **Escape** - Cancel/Go back to list

---

## 📝 Form Entry Shortcuts

### Function Keys:
| Key | Action | Description |
|-----|--------|-------------|
| **F2** | Edit | Edit selected record from list |
| **F3** | Search | Focus search box |
| **F4** | New Entry | Create new record |
| **F9** | Save | Save current form |
| **F10** | Print | Print current document |
| **Delete** | Delete | Delete selected record |
| **Escape** | Cancel | Cancel and return to list |

### Navigation in Forms:
| Key | Action |
|-----|--------|
| **Tab** | Next field |
| **Shift+Tab** | Previous field |
| **Enter** | Next field (or submit if last field) |
| **→ (Right Arrow)** | Next field (when cursor at end of text) |
| **← (Left Arrow)** | Previous field (when cursor at start of text) |
| **Arrow Up/Down** | Works in dropdowns/selects |

---

## 📋 List View Navigation

### Table Navigation:
| Key | Action |
|-----|--------|
| **↑** | Previous row |
| **↓** | Next row |
| **Home** | First row |
| **End** | Last row |
| **Page Up** | Jump up 10 rows |
| **Page Down** | Jump down 10 rows |

### Quick Actions from List:
- **F2** - Edit selected row
- **Delete** - Delete selected row
- **F4** - Add new entry
- **F3** - Search
- **Enter** - View/Edit selected row

---

## 🔥 Power User Shortcuts

### Ctrl Combinations:
| Shortcut | Action |
|----------|--------|
| **Ctrl+N** | New record |
| **Ctrl+S** | Save |
| **Ctrl+P** | Print |

---

## 📄 Page-Specific Shortcuts

### Party Master / Company Master / Broker Master:
- **F4** - New entry
- **Tab/Enter** - Navigate between fields
- **F9** - Save
- **Escape** - Cancel
- **F2** - Edit selected
- **Delete** - Delete selected

### Bills / Ledger:
- **F4** - New bill
- **↑/↓** - Navigate list
- **F2** - Edit selected bill
- **Delete** - Delete selected bill
- **F3** - Search bills
- **Enter** - View bill details

### Trading (File Upload):
- **Tab** - Navigate through uploaded files
- All standard form shortcuts apply

---

## ✨ Tips for Maximum Efficiency

### 1. **Fast Party Entry Workflow:**
```
F4 → Type Code → → (or Tab) → Type Name → → → Enter slabs → F9
```
*You can use arrow keys (→) or Tab interchangeably!*

### 2. **Quick Bill Creation:**
```
F4 → Select Party → Tab → Enter Date → Tab → Amount → F9
```

### 3. **List Navigation:**
```
↑/↓ to select → F2 to edit → Make changes → F9 to save
```

### 4. **Search and Edit:**
```
F3 → Type search → ↓ to select → F2 to edit
```

---

## 🎨 Visual Indicators

- Fields with **red asterisk (*)** are required
- **Hover over buttons** to see keyboard shortcuts
- **Tab order** follows logical left-to-right, top-to-bottom
- **Focus highlights** show current field

---

## 📱 Current Implementation Status

### ✅ Fully Implemented:
- All function keys (F2-F10)
- Tab navigation in forms
- Enter to advance in forms
- Arrow key navigation in lists
- Escape to cancel
- Delete key
- Ctrl combinations
- Home/End/PageUp/PageDown in lists

### 🎯 All Pages Support:
- Party Master
- Company Master
- Broker Master
- Settlement Master
- Bills
- Ledger
- Contracts
- Trading

---

## 🔧 Technical Details

### Form Navigation Logic:
1. **Tab** - Browser handles natively
2. **Enter** - Custom: Advances to next field (except in textareas)
3. **Escape** - Custom: Exits form
4. **F-Keys** - Custom: Trigger specific actions

### List Navigation Logic:
1. Arrow keys work when **NOT** in input fields
2. Focus must be on table or page body
3. Selected row is highlighted
4. Enter opens selected item

---

## 💡 Pro Tips

1. **Tab Order**: All fields have proper `tabIndex` attributes for logical flow
2. **Auto-focus**: First field auto-focuses when opening forms
3. **No Mouse Needed**: Can complete entire workflow with keyboard only
4. **F5 Disabled**: Prevents accidental page refresh
5. **Visual Feedback**: All shortcuts show tooltips on hover

---

## 🎓 Learning Path

### Beginner (Day 1):
- Learn: Tab, Enter, F9 (Save), Escape

### Intermediate (Week 1):
- Add: F4 (New), F2 (Edit), Delete
- Add: ↑/↓ for list navigation

### Advanced (Month 1):
- Add: F3 (Search), Ctrl+S
- Add: Home/End, PageUp/Down

### Power User:
- Memorize all F-keys
- Never touch mouse for data entry
- Use Ctrl combinations

---

## 📊 Expected Speed Improvements

With full keyboard proficiency:
- **Data Entry**: 3-5x faster than mouse
- **Navigation**: 2-3x faster
- **Editing**: 4-6x faster
- **Overall Workflow**: 3-4x faster

---

**Last Updated**: November 6, 2025
**Version**: 1.0
