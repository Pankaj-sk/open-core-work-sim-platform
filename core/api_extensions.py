#!/usr/bin/env python3
"""
API endpoints for calls and uploads
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import json

from .calls.ai_call_manager import CallManager, CallType
from .uploads.code_manager import CodeUploadManager

# Initialize managers
call_manager = CallManager()
upload_manager = CodeUploadManager()

router = APIRouter()

# Pydantic models for API
class CallRequest(BaseModel):
    call_type: str
    title: str
    description: str
    scheduled_start: datetime
    scheduled_end: datetime
    participants: List[dict]
    project_id: Optional[str] = None

class CallMessageRequest(BaseModel):
    participant_id: str
    message: str
    message_type: str = "text"

# Call endpoints
@router.post("/calls/schedule")
async def schedule_call(request: CallRequest):
    """Schedule a new call"""
    try:
        call_type = CallType(request.call_type)
        
        call_id = call_manager.schedule_call(
            call_type=call_type,
            title=request.title,
            description=request.description,
            scheduled_start=request.scheduled_start,
            scheduled_end=request.scheduled_end,
            participants=request.participants,
            project_id=request.project_id
        )
        
        return {"call_id": call_id, "status": "scheduled"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/calls/{call_id}/start")
async def start_call(call_id: str):
    """Start a scheduled call"""
    success = call_manager.start_call(call_id)
    
    if success:
        return {"status": "started"}
    else:
        raise HTTPException(status_code=404, detail="Call not found or cannot be started")

@router.post("/calls/{call_id}/message")
async def add_message_to_call(call_id: str, request: CallMessageRequest):
    """Add a message to an ongoing call"""
    success = call_manager.add_message_to_call(
        call_id=call_id,
        participant_id=request.participant_id,
        message=request.message,
        message_type=request.message_type
    )
    
    if success:
        return {"status": "message_added"}
    else:
        raise HTTPException(status_code=400, detail="Could not add message to call")

@router.post("/calls/{call_id}/end")
async def end_call(call_id: str):
    """End an ongoing call"""
    success = call_manager.end_call(call_id)
    
    if success:
        return {"status": "ended"}
    else:
        raise HTTPException(status_code=404, detail="Call not found or cannot be ended")

@router.get("/calls/active")
async def get_active_calls():
    """Get list of active calls"""
    return call_manager.get_active_calls()

@router.get("/calls/history")
async def get_call_history(limit: int = 50):
    """Get call history"""
    return call_manager.get_call_history(limit)

@router.get("/calls/{call_id}/insights/{agent_id}")
async def get_call_insights(call_id: str, agent_id: str):
    """Get emotion insights for an agent about a specific call"""
    insights = call_manager.get_call_insights_for_agent(call_id, agent_id)
    return {"insights": insights}

@router.delete("/calls/{call_id}")
async def cancel_call(call_id: str):
    """Cancel a scheduled call"""
    success = call_manager.cancel_call(call_id)
    
    if success:
        return {"status": "cancelled"}
    else:
        raise HTTPException(status_code=404, detail="Call not found or cannot be cancelled")

# Upload endpoints
@router.post("/uploads/file")
async def upload_file(
    file: UploadFile = File(...),
    uploader_id: str = Form(...),
    project_id: str = Form(...)
):
    """Upload a code file"""
    try:
        # Read file content
        content = await file.read()
        
        # Upload file
        file_id = upload_manager.upload_file(
            file_content=content,
            filename=file.filename,
            uploader_id=uploader_id,
            project_id=project_id
        )
        
        if file_id:
            return {
                "file_id": file_id,
                "filename": file.filename,
                "status": "uploaded"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to upload file")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/uploads/file/{file_id}")
async def get_file_info(file_id: str):
    """Get information about an uploaded file"""
    file_record = upload_manager.get_file(file_id)
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "file_id": file_record.file_id,
        "filename": file_record.original_filename,
        "file_type": file_record.file_type.value,
        "file_size": file_record.file_size,
        "upload_time": file_record.upload_time.isoformat(),
        "uploader_id": file_record.uploader_id,
        "project_id": file_record.project_id,
        "analysis": file_record.analysis
    }

@router.get("/uploads/file/{file_id}/content")
async def get_file_content(file_id: str, max_lines: int = 100):
    """Get file content formatted for agents"""
    content = upload_manager.get_file_content_for_agent(file_id, max_lines)
    
    if content == "File not found or not readable":
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"content": content}

@router.get("/uploads/project/{project_id}")
async def get_project_files(project_id: str):
    """Get all files for a project"""
    files = upload_manager.get_files_by_project(project_id)
    
    return [
        {
            "file_id": f.file_id,
            "filename": f.original_filename,
            "file_type": f.file_type.value,
            "file_size": f.file_size,
            "upload_time": f.upload_time.isoformat(),
            "analysis": f.analysis
        }
        for f in files
    ]

@router.get("/uploads/user/{uploader_id}")
async def get_user_files(uploader_id: str):
    """Get all files uploaded by a user"""
    files = upload_manager.get_files_by_uploader(uploader_id)
    
    return [
        {
            "file_id": f.file_id,
            "filename": f.original_filename,
            "file_type": f.file_type.value,
            "file_size": f.file_size,
            "upload_time": f.upload_time.isoformat(),
            "project_id": f.project_id,
            "analysis": f.analysis
        }
        for f in files
    ]

@router.delete("/uploads/file/{file_id}")
async def delete_file(file_id: str, requester_id: str):
    """Delete an uploaded file"""
    success = upload_manager.delete_file(file_id, requester_id)
    
    if success:
        return {"status": "deleted"}
    else:
        raise HTTPException(status_code=404, detail="File not found or not authorized")

# Integration endpoint - Agent can reference uploaded files
@router.get("/uploads/file/{file_id}/for-agent")
async def get_file_for_agent_discussion(file_id: str):
    """Get file content formatted for agent discussion"""
    content = upload_manager.get_file_content_for_agent(file_id, max_lines=50)
    
    if content == "File not found or not readable":
        raise HTTPException(status_code=404, detail="File not found")
    
    # Format for agent context
    return {
        "file_context": content,
        "usage_instruction": "You can reference this file in your responses. The user has shared this code with you for discussion, review, or help."
    }
