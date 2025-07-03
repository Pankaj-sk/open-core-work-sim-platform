#!/usr/bin/env python3
"""
Code Upload Manager for SimWorld
Handles file uploads, code analysis, and integration with agent conversations
"""

import os
import uuid
import hashlib
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
import tempfile
import shutil
import logging

# Try to import magic, fallback to mimetypes if not available
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    import mimetypes
    MAGIC_AVAILABLE = False

logger = logging.getLogger(__name__)

class FileType(Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    HTML = "html"
    CSS = "css"
    JSON = "json"
    MARKDOWN = "markdown"
    TEXT = "text"
    SQL = "sql"
    JAVA = "java"
    CPP = "cpp"
    OTHER = "other"

@dataclass
class UploadedFile:
    file_id: str
    original_filename: str
    file_type: FileType
    file_size: int
    file_hash: str
    upload_time: datetime
    uploader_id: str
    project_id: str
    file_path: str
    content: Optional[str] = None
    analysis: Optional[Dict] = None

class CodeUploadManager:
    """Manages code file uploads and analysis"""
    
    def __init__(self, upload_directory: str = "uploads"):
        self.upload_directory = upload_directory
        self.uploaded_files: Dict[str, UploadedFile] = {}
        self.max_file_size = 10 * 1024 * 1024  # 10MB limit
        
        # Create upload directory if it doesn't exist
        os.makedirs(upload_directory, exist_ok=True)
        
        # File type detection
        self.file_extensions = {
            '.py': FileType.PYTHON,
            '.js': FileType.JAVASCRIPT,
            '.ts': FileType.TYPESCRIPT,
            '.html': FileType.HTML,
            '.css': FileType.CSS,
            '.json': FileType.JSON,
            '.md': FileType.MARKDOWN,
            '.txt': FileType.TEXT,
            '.sql': FileType.SQL,
            '.java': FileType.JAVA,
            '.cpp': FileType.CPP,
            '.c': FileType.CPP,
            '.h': FileType.CPP
        }
    
    def upload_file(self, file_content: bytes, filename: str, uploader_id: str, 
                   project_id: str) -> Optional[str]:
        """Upload a file and return file ID"""
        
        # Validate file size
        if len(file_content) > self.max_file_size:
            logger.error(f"File {filename} exceeds maximum size limit")
            return None
        
        # Detect file type
        file_extension = os.path.splitext(filename)[1].lower()
        file_type = self.file_extensions.get(file_extension, FileType.OTHER)
        
        # Generate file ID and hash
        file_id = str(uuid.uuid4())
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        # Check for duplicates
        for existing_file in self.uploaded_files.values():
            if existing_file.file_hash == file_hash and existing_file.project_id == project_id:
                logger.info(f"File {filename} already exists with ID {existing_file.file_id}")
                return existing_file.file_id
        
        # Save file to disk
        file_path = os.path.join(self.upload_directory, f"{file_id}_{filename}")
        
        try:
            with open(file_path, 'wb') as f:
                f.write(file_content)
        except Exception as e:
            logger.error(f"Error saving file {filename}: {e}")
            return None
        
        # Read content as text if possible
        content = None
        if file_type != FileType.OTHER:
            try:
                content = file_content.decode('utf-8')
            except UnicodeDecodeError:
                logger.warning(f"Could not decode {filename} as UTF-8")
        
        # Create file record
        uploaded_file = UploadedFile(
            file_id=file_id,
            original_filename=filename,
            file_type=file_type,
            file_size=len(file_content),
            file_hash=file_hash,
            upload_time=datetime.now(),
            uploader_id=uploader_id,
            project_id=project_id,
            file_path=file_path,
            content=content
        )
        
        # Analyze file if it's code
        if content and file_type != FileType.OTHER:
            uploaded_file.analysis = self._analyze_code_file(content, file_type)
        
        self.uploaded_files[file_id] = uploaded_file
        
        logger.info(f"Uploaded file {filename} with ID {file_id}")
        
        return file_id
    
    def _analyze_code_file(self, content: str, file_type: FileType) -> Dict[str, Any]:
        """Analyze uploaded code file"""
        
        analysis = {
            'line_count': len(content.splitlines()),
            'character_count': len(content),
            'file_type': file_type.value,
            'analysis_time': datetime.now().isoformat()
        }
        
        lines = content.splitlines()
        
        # Basic code analysis
        if file_type == FileType.PYTHON:
            analysis.update(self._analyze_python_code(lines))
        elif file_type in [FileType.JAVASCRIPT, FileType.TYPESCRIPT]:
            analysis.update(self._analyze_javascript_code(lines))
        elif file_type == FileType.HTML:
            analysis.update(self._analyze_html_code(lines))
        elif file_type == FileType.CSS:
            analysis.update(self._analyze_css_code(lines))
        elif file_type == FileType.SQL:
            analysis.update(self._analyze_sql_code(lines))
        
        return analysis
    
    def _analyze_python_code(self, lines: List[str]) -> Dict[str, Any]:
        """Analyze Python code"""
        
        analysis = {
            'functions': [],
            'classes': [],
            'imports': [],
            'comments': 0,
            'docstrings': 0
        }
        
        in_docstring = False
        docstring_char = None
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Check for docstrings
            if not in_docstring:
                if stripped.startswith('"""') or stripped.startswith("'''"):
                    docstring_char = stripped[:3]
                    if stripped.count(docstring_char) == 1:  # Opening docstring
                        in_docstring = True
                        analysis['docstrings'] += 1
                    elif stripped.count(docstring_char) >= 2:  # Single line docstring
                        analysis['docstrings'] += 1
            else:
                if docstring_char in stripped:
                    in_docstring = False
            
            # Skip if in docstring
            if in_docstring:
                continue
            
            # Comments
            if stripped.startswith('#'):
                analysis['comments'] += 1
            
            # Functions
            if stripped.startswith('def '):
                func_name = stripped.split('(')[0].replace('def ', '').strip()
                analysis['functions'].append({
                    'name': func_name,
                    'line': i + 1
                })
            
            # Classes
            elif stripped.startswith('class '):
                class_name = stripped.split('(')[0].split(':')[0].replace('class ', '').strip()
                analysis['classes'].append({
                    'name': class_name,
                    'line': i + 1
                })
            
            # Imports
            elif stripped.startswith('import ') or stripped.startswith('from '):
                analysis['imports'].append({
                    'statement': stripped,
                    'line': i + 1
                })
        
        return analysis
    
    def _analyze_javascript_code(self, lines: List[str]) -> Dict[str, Any]:
        """Analyze JavaScript/TypeScript code"""
        
        analysis = {
            'functions': [],
            'classes': [],
            'imports': [],
            'comments': 0,
            'variables': []
        }
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Comments
            if stripped.startswith('//') or stripped.startswith('/*'):
                analysis['comments'] += 1
            
            # Functions
            if 'function ' in stripped or '=>' in stripped:
                analysis['functions'].append({
                    'line': i + 1,
                    'content': stripped[:50] + '...' if len(stripped) > 50 else stripped
                })
            
            # Classes
            if stripped.startswith('class '):
                class_name = stripped.split('{')[0].replace('class ', '').strip()
                analysis['classes'].append({
                    'name': class_name,
                    'line': i + 1
                })
            
            # Imports
            if stripped.startswith('import ') or stripped.startswith('require('):
                analysis['imports'].append({
                    'statement': stripped,
                    'line': i + 1
                })
            
            # Variables
            if stripped.startswith('const ') or stripped.startswith('let ') or stripped.startswith('var '):
                var_name = stripped.split('=')[0].strip().split(' ')[1] if '=' in stripped else ''
                if var_name:
                    analysis['variables'].append({
                        'name': var_name,
                        'line': i + 1
                    })
        
        return analysis
    
    def _analyze_html_code(self, lines: List[str]) -> Dict[str, Any]:
        """Analyze HTML code"""
        
        analysis = {
            'tags': [],
            'ids': [],
            'classes': [],
            'scripts': 0,
            'styles': 0
        }
        
        content = '\n'.join(lines)
        
        # Simple tag extraction
        import re
        
        # Find all tags
        tags = re.findall(r'<(\w+)', content)
        analysis['tags'] = list(set(tags))
        
        # Find IDs
        ids = re.findall(r'id=["\']([^"\']+)["\']', content)
        analysis['ids'] = ids
        
        # Find classes
        classes = re.findall(r'class=["\']([^"\']+)["\']', content)
        analysis['classes'] = classes
        
        # Count scripts and styles
        analysis['scripts'] = content.count('<script')
        analysis['styles'] = content.count('<style')
        
        return analysis
    
    def _analyze_css_code(self, lines: List[str]) -> Dict[str, Any]:
        """Analyze CSS code"""
        
        analysis = {
            'selectors': [],
            'properties': [],
            'media_queries': 0,
            'comments': 0
        }
        
        content = '\n'.join(lines)
        
        # Count comments
        analysis['comments'] = content.count('/*')
        
        # Count media queries
        analysis['media_queries'] = content.count('@media')
        
        # Simple selector and property extraction
        import re
        
        # Find selectors (simplified)
        selectors = re.findall(r'([.#\w\s,>+~:[\]()"-]+)\s*{', content)
        analysis['selectors'] = [s.strip() for s in selectors if s.strip()]
        
        # Find properties
        properties = re.findall(r'(\w+(?:-\w+)*)\s*:', content)
        analysis['properties'] = list(set(properties))
        
        return analysis
    
    def _analyze_sql_code(self, lines: List[str]) -> Dict[str, Any]:
        """Analyze SQL code"""
        
        analysis = {
            'statements': [],
            'tables': [],
            'comments': 0
        }
        
        content = '\n'.join(lines).upper()
        
        # Count comments
        for line in lines:
            if line.strip().startswith('--'):
                analysis['comments'] += 1
        
        # Find SQL statements
        sql_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER']
        for keyword in sql_keywords:
            if keyword in content:
                analysis['statements'].append(keyword)
        
        # Simple table extraction
        import re
        tables = re.findall(r'FROM\s+(\w+)', content)
        tables.extend(re.findall(r'JOIN\s+(\w+)', content))
        tables.extend(re.findall(r'TABLE\s+(\w+)', content))
        analysis['tables'] = list(set(tables))
        
        return analysis
    
    def get_file(self, file_id: str) -> Optional[UploadedFile]:
        """Get uploaded file by ID"""
        return self.uploaded_files.get(file_id)
    
    def get_files_by_project(self, project_id: str) -> List[UploadedFile]:
        """Get all files for a project"""
        return [f for f in self.uploaded_files.values() if f.project_id == project_id]
    
    def get_files_by_uploader(self, uploader_id: str) -> List[UploadedFile]:
        """Get all files uploaded by a user"""
        return [f for f in self.uploaded_files.values() if f.uploader_id == uploader_id]
    
    def delete_file(self, file_id: str, requester_id: str) -> bool:
        """Delete an uploaded file"""
        
        if file_id not in self.uploaded_files:
            return False
        
        file_record = self.uploaded_files[file_id]
        
        # Check permissions (only uploader can delete)
        if file_record.uploader_id != requester_id:
            logger.error(f"User {requester_id} not authorized to delete file {file_id}")
            return False
        
        # Remove file from disk
        try:
            if os.path.exists(file_record.file_path):
                os.remove(file_record.file_path)
        except Exception as e:
            logger.error(f"Error deleting file from disk: {e}")
        
        # Remove from memory
        del self.uploaded_files[file_id]
        
        logger.info(f"Deleted file {file_id}")
        
        return True
    
    def get_file_content_for_agent(self, file_id: str, max_lines: int = 100) -> str:
        """Get file content formatted for agent consumption"""
        
        file_record = self.get_file(file_id)
        if not file_record or not file_record.content:
            return "File not found or not readable"
        
        lines = file_record.content.splitlines()
        
        # Truncate if too long
        if len(lines) > max_lines:
            truncated_content = '\n'.join(lines[:max_lines])
            truncated_content += f"\n... (truncated - showing {max_lines} of {len(lines)} lines)"
        else:
            truncated_content = file_record.content
        
        # Add file info
        file_info = f"""
File: {file_record.original_filename}
Type: {file_record.file_type.value}
Size: {file_record.file_size} bytes
Lines: {len(lines)}
Uploaded: {file_record.upload_time.strftime('%Y-%m-%d %H:%M:%S')}

Content:
{truncated_content}
        """.strip()
        
        # Add analysis if available
        if file_record.analysis:
            analysis_summary = self._format_analysis_for_agent(file_record.analysis)
            file_info += f"\n\nCode Analysis:\n{analysis_summary}"
        
        return file_info
    
    def _format_analysis_for_agent(self, analysis: Dict[str, Any]) -> str:
        """Format code analysis for agent consumption"""
        
        summary_parts = []
        
        if 'line_count' in analysis:
            summary_parts.append(f"Lines of code: {analysis['line_count']}")
        
        if 'functions' in analysis and analysis['functions']:
            func_names = [f['name'] for f in analysis['functions'][:5]]  # Show first 5
            summary_parts.append(f"Functions: {', '.join(func_names)}")
            if len(analysis['functions']) > 5:
                summary_parts.append(f"... and {len(analysis['functions']) - 5} more")
        
        if 'classes' in analysis and analysis['classes']:
            class_names = [c['name'] for c in analysis['classes']]
            summary_parts.append(f"Classes: {', '.join(class_names)}")
        
        if 'imports' in analysis and analysis['imports']:
            summary_parts.append(f"Import statements: {len(analysis['imports'])}")
        
        if 'comments' in analysis:
            summary_parts.append(f"Comments: {analysis['comments']}")
        
        return '\n'.join(summary_parts) if summary_parts else "No specific analysis available"
