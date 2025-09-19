"""Repository context for patient portal analysis."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Generator, List, Optional


class RepositoryContext:
    """Context for analyzing the repository structure and files."""
    
    def __init__(self, root_path: Path):
        self.root = Path(root_path)
        if not self.root.exists():
            raise ValueError(f"Repository path does not exist: {root_path}")
    
    def read_text(self, file_path: Path, encoding: str = 'utf-8') -> str:
        """Read text content from a file."""
        try:
            return file_path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            # Try with different encodings
            try:
                return file_path.read_text(encoding='latin1')
            except Exception:
                return ""  # Return empty string if file can't be read
        except Exception:
            return ""
    
    def iter_patient_files(self) -> Generator[Path, None, None]:
        """Iterate over patient portal files."""
        patient_directories = [
            self.root / "frontend" / "src" / "app" / "patient",
            self.root / "frontend" / "src" / "components" / "patient"
        ]
        
        # Also include PatientLayout component
        patient_layout = self.root / "frontend" / "src" / "components" / "PatientLayout.tsx"
        if patient_layout.exists():
            yield patient_layout
        
        for directory in patient_directories:
            if directory.exists():
                for file_path in directory.rglob("*"):
                    if file_path.is_file() and file_path.suffix in ['.tsx', '.ts', '.css', '.scss']:
                        yield file_path
    
    def iter_frontend_files(self) -> Generator[Path, None, None]:
        """Iterate over all frontend files."""
        frontend_dir = self.root / "frontend" / "src"
        if not frontend_dir.exists():
            return
        
        for file_path in frontend_dir.rglob("*"):
            if file_path.is_file() and file_path.suffix in ['.tsx', '.ts', '.css', '.scss']:
                yield file_path
    
    def get_patient_pages(self) -> List[Path]:
        """Get all patient portal page files."""
        patient_pages = []
        patient_app_dir = self.root / "frontend" / "src" / "app" / "patient"
        
        if patient_app_dir.exists():
            for file_path in patient_app_dir.rglob("page.tsx"):
                patient_pages.append(file_path)
        
        return patient_pages
    
    def get_patient_components(self) -> List[Path]:
        """Get all patient-specific components."""
        patient_components = []
        
        # Patient-specific components directory
        patient_comp_dir = self.root / "frontend" / "src" / "components" / "patient"
        if patient_comp_dir.exists():
            for file_path in patient_comp_dir.rglob("*.tsx"):
                patient_components.append(file_path)
        
        # PatientLayout component
        patient_layout = self.root / "frontend" / "src" / "components" / "PatientLayout.tsx"
        if patient_layout.exists():
            patient_components.append(patient_layout)
        
        return patient_components
    
    def file_exists(self, relative_path: str) -> bool:
        """Check if a file exists relative to the repository root."""
        return (self.root / relative_path).exists()
    
    def get_file_content(self, relative_path: str) -> Optional[str]:
        """Get content of a file by relative path."""
        file_path = self.root / relative_path
        if file_path.exists():
            return self.read_text(file_path)
        return None
    
    def get_package_json_info(self) -> dict:
        """Get information from frontend package.json."""
        package_json_path = self.root / "frontend" / "package.json"
        if package_json_path.exists():
            try:
                import json
                content = self.read_text(package_json_path)
                return json.loads(content)
            except Exception:
                pass
        return {}
    
    def get_tailwind_config(self) -> Optional[str]:
        """Get Tailwind configuration."""
        tailwind_config = self.root / "frontend" / "tailwind.config.js"
        if tailwind_config.exists():
            return self.read_text(tailwind_config)
        return None