import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Typography
    content = re.sub(r'text-2xl\s+sm:text-3xl', 'text-xl', content)
    content = re.sub(r'text-2xl', 'text-lg', content)
    content = re.sub(r'text-3xl', 'text-xl', content)
    content = re.sub(r'font-extrabold', 'font-semibold', content)
    content = re.sub(r'font-black', 'font-bold', content)
    content = re.sub(r'\btracking-tight\b', '', content)
    content = re.sub(r'\btracking-wider\b', '', content)
    content = re.sub(r'\buppercase\b', '', content)
    
    # Colors
    content = re.sub(r'bg-gradient-to-\w+\s+from-[a-z0-9/-]+\s+via-[a-z0-9/-]+\s+to-[a-z0-9/-]+', 'bg-slate-50', content)
    content = re.sub(r'bg-gradient-to-\w+\s+from-[a-z0-9/-]+\s+to-[a-z0-9/-]+', 'bg-slate-50', content)
    content = re.sub(r'bg-gradient-to-\w+', '', content)
    
    # Shadows
    content = re.sub(r'\bshadow-xl\b', 'shadow-sm', content)
    content = re.sub(r'\bshadow-2xl\b', 'shadow-sm', content)
    content = re.sub(r'\bshadow-lg\b', 'shadow-sm', content)
    content = re.sub(r'\bshadow-md\b', 'shadow-sm', content)
    
    # Rounded
    content = re.sub(r'\brounded-3xl\b', 'rounded-lg', content)
    content = re.sub(r'\brounded-2xl\b', 'rounded-lg', content)
    content = re.sub(r'\brounded-xl\b', 'rounded-lg', content)
    
    # Badges / Pills
    content = re.sub(r'\brounded-full\b', 'rounded-md', content)
    
    # Animations
    content = re.sub(r'\bhover:-translate-y-\d+\b', '', content)
    content = re.sub(r'\bhover:scale-\d+\b', '', content)
    content = re.sub(r'\banimate-pulse\b', '', content)
    
    # Text sizes
    content = re.sub(r'text-\[10px\]', 'text-xs', content)
    content = re.sub(r'text-\[11\.5px\]', 'text-xs', content)
    content = re.sub(r'text-\[11px\]', 'text-xs', content)
    content = re.sub(r'text-\[9px\]', 'text-xs', content)
    
    # Max width
    content = re.sub(r'\bmax-w-7xl\b', 'max-w-6xl', content)
    
    # Remove Sparkles icon (lucide-react)
    content = re.sub(r'<Sparkles\b', '<Lightbulb', content)
    
    # Spacing
    content = re.sub(r'\bp-8\b', 'p-6', content)
    content = re.sub(r'\bp-10\b', 'p-6', content)
    content = re.sub(r'\bp-12\b', 'p-6', content)
    content = re.sub(r'sm:p-12', '', content)
    
    # Font mono
    content = re.sub(r'\bfont-mono\b', '', content)

    # Some custom cleanups
    content = re.sub(r'className="\s+', 'className="', content)
    content = re.sub(r'\s+"', '"', content)
    
    # Fix import of Lightbulb if Sparkles is removed
    if 'Sparkles,' in content and 'Lightbulb' not in content:
        content = content.replace('Sparkles,', 'Lightbulb,')
    elif 'Sparkles,' in content and 'Lightbulb' in content:
        content = content.replace('Sparkles,', '')
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file(sys.argv[1])
process_file(sys.argv[2])
