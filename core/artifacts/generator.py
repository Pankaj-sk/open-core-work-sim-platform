from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import uuid
from pydantic import BaseModel


class ArtifactTemplate(BaseModel):
    id: str
    name: str
    type: str  # document, report, presentation, etc.
    template: str
    variables: List[str]
    output_format: str = "json"


class Artifact(BaseModel):
    id: str
    template_id: str
    name: str
    content: Dict[str, Any]
    metadata: Dict[str, Any]
    created_at: datetime
    simulation_id: Optional[str] = None


class ArtifactGenerator:
    def __init__(self):
        self.templates: Dict[str, ArtifactTemplate] = self._load_templates()
        self.artifacts: List[Artifact] = []
    
    def _load_templates(self) -> Dict[str, ArtifactTemplate]:
        """Load artifact templates"""
        return {
            "meeting_minutes": ArtifactTemplate(
                id="meeting_minutes",
                name="Meeting Minutes",
                type="document",
                template="meeting_minutes_template",
                variables=["participants", "agenda", "decisions", "action_items"],
                output_format="markdown"
            ),
            "performance_report": ArtifactTemplate(
                id="performance_report",
                name="Performance Report",
                type="report",
                template="performance_report_template",
                variables=["employee", "period", "metrics", "feedback"],
                output_format="pdf"
            ),
            "project_proposal": ArtifactTemplate(
                id="project_proposal",
                name="Project Proposal",
                type="document",
                template="project_proposal_template",
                variables=["project_name", "objectives", "timeline", "budget"],
                output_format="docx"
            )
        }
    
    def generate_artifact(self, template_id: str, data: Dict[str, Any], 
                         simulation_id: Optional[str] = None) -> Artifact:
        """Generate an artifact using a template"""
        if template_id not in self.templates:
            raise ValueError(f"Template {template_id} not found")
        
        template = self.templates[template_id]
        
        # Validate required variables
        missing_vars = [var for var in template.variables if var not in data]
        if missing_vars:
            raise ValueError(f"Missing required variables: {missing_vars}")
        
        # Generate content based on template
        content = self._process_template(template, data)
        
        artifact = Artifact(
            id=str(uuid.uuid4()),
            template_id=template_id,
            name=template.name,
            content=content,
            metadata={
                "template_type": template.type,
                "output_format": template.output_format,
                "variables_used": list(data.keys())
            },
            created_at=datetime.now(),
            simulation_id=simulation_id
        )
        
        self.artifacts.append(artifact)
        return artifact
    
    def _process_template(self, template: ArtifactTemplate, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process template with data to generate content"""
        # Mock template processing
        if template.id == "meeting_minutes":
            return {
                "title": f"Meeting Minutes - {data.get('meeting_title', 'Untitled')}",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "participants": data.get("participants", []),
                "agenda": data.get("agenda", []),
                "decisions": data.get("decisions", []),
                "action_items": data.get("action_items", [])
            }
        elif template.id == "performance_report":
            return {
                "employee_name": data.get("employee", "Unknown"),
                "period": data.get("period", "Q1 2024"),
                "metrics": data.get("metrics", {}),
                "feedback": data.get("feedback", ""),
                "rating": data.get("rating", "Satisfactory")
            }
        else:
            return data
    
    def get_artifact(self, artifact_id: str) -> Optional[Artifact]:
        """Get a specific artifact"""
        for artifact in self.artifacts:
            if artifact.id == artifact_id:
                return artifact
        return None
    
    def get_artifacts_by_simulation(self, simulation_id: str) -> List[Artifact]:
        """Get all artifacts for a simulation"""
        return [a for a in self.artifacts if a.simulation_id == simulation_id]
    
    def get_available_templates(self) -> List[Dict]:
        """Get list of available templates"""
        return [
            {
                "id": template.id,
                "name": template.name,
                "type": template.type,
                "variables": template.variables
            }
            for template in self.templates.values()
        ]


# Global artifact generator instance
artifact_generator = ArtifactGenerator() 