#!/usr/bin/env python3
"""
Audio Call Manager Module for SimWorld
Handles audio-based conversations with AI personas using speech-to-text and text-to-speech
"""

from typing import Dict, List, Optional, Any, AsyncGenerator
import asyncio
import json
import logging
import tempfile
import os
from datetime import datetime
import wave
import io
import base64

# Audio processing imports (would need to be added to requirements.txt)
try:
    import speech_recognition as sr
    import pyttsx3
    import pyaudio
    from pydub import AudioSegment
    from pydub.playback import play
    import numpy as np
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    logging.warning("Audio libraries not available. Install speech_recognition, pyttsx3, pyaudio, pydub")

from ..agents.manager import AgentManager
from ..persona_behavior import PersonaBehaviorManager
from .emotion_analyzer import AIEmotionAnalyzer

logger = logging.getLogger(__name__)

class AudioCallManager:
    """Manages audio-based calls with AI personas"""
    
    def __init__(self):
        self.agent_manager = AgentManager()
        self.persona_manager = PersonaBehaviorManager()
        self.emotion_analyzer = AIEmotionAnalyzer()
        
        # Audio components
        self.speech_recognizer = None
        self.tts_engines = {}  # Different TTS voices for different personas
        self.active_audio_calls = {}
        
        if AUDIO_AVAILABLE:
            self._initialize_audio_components()
        else:
            logger.warning("Audio features disabled - required libraries not installed")
    
    def _initialize_audio_components(self):
        """Initialize speech recognition and text-to-speech engines"""
        try:
            # Initialize speech recognition
            self.speech_recognizer = sr.Recognizer()
            self.microphone = sr.Microphone()
            
            # Adjust for ambient noise
            with self.microphone as source:
                self.speech_recognizer.adjust_for_ambient_noise(source)
            
            logger.info("Speech recognition initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize audio components: {e}")
    
    def _get_persona_voice_settings(self, persona_id: str) -> Dict[str, Any]:
        """Get voice settings for a specific persona"""
        # Default voice settings - can be customized per persona
        voice_settings = {
            "rate": 150,  # Words per minute
            "volume": 0.8,
            "voice_id": 0  # Default voice
        }
        
        # Customize voice based on persona characteristics
        try:
            # Get persona details from agent manager
            agent_info = self.agent_manager.get_agent(persona_id)
            if agent_info:
                personality = agent_info.get('personality_traits', {})
                role = agent_info.get('role', '')
                
                # Adjust voice based on role and personality
                if 'senior' in role.lower() or 'lead' in role.lower():
                    voice_settings['rate'] = 140  # Slower, more authoritative
                    voice_settings['voice_id'] = 1  # Deeper voice
                elif 'junior' in role.lower() or 'intern' in role.lower():
                    voice_settings['rate'] = 160  # Faster, more enthusiastic
                    voice_settings['voice_id'] = 2  # Higher voice
                
                # Adjust based on personality traits
                if personality.get('confidence', 0.5) > 0.7:
                    voice_settings['volume'] = 0.9
                elif personality.get('confidence', 0.5) < 0.3:
                    voice_settings['volume'] = 0.6
                    
        except Exception as e:
            logger.warning(f"Could not customize voice for persona {persona_id}: {e}")
        
        return voice_settings
    
    def _create_tts_engine(self, persona_id: str) -> Optional[Any]:
        """Create a TTS engine for a specific persona"""
        if not AUDIO_AVAILABLE:
            return None
            
        try:
            engine = pyttsx3.init()
            voice_settings = self._get_persona_voice_settings(persona_id)
            
            # Apply voice settings
            engine.setProperty('rate', voice_settings['rate'])
            engine.setProperty('volume', voice_settings['volume'])
            
            # Set voice (if available)
            voices = engine.getProperty('voices')
            if voices and len(voices) > voice_settings['voice_id']:
                engine.setProperty('voice', voices[voice_settings['voice_id']].id)
            
            return engine
            
        except Exception as e:
            logger.error(f"Failed to create TTS engine for persona {persona_id}: {e}")
            return None
    
    async def start_audio_call(self, call_id: str, project_id: str, participants: List[str]) -> Dict[str, Any]:
        """Start an audio call with AI personas"""
        if not AUDIO_AVAILABLE:
            return {"success": False, "error": "Audio features not available"}
        
        try:
            # Initialize TTS engines for all AI participants
            for participant_id in participants:
                if participant_id not in self.tts_engines:
                    engine = self._create_tts_engine(participant_id)
                    if engine:
                        self.tts_engines[participant_id] = engine
            
            # Store call info
            self.active_audio_calls[call_id] = {
                "project_id": project_id,
                "participants": participants,
                "start_time": datetime.utcnow(),
                "messages": [],
                "is_active": True
            }
            
            # Start listening for audio input
            asyncio.create_task(self._audio_listening_loop(call_id))
            
            return {"success": True, "call_id": call_id, "message": "Audio call started"}
            
        except Exception as e:
            logger.error(f"Failed to start audio call: {e}")
            return {"success": False, "error": str(e)}
    
    async def _audio_listening_loop(self, call_id: str):
        """Continuous audio listening loop for a call"""
        if call_id not in self.active_audio_calls:
            return
        
        call_info = self.active_audio_calls[call_id]
        
        while call_info.get("is_active", False):
            try:
                # Listen for audio input
                audio_text = await self._listen_for_speech()
                
                if audio_text:
                    # Process user speech
                    await self._process_user_speech(call_id, audio_text)
                
                # Brief pause to prevent overwhelming the system
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error in audio listening loop: {e}")
                break
    
    async def _listen_for_speech(self, timeout: float = 5.0) -> Optional[str]:
        """Listen for speech and convert to text"""
        if not AUDIO_AVAILABLE or not self.speech_recognizer:
            return None
        
        try:
            # Use a short timeout to avoid blocking
            with self.microphone as source:
                audio = self.speech_recognizer.listen(source, timeout=timeout, phrase_time_limit=10)
            
            # Convert speech to text
            text = self.speech_recognizer.recognize_google(audio)
            logger.info(f"Speech recognized: {text}")
            return text
            
        except sr.WaitTimeoutError:
            # No speech detected - this is normal
            return None
        except sr.UnknownValueError:
            logger.debug("Could not understand audio")
            return None
        except Exception as e:
            logger.error(f"Speech recognition error: {e}")
            return None
    
    async def _process_user_speech(self, call_id: str, speech_text: str):
        """Process user speech and generate AI persona responses"""
        if call_id not in self.active_audio_calls:
            return
        
        call_info = self.active_audio_calls[call_id]
        
        try:
            # Store user message
            user_message = {
                "sender": "user",
                "content": speech_text,
                "timestamp": datetime.utcnow(),
                "type": "audio"
            }
            call_info["messages"].append(user_message)
            
            # Analyze emotions in speech
            emotion_analysis = await self.emotion_analyzer.analyze_text_emotions(speech_text)
            user_message["emotion_analysis"] = emotion_analysis
            
            # Generate responses from AI personas
            for participant_id in call_info["participants"]:
                if participant_id != "user":  # Skip user
                    response = await self._generate_persona_response(
                        participant_id, speech_text, call_info["project_id"], call_info["messages"]
                    )
                    
                    if response:
                        # Store AI response
                        ai_message = {
                            "sender": participant_id,
                            "content": response,
                            "timestamp": datetime.utcnow(),
                            "type": "audio"
                        }
                        call_info["messages"].append(ai_message)
                        
                        # Convert to speech and play
                        await self._speak_response(participant_id, response)
            
        except Exception as e:
            logger.error(f"Error processing user speech: {e}")
    
    async def _generate_persona_response(self, persona_id: str, user_message: str, 
                                       project_id: str, conversation_history: List[Dict]) -> Optional[str]:
        """Generate a response from an AI persona"""
        try:
            # Get persona context
            agent_info = self.agent_manager.get_agent(persona_id)
            if not agent_info:
                return None
            
            # Build conversation context
            recent_messages = conversation_history[-10:]  # Last 10 messages
            context_messages = []
            
            for msg in recent_messages:
                role = "user" if msg["sender"] == "user" else "assistant"
                context_messages.append({
                    "role": role,
                    "content": f"{msg['sender']}: {msg['content']}"
                })
            
            # Generate response using persona behavior
            response = await self.persona_manager.generate_response(
                agent_id=persona_id,
                message=user_message,
                conversation_context=context_messages,
                project_id=project_id
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating persona response: {e}")
            return None
    
    async def _speak_response(self, persona_id: str, text: str):
        """Convert text to speech for a specific persona"""
        if not AUDIO_AVAILABLE or persona_id not in self.tts_engines:
            logger.info(f"[{persona_id}]: {text}")  # Fallback to text display
            return
        
        try:
            engine = self.tts_engines[persona_id]
            
            # Create a temporary file for the speech
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                engine.save_to_file(text, temp_file.name)
                engine.runAndWait()
                
                # Play the audio file
                # Note: In a real implementation, this would be streamed to the client
                logger.info(f"[{persona_id} speaking]: {text}")
                
                # Clean up temp file
                os.unlink(temp_file.name)
                
        except Exception as e:
            logger.error(f"Error speaking response for {persona_id}: {e}")
            # Fallback to text
            logger.info(f"[{persona_id}]: {text}")
    
    async def end_audio_call(self, call_id: str) -> Dict[str, Any]:
        """End an audio call"""
        try:
            if call_id in self.active_audio_calls:
                call_info = self.active_audio_calls[call_id]
                call_info["is_active"] = False
                call_info["end_time"] = datetime.utcnow()
                
                # Generate call summary
                summary = await self._generate_call_summary(call_info)
                call_info["summary"] = summary
                
                # Move to history
                del self.active_audio_calls[call_id]
                
                return {
                    "success": True,
                    "summary": summary,
                    "duration_minutes": (call_info["end_time"] - call_info["start_time"]).total_seconds() / 60
                }
            else:
                return {"success": False, "error": "Call not found"}
                
        except Exception as e:
            logger.error(f"Error ending audio call: {e}")
            return {"success": False, "error": str(e)}
    
    async def _generate_call_summary(self, call_info: Dict[str, Any]) -> str:
        """Generate a summary of the audio call"""
        try:
            messages = call_info.get("messages", [])
            if not messages:
                return "No conversation recorded."
            
            # Extract key points from conversation
            conversation_text = []
            for msg in messages:
                conversation_text.append(f"{msg['sender']}: {msg['content']}")
            
            full_conversation = "\n".join(conversation_text)
            
            # Use AI to generate summary (would integrate with your AI service)
            summary = f"Audio call summary ({len(messages)} messages exchanged)"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating call summary: {e}")
            return "Error generating summary"
    
    def get_call_status(self, call_id: str) -> Dict[str, Any]:
        """Get the current status of an audio call"""
        if call_id in self.active_audio_calls:
            call_info = self.active_audio_calls[call_id]
            return {
                "call_id": call_id,
                "is_active": call_info.get("is_active", False),
                "participants": call_info.get("participants", []),
                "message_count": len(call_info.get("messages", [])),
                "duration_minutes": (datetime.utcnow() - call_info["start_time"]).total_seconds() / 60
            }
        else:
            return {"call_id": call_id, "is_active": False, "error": "Call not found"}

# Export the audio call manager
audio_call_manager = AudioCallManager()
