"""
TypeScript Error Fix Script for Tenancy Domain
Fixes all remaining compilation errors in Phase 1
"""

import os
import re
from pathlib import Path

# Root paths
ROOT = Path(r"C:\AI-BOS\AFENDA-FINAL")
APP_DIR = ROOT / "app/(app)/tenancy"
API_DIR = ROOT / "app/api/tenancy"

def fix_type_annotations(file_path):
    """Add type annotations for error and event handlers"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix error handlers: (error) => to (error: Error) =>
    content = re.sub(r'\bonError:\s*\(error\)\s*=>', 'onError: (error: Error) =>', content)
    
    # Fix event handlers: (e) => to (e: React.ChangeEvent<HTMLInputElement>) =>
    content = re.sub(
        r'onChange=\{(\(e\))\s*=>\s*(setNewMemberUserId|handleChange)\(',
        r'onChange={(e: React.ChangeEvent<HTMLInputElement>) => \2(',
        content
    )
    
    # Fix textarea event handlers: (e) => to (e: React.ChangeEvent<HTMLTextareaElement>) =>
    content = re.sub(
        r'(<Textarea[^>]*onChange=\{)\(e\)',
        r'\1(e: React.ChangeEvent<HTMLTextareaElement>)',
        content
    )
    
    # Fix member.map type annotations: (member) => to (member: any) =>
    content = re.sub(r'{members\.map\(\(member\)\s*=>', '{members.map((member: any) =>', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fixed type annotations in {file_path.name}")

def main():
    # Fix organization settings
    fix_type_annotations(APP_DIR / "organizations/[id]/settings/page.tsx")
    
    # Fix organization members
    fix_type_annotations(APP_DIR / "organizations/[id]/members/page.tsx")
    
    # Fix team settings
    fix_type_annotations(APP_DIR / "teams/[id]/settings/page.tsx")
    
    # Fix design system
    fix_type_annotations(APP_DIR / "design-system/page.tsx")
    
    print("\n🎉 All type annotations fixed!")

if __name__ == "__main__":
    main()
