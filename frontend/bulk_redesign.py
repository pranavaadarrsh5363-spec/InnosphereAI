"""
InnoSphere AI — Bulk UI Redesign Script
Applies professional design system rules to all .tsx files via regex replacements.
"""
import re
import os
import glob

FRONTEND_SRC = r"C:\Users\Mandhira Nayagi\.gemini\antigravity\scratch\student-innovation-platform\frontend\src"

# Collect all .tsx files
tsx_files = glob.glob(os.path.join(FRONTEND_SRC, "**", "*.tsx"), recursive=True)
print(f"Found {len(tsx_files)} .tsx files to process")

total_changes = 0

for filepath in tsx_files:
    with open(filepath, "r", encoding="utf-8") as f:
        original = f.read()
    
    content = original
    
    # =============================================
    # 1. BORDER RADIUS — reduce excessive rounding
    # =============================================
    # rounded-3xl -> rounded-lg
    content = content.replace("rounded-3xl", "rounded-lg")
    # rounded-2xl -> rounded-lg (except modals which can be rounded-xl)
    content = content.replace("rounded-2xl", "rounded-lg")
    
    # =============================================
    # 2. SHADOWS — flatten to shadow-sm max
    # =============================================
    content = content.replace("shadow-2xl", "shadow-sm")
    content = content.replace("shadow-xl", "shadow-sm")
    content = content.replace("shadow-lg", "shadow-sm")
    content = content.replace("shadow-md", "shadow-sm")
    # shadow-xs and shadow-2xs -> shadow-sm
    content = content.replace("shadow-2xs", "shadow-sm")
    content = content.replace("shadow-xs", "shadow-sm")
    # Remove colored shadows
    content = re.sub(r'shadow-indigo-\d+/\d+', '', content)
    content = re.sub(r'shadow-blue-\d+/\d+', '', content)
    content = re.sub(r'shadow-emerald-\d+/\d+', '', content)
    content = re.sub(r'shadow-violet-\d+/\d+', '', content)
    content = re.sub(r'shadow-cyan-\d+/\d+', '', content)
    content = re.sub(r'shadow-purple-\d+/\d+', '', content)
    content = re.sub(r'shadow-red-\d+/\d+', '', content)
    content = re.sub(r'shadow-amber-\d+/\d+', '', content)
    content = re.sub(r'shadow-slate-\d+/\d+', '', content)
    
    # =============================================
    # 3. HOVER ANIMATIONS — remove lift/scale effects
    # =============================================
    content = re.sub(r'hover:-translate-y-[\d.]+\s*', '', content)
    content = re.sub(r'hover:translate-y-[\d.]+\s*', '', content)
    content = re.sub(r'hover:scale-\d+\s*', '', content)
    content = re.sub(r'group-hover:scale-\d+\s*', '', content)
    content = re.sub(r'group-hover:translate-x-[\d.]+\s*', '', content)
    content = re.sub(r'group-hover:-translate-x-[\d.]+\s*', '', content)
    
    # =============================================
    # 4. TYPOGRAPHY — restrain fonts
    # =============================================
    content = content.replace("font-extrabold", "font-semibold")
    content = content.replace("font-black", "font-semibold")
    
    # Normalize tiny custom text sizes to text-xs
    content = re.sub(r'text-\[9px\]', 'text-xs', content)
    content = re.sub(r'text-\[9\.5px\]', 'text-xs', content)
    content = re.sub(r'text-\[10px\]', 'text-xs', content)
    content = re.sub(r'text-\[10\.5px\]', 'text-xs', content)
    content = re.sub(r'text-\[11px\]', 'text-xs', content)
    content = re.sub(r'text-\[11\.5px\]', 'text-xs', content)
    
    # =============================================
    # 5. GRADIENTS — remove gradient backgrounds
    # =============================================
    # Remove gradient direction classes that are followed by from/via/to
    content = re.sub(r'bg-gradient-to-[a-z]+\s+', '', content)
    # Remove from-* via-* to-* gradient color stops
    content = re.sub(r'from-[a-z]+-\d+(?:/\d+)?\s*', '', content)
    content = re.sub(r'via-[a-z]+-\d+(?:/\d+)?\s*', '', content)
    content = re.sub(r'to-[a-z]+-\d+(?:/\d+)?\s*', '', content)
    # Remove ai-* utility classes
    content = re.sub(r'ai-gradient-text\s*', '', content)
    content = re.sub(r'ai-gradient-bg\s*', '', content)
    content = re.sub(r'ai-gradient-border\s*', '', content)
    content = re.sub(r'ai-glow-\w+\s*', '', content)
    
    # =============================================
    # 6. CONTAINER WIDTH
    # =============================================
    content = content.replace("max-w-7xl", "max-w-6xl")
    
    # =============================================
    # 7. GLASS PANEL references
    # =============================================
    content = content.replace("glass-panel-hover", "surface-card-hover")
    content = content.replace("glass-panel", "surface-card")
    
    # =============================================
    # 8. Clean up multiple spaces in classNames
    # =============================================
    # Replace multiple consecutive spaces with single space
    content = re.sub(r'  +', ' ', content)
    # Clean up trailing spaces before closing quotes
    content = re.sub(r' "', '"', content)
    content = re.sub(r" '", "'", content)
    content = re.sub(r' `', '`', content)
    
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        changes = sum(1 for a, b in zip(original, content) if a != b)
        total_changes += 1
        basename = os.path.relpath(filepath, FRONTEND_SRC)
        print(f"  [OK] {basename}")

print(f"\nProcessed {total_changes} files with changes out of {len(tsx_files)} total")
