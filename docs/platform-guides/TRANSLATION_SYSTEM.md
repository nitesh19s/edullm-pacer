# Translation System Documentation

## Overview

The EduLLM Platform includes a comprehensive multilingual translation system supporting:
- **English** (en)
- **Hindi** (हिंदी) (hi)
- **Bilingual** mode (shows both languages)

## Implementation Status

### ✅ Completed

1. **Core Translation Infrastructure**
   - translations.js with 400+ translation pairs
   - language-manager.js with automatic language switching
   - localStorage persistence for language preferences
   - Support for text content, placeholders, and title attributes

2. **Translations Added**
   - Navigation menu (all items)
   - All section headers and subtitles
   - Dashboard stat cards and metrics
   - Database management interface
   - Time range selectors
   - Health status indicators

3. **HTML Integration**
   - index.html: All major section headers translated
   - database-management.html: Health cards, statistics, and headers translated
   - Language selector dropdown in header

### 🔄 Partial Coverage

The following areas have translations available but need data-i18n attributes added:

#### index.html
- [ ] Dashboard quick actions and buttons
- [ ] Stat card detailed metrics (Chunks, Vectors, Size, etc.)
- [ ] System health status messages
- [ ] Quick start guide step descriptions
- [ ] Button labels throughout sections
- [ ] Table headers and column names
- [ ] Chart labels and legends
- [ ] Form labels and inputs

#### database-management.html
- [ ] Backup management section buttons/labels
- [ ] Export/Import section content
- [ ] Table headers (Store Name, Records, Indexes, Actions)
- [ ] Modal content and buttons
- [ ] Advanced operations section
- [ ] Danger zone warnings

## How It Works

### 1. Translation Files

**translations.js** - Contains all translation data:
```javascript
const translations = {
    dashboard: {
        title: {
            en: 'Interactive Dashboard',
            hi: 'इंटरैक्टिव डैशबोर्ड'
        }
    }
};
```

### 2. Language Manager

**language-manager.js** - Manages language switching:
```javascript
class LanguageManager {
    changeLanguage(lang) {
        this.currentLanguage = lang;
        this.applyLanguage();
    }

    getText(path) {
        // Returns translated text based on current language
    }
}
```

### 3. HTML Attributes

Add `data-i18n` attributes to elements:
```html
<!-- Text content -->
<h2 data-i18n="dashboard.title">Interactive Dashboard</h2>

<!-- Title/tooltip -->
<button data-i18n-title="dashboard.refresh">
    <i class="fas fa-sync-alt"></i>
</button>

<!-- Placeholder -->
<input data-i18n-placeholder="search.placeholder" />

<!-- Select options -->
<option value="today" data-i18n="dashboard.timeRange.today">Today</option>
```

## Usage

### For Users

1. Click the language selector in the header
2. Choose: English | हिंदी | Bilingual
3. Page content updates automatically
4. Language preference is saved

### For Developers

#### Adding a New Translation

1. **Add to translations.js:**
```javascript
dashboard: {
    newFeature: {
        en: 'New Feature',
        hi: 'नई सुविधा'
    }
}
```

2. **Add data-i18n attribute in HTML:**
```html
<h3 data-i18n="dashboard.newFeature">New Feature</h3>
```

3. **Language manager automatically translates on load and language change**

#### Translation Key Structure

Use dot notation for nested keys:
```
section.subsection.item

Examples:
- nav.dashboard
- dbManagement.health.status
- dashboard.timeRange.today
```

## Current Translation Coverage

### Navigation (100% ✅)
- All menu items
- All section titles

### Dashboard Section (70% 🔄)
- ✅ Main title and subtitle
- ✅ Time range selector
- ✅ Section headers
- ⏳ Detailed metrics
- ⏳ Chart labels
- ⏳ Button labels

### Database Management (80% 🔄)
- ✅ Page header
- ✅ Health cards
- ✅ Statistics cards
- ⏳ Backup management
- ⏳ Export/Import
- ⏳ Table content

### Other Sections (60% 🔄)
- ✅ RAG Chat - Header
- ✅ Smart Chunking - Header
- ✅ Knowledge Graph - Header
- ✅ Upload - Header
- ✅ Experiments - Header
- ✅ Settings - Header
- ✅ Analytics - Header
- ✅ Comparisons - Header
- ✅ A/B Testing - Header
- ⏳ Section content needs data-i18n attributes

