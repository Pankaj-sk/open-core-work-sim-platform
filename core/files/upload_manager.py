#!/usr/bin/env python3
"""
File Upload Manager for SimWorld
Handles code uploads, file storage, and integration with agents
"""

import os
import uuid
import hashlib
import mimetypes
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import json
import shutil

class FileUploadManager:
    """Manages file uploads and storage for SimWorld"""
    
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        (self.upload_dir / "code").mkdir(exist_ok=True)
        (self.upload_dir / "documents").mkdir(exist_ok=True)
        (self.upload_dir / "images").mkdir(exist_ok=True)
        (self.upload_dir / "temp").mkdir(exist_ok=True)
        
        # Allowed file types
        self.allowed_code_extensions = {
            '.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss',
            '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go',
            '.rs', '.swift', '.kt', '.dart', '.sql', '.json', '.xml',
            '.yaml', '.yml', '.md', '.txt', '.sh', '.bat', '.ps1'
        }
        
        self.allowed_doc_extensions = {
            '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls',
            '.txt', '.md', '.rtf', '.odt', '.ods', '.odp'
        }
        
        self.allowed_image_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
            '.ico', '.tiff', '.tif'
        }
        
        # File metadata storage
        self.file_metadata: Dict[str, Dict] = {}
        self._load_metadata()
    
    def _load_metadata(self):
        """Load file metadata from storage"""
        metadata_file = self.upload_dir / "metadata.json"
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    self.file_metadata = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load metadata: {e}")
    
    def _save_metadata(self):
        """Save file metadata to storage"""
        metadata_file = self.upload_dir / "metadata.json"
        try:
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.file_metadata, f, indent=2, default=str)
        except Exception as e:
            print(f"Warning: Could not save metadata: {e}")
    
    def _get_file_hash(self, file_path: Path) -> str:
        """Generate MD5 hash of file for deduplication"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def _categorize_file(self, filename: str) -> str:
        """Categorize file based on extension"""
        ext = Path(filename).suffix.lower()
        
        if ext in self.allowed_code_extensions:
            return "code"
        elif ext in self.allowed_doc_extensions:
            return "documents"
        elif ext in self.allowed_image_extensions:
            return "images"
        else:
            return "temp"
    
    def upload_file(self, file_path: str, original_filename: str, 
                   project_id: str, user_id: str, 
                   description: str = "") -> Dict[str, Any]:
        """Upload a file to the system"""
        
        # Validate file
        if not os.path.exists(file_path):
            raise ValueError(f"File not found: {file_path}")
        
        # Get file info
        file_size = os.path.getsize(file_path)
        file_hash = self._get_file_hash(Path(file_path))
        category = self._categorize_file(original_filename)
        
        # Check for duplicates
        for file_id, metadata in self.file_metadata.items():
            if metadata.get('hash') == file_hash:
                return {
                    'file_id': file_id,
                    'status': 'duplicate',
                    'message': 'File already exists',
                    'metadata': metadata
                }
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Create storage path
        file_ext = Path(original_filename).suffix
        stored_filename = f"{file_id}{file_ext}"
        storage_path = self.upload_dir / category / stored_filename
        
        # Copy file to storage
        shutil.copy2(file_path, storage_path)
        
        # Create metadata
        metadata = {
            'file_id': file_id,
            'original_filename': original_filename,
            'stored_filename': stored_filename,
            'storage_path': str(storage_path),
            'category': category,
            'file_size': file_size,
            'hash': file_hash,
            'project_id': project_id,
            'user_id': user_id,
            'description': description,
            'upload_date': datetime.now().isoformat(),
            'mime_type': mimetypes.guess_type(original_filename)[0],
            'is_code': category == "code"
        }
        
        # Add code-specific metadata
        if category == "code":
            metadata.update(self._analyze_code_file(storage_path))
        
        # Store metadata
        self.file_metadata[file_id] = metadata
        self._save_metadata()
        
        return {
            'file_id': file_id,
            'status': 'success',
            'message': 'File uploaded successfully',
            'metadata': metadata
        }
    
    def _analyze_code_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyze code file for additional metadata"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Basic code analysis
            lines = content.split('\n')
            
            return {
                'line_count': len(lines),
                'char_count': len(content),
                'programming_language': self._detect_language(file_path),
                'has_comments': '//' in content or '#' in content or '/*' in content,
                'function_count': content.count('def ') + content.count('function '),
                'class_count': content.count('class '),
                'import_count': content.count('import ') + content.count('from '),
                'preview': lines[:10] if lines else []  # First 10 lines
            }
        except Exception as e:
            return {'analysis_error': str(e)}
    
    def _detect_language(self, file_path: Path) -> str:
        """Detect programming language from file extension"""
        ext = file_path.suffix.lower()
        
        language_map = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React JSX',
            '.tsx': 'React TSX',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.h': 'C Header',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.dart': 'Dart',
            '.sql': 'SQL',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.md': 'Markdown',
            '.sh': 'Shell Script',
            '.bat': 'Batch Script',
            '.ps1': 'PowerShell'
        }
        
        return language_map.get(ext, 'Unknown')
    
    def get_file_metadata(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific file"""
        return self.file_metadata.get(file_id)
    
    def get_project_files(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all files for a project"""
        return [
            metadata for metadata in self.file_metadata.values()
            if metadata.get('project_id') == project_id
        ]
    
    def get_file_content(self, file_id: str) -> Optional[str]:
        """Get file content (for text files)"""
        metadata = self.get_file_metadata(file_id)
        if not metadata:
            return None
        
        storage_path = Path(metadata['storage_path'])
        if not storage_path.exists():
            return None
        
        try:
            with open(storage_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception:
            return None
    
    def delete_file(self, file_id: str) -> bool:
        """Delete a file from the system"""
        metadata = self.get_file_metadata(file_id)
        if not metadata:
            return False
        
        # Delete physical file
        storage_path = Path(metadata['storage_path'])
        if storage_path.exists():
            try:
                os.remove(storage_path)
            except Exception:
                return False
        
        # Remove from metadata
        del self.file_metadata[file_id]
        self._save_metadata()
        
        return True
    
    def search_files(self, query: str, project_id: str = None, 
                    category: str = None) -> List[Dict[str, Any]]:
        """Search files by name, description, or content"""
        results = []
        
        for metadata in self.file_metadata.values():
            # Filter by project if specified
            if project_id and metadata.get('project_id') != project_id:
                continue
            
            # Filter by category if specified
            if category and metadata.get('category') != category:
                continue
            
            # Search in filename and description
            if (query.lower() in metadata.get('original_filename', '').lower() or
                query.lower() in metadata.get('description', '').lower()):
                results.append(metadata)
        
        return results
    
    def get_upload_stats(self) -> Dict[str, Any]:
        """Get upload statistics"""
        total_files = len(self.file_metadata)
        total_size = sum(m.get('file_size', 0) for m in self.file_metadata.values())
        
        category_counts = {}
        for metadata in self.file_metadata.values():
            category = metadata.get('category', 'unknown')
            category_counts[category] = category_counts.get(category, 0) + 1
        
        return {
            'total_files': total_files,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / 1024 / 1024, 2),
            'category_counts': category_counts,
            'upload_dir': str(self.upload_dir)
        }
