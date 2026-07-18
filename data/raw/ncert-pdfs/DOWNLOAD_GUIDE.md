
# NCERT PDF Download Guide

## Official Source
**Website:** https://ncert.nic.in/textbook.php

## How to Download Manually

### Method 1: Official NCERT Website

1. Visit: https://ncert.nic.in/
2. Click: "Publication" → "E-books"
3. Select: Class (6-12)
4. Select: Subject
5. Click: "Download PDF"

### Method 2: Direct Links

Visit the textbook page directly:
https://ncert.nic.in/textbook.php?ln=en

### Recommended Downloads for Fine-tuning

#### Priority 1: Core Subjects (Classes 9-10)
- Science (Physics, Chemistry, Biology)
- Mathematics
- Social Science (History, Geography, Civics, Economics)

#### Priority 2: Advanced (Classes 11-12)
- Physics (Part I & II)
- Chemistry (Part I & II)
- Biology
- Mathematics (Part I & II)

#### Priority 3: Foundation (Classes 6-8)
- Science
- Mathematics
- Social Science

## Directory Structure

Save downloaded PDFs to:
```
ncert-pdfs/
├── science/
│   ├── 6/ (Class 6 Science PDFs)
│   ├── 7/
│   ├── 8/
│   ├── 9/
│   ├── 10/
│   ├── 11/
│   └── 12/
├── mathematics/
│   ├── 6/
│   ├── 7/
│   └── ...
├── social-science/
│   └── ...
└── languages/
    └── ...
```

## After Downloading

1. Extract ZIP files (if compressed)
2. Run PDF parser:
   ```bash
   python3 parse-ncert-pdfs.py
   ```

3. Review extracted Q&A pairs:
   ```bash
   python3 ncert-data-collector.py stats
   ```

## File Naming Convention

Use this format:
- `class_10_science.pdf`
- `class_9_mathematics.pdf`
- `class_12_physics_part1.pdf`

## Notes

- All NCERT books are freely available for educational use
- Download only from official sources (ncert.nic.in)
- Total size: ~2-5 GB for classes 6-12 (all subjects)
- PDFs are updated annually, check for latest editions

## Quick Links (Verify from official site)

**Class 10:**
- Science: ncert.nic.in → Publications → E-books → Class X → Science
- Maths: ncert.nic.in → Publications → E-books → Class X → Mathematics

**Class 9:**
- Science: ncert.nic.in → Publications → E-books → Class IX → Science
- Maths: ncert.nic.in → Publications → E-books → Class IX → Mathematics