## Language Support Details

### Bilingual Mode
Shows both languages in format: "English / हिंदी"

Example:
- English: "Dashboard"
- Hindi: "डैशबोर्ड"
- Bilingual: "Dashboard / डैशबोर्ड"

### localStorage Persistence
Language preference is saved as:
```javascript
localStorage.setItem('edullm_language', 'hi'); // or 'en' or 'bilingual'
```

## Testing

To test language switching:

1. **Open browser console** (F12)
2. **Change language** from dropdown
3. **Check console** for: `✅ Language changed to: hi`
4. **Verify translations** appear correctly
5. **Reload page** - language persists

### Manual Test Checklist

- [ ] Language selector changes language
- [ ] Navigation translates
- [ ] Section headers translate
- [ ] Database management page translates
- [ ] Bilingual mode shows both languages
- [ ] Language persists after reload
- [ ] Option elements translate
- [ ] Title attributes translate

## Extending Translation Coverage

### Quick Add Script

To quickly add data-i18n attributes to remaining elements:

1. Identify element text in HTML
2. Check if translation exists in translations.js
3. If not, add translation with both en and hi values
4. Add data-i18n attribute to HTML element

### Priority Order for Translation

1. **High Priority** (User-facing, always visible)
   - Navigation
   - Page headers
   - Primary buttons
   - Error messages

2. **Medium Priority** (Frequently used)
   - Form labels
   - Table headers
   - Status messages
   - Tooltips

3. **Low Priority** (Less frequently seen)
   - Placeholder text
   - Help text
   - Advanced settings
   - Debug messages

## Translation Files

| File | Purpose | Lines | Coverage |
|------|---------|-------|----------|
| translations.js | All translations | 700+ | Core complete |
| language-manager.js | Language logic | 280 | Complete |
| index.html | Main page | 1850+ | 60% translated |
| database-management.html | DB page | 483 | 80% translated |

## API Reference

### LanguageManager Methods

```javascript
// Change language
languageManager.changeLanguage('hi'); // 'en', 'hi', or 'bilingual'

// Get translated text
languageManager.getText('dashboard.title');

// Get current language
languageManager.getCurrentLanguage();

// Apply translations to page
languageManager.applyLanguage();
```

### Translation Path Examples

```javascript
// Navigation
'nav.dashboard' → "Dashboard" / "डैशबोर्ड"

// Dashboard
'dashboard.title' → "Interactive Dashboard" / "इंटरैक्टिव डैशबोर्ड"
'dashboard.timeRange.today' → "Today" / "आज"

// Database
'dbManagement.health.status' → "Status" / "स्थिति"
'dbManagement.statistics.totalStores' → "Total Stores" / "कुल स्टोर"
```

## Known Limitations

1. **Dynamic Content**: Content generated by JavaScript needs manual translation calls
2. **Partial Coverage**: Not all UI elements have data-i18n attributes yet
3. **Number Formatting**: Numbers use same format in both languages
4. **Date Formatting**: Dates not localized yet
5. **RTL Support**: No right-to-left language support

## Future Enhancements

- [ ] Complete translation coverage (all UI elements)
- [ ] Add more languages (Regional Indian languages)
- [ ] Localized number formatting
- [ ] Localized date/time formatting
- [ ] Translation for dynamically generated content
- [ ] Translation management interface
- [ ] Export/import translation files
- [ ] Missing translation detection tool

## Troubleshooting

### Translation Not Showing

1. Check console for errors
2. Verify data-i18n key exists in translations.js
3. Check element has data-i18n attribute
4. Try changing language again
5. Clear localStorage and reload

### Bilingual Mode Issues

1. Ensure both `en` and `hi` keys exist for translation
2. Check for proper formatting in translations.js
3. Verify language-manager.js is loaded

### Language Not Persisting

1. Check localStorage is enabled
2. Verify `edullm_language` key in localStorage
3. Check browser privacy settings

## Contributing Translations

To add Hindi translations:

1. Use Devanagari script (देवनागरी)
2. Keep technical terms in English when appropriate (e.g., "RAG", "PDF")
3. Use formal Hindi for professional context
4. Test in bilingual mode to ensure readability
5. Verify proper Unicode rendering

---

**Status**: Translation system is functional and ready to use. Major sections translated. Additional content translation ongoing.

**Last Updated**: 2025-11-17
**Version**: 1.0
