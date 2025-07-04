#!/usr/bin/env python3
"""
AI-Powered Emotion Analysis Module for SimWorld Calls
Uses AI models to analyze emotions during calls and provide feedback to agents
"""

import re
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from enum import Enum
import json
from dataclasses import dataclass
import logging
import requests
import os

# Lazy imports for heavy ML dependencies
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None

class EmotionType(Enum):
    CONFIDENT = "confident"
    NERVOUS = "nervous"
    EXCITED = "excited"
    FRUSTRATED = "frustrated"
    CALM = "calm"
    STRESSED = "stressed"
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    NEUTRAL = "neutral"
    FOCUSED = "focused"
    CONFUSED = "confused"
    ENTHUSIASTIC = "enthusiastic"
    TIRED = "tired"
    ANXIOUS = "anxious"

class EmotionIntensity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

@dataclass
class EmotionAnalysis:
    primary_emotion: EmotionType
    intensity: EmotionIntensity
    confidence: float
    secondary_emotions: List[EmotionType]
    indicators: List[str]
    timestamp: datetime

class AIEmotionAnalyzer:
    """AI-powered emotion analyzer using transformer models"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Initialize AI models (lazy loading)
        self.emotion_classifier = None
        self.sentiment_analyzer = None
        self.embedding_model = None
        
        # Voice analysis models (for tone detection)
        self.voice_emotion_analyzer = None
        self.voice_feature_extractor = None
        
        # Flag to track if models are initialized
        self._models_initialized = False
        
        # Context understanding
        self.conversation_context = {}
        
    def _ensure_models_loaded(self):
        """Ensure models are loaded (lazy loading)"""
        if not self._models_initialized:
            self._initialize_models()
            self._models_initialized = True
        
    def _initialize_models(self):
        """Initialize AI models for emotion analysis"""
        try:
            # Import heavy dependencies only when needed
            global np
            if not NUMPY_AVAILABLE:
                import numpy as np
            
            from transformers import pipeline
            import torch
            from sentence_transformers import SentenceTransformer
            
            # Emotion classification model
            self.logger.info("Loading emotion classification model...")
            self.emotion_classifier = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Sentiment analysis model
            self.logger.info("Loading sentiment analysis model...")
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Embedding model for semantic understanding
            self.logger.info("Loading embedding model...")
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            self.logger.info("All emotion analysis models loaded successfully")
            
        except ImportError as e:
            self.logger.warning(f"Could not load ML dependencies: {e}. Emotion analysis will be limited.")
            # Fallback to simpler models or API-based analysis
            self._initialize_fallback_models()
        except Exception as e:
            self.logger.error(f"Error initializing emotion models: {e}")
            # Fallback to simpler models or API-based analysis
            self._initialize_fallback_models()
    
    def _initialize_fallback_models(self):
        """Initialize fallback models if main models fail"""
        try:
            # Import dependencies locally
            from transformers import pipeline
            from sentence_transformers import SentenceTransformer
            
            # Use simpler models as fallback
            self.emotion_classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1  # CPU only
            )
            
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1
            )
            
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            self.logger.info("Fallback emotion models loaded")
            
        except Exception as e:
            self.logger.error(f"Error loading fallback models: {e}")
            self.emotion_classifier = None
            self.sentiment_analyzer = None
            self.embedding_model = None
        
    def _initialize_voice_models(self):
        """Initialize voice/audio analysis models for tone detection"""
        try:
            # Voice emotion recognition model
            self.logger.info("Loading voice emotion analysis model...")
            
            # Try to import audio processing libraries
            try:
                import librosa
                import soundfile as sf
                from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification
                
                # Load voice emotion model
                self.voice_processor = Wav2Vec2Processor.from_pretrained("superb/wav2vec2-base-superb-er")
                self.voice_emotion_model = Wav2Vec2ForSequenceClassification.from_pretrained("superb/wav2vec2-base-superb-er")
                
                self.logger.info("Voice emotion analysis models loaded successfully")
                
            except ImportError as e:
                self.logger.warning(f"Voice analysis libraries not available: {e}")
                self.logger.info("Install with: pip install librosa soundfile")
                
        except Exception as e:
            self.logger.error(f"Error initializing voice models: {e}")
    
    def analyze_message_with_ai(self, message: str, context: Dict[str, Any] = None) -> EmotionAnalysis:
        """Analyze emotion in a message using AI models"""
        
        # Ensure models are loaded before analysis
        self._ensure_models_loaded()
        
        if not message.strip():
            return EmotionAnalysis(
                primary_emotion=EmotionType.NEUTRAL,
                intensity=EmotionIntensity.LOW,
                confidence=0.5,
                secondary_emotions=[],
                indicators=["empty message"],
                timestamp=datetime.now()
            )
        
        try:
            # Get emotion classification
            emotion_results = self._get_ai_emotion_classification(message)
            
            # Get sentiment analysis
            sentiment_results = self._get_ai_sentiment_analysis(message)
            
            # Get contextual understanding
            context_analysis = self._analyze_context(message, context)
            
            # Combine results
            analysis = self._combine_ai_results(emotion_results, sentiment_results, context_analysis)
            
            return EmotionAnalysis(
                primary_emotion=analysis['primary_emotion'],
                intensity=analysis['intensity'],
                confidence=analysis['confidence'],
                secondary_emotions=analysis['secondary_emotions'],
                indicators=analysis['indicators'],
                timestamp=datetime.now()
            )
            
        except Exception as e:
            self.logger.error(f"Error in AI emotion analysis: {e}")
            return self._fallback_analysis(message)
    
    def _get_ai_emotion_classification(self, message: str) -> Dict[str, Any]:
        """Get emotion classification from AI model"""
        
        if not self.emotion_classifier:
            return {'emotion': 'neutral', 'confidence': 0.5}
        
        try:
            results = self.emotion_classifier(message)
            
            # Handle different model outputs
            if isinstance(results, list):
                result = results[0]
            else:
                result = results
            
            # Map model emotions to our emotion types
            emotion_mapping = {
                'joy': EmotionType.HAPPY,
                'sadness': EmotionType.SAD,
                'anger': EmotionType.ANGRY,
                'fear': EmotionType.NERVOUS,
                'surprise': EmotionType.EXCITED,
                'disgust': EmotionType.FRUSTRATED,
                'neutral': EmotionType.NEUTRAL,
                'positive': EmotionType.HAPPY,
                'negative': EmotionType.FRUSTRATED,
                'excited': EmotionType.EXCITED,
                'confident': EmotionType.CONFIDENT,
                'nervous': EmotionType.NERVOUS,
                'stressed': EmotionType.STRESSED,
                'calm': EmotionType.CALM,
                'focused': EmotionType.FOCUSED,
                'confused': EmotionType.CONFUSED
            }
            
            detected_emotion = result.get('label', 'neutral').lower()
            confidence = result.get('score', 0.5)
            
            mapped_emotion = emotion_mapping.get(detected_emotion, EmotionType.NEUTRAL)
            
            return {
                'emotion': mapped_emotion,
                'confidence': confidence,
                'raw_result': result
            }
            
        except Exception as e:
            self.logger.error(f"Error in emotion classification: {e}")
            return {'emotion': EmotionType.NEUTRAL, 'confidence': 0.5}
    
    def _get_ai_sentiment_analysis(self, message: str) -> Dict[str, Any]:
        """Get sentiment analysis from AI model"""
        
        if not self.sentiment_analyzer:
            return {'sentiment': 'neutral', 'confidence': 0.5}
        
        try:
            results = self.sentiment_analyzer(message)
            
            if isinstance(results, list):
                result = results[0]
            else:
                result = results
            
            sentiment = result.get('label', 'neutral').lower()
            confidence = result.get('score', 0.5)
            
            return {
                'sentiment': sentiment,
                'confidence': confidence,
                'raw_result': result
            }
            
        except Exception as e:
            self.logger.error(f"Error in sentiment analysis: {e}")
            return {'sentiment': 'neutral', 'confidence': 0.5}
    
    def _analyze_context(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyze contextual factors using AI"""
        
        if not context:
            return {'context_emotions': [], 'context_confidence': 0.5}
        
        try:
            # Use embedding model to understand semantic context
            if self.embedding_model:
                message_embedding = self.embedding_model.encode(message)
                
                # Define context emotion vectors
                context_emotions = {
                    'deadline_pressure': ['stressed', 'rushed', 'pressure', 'deadline'],
                    'team_meeting': ['collaborative', 'focused', 'professional'],
                    'client_call': ['formal', 'nervous', 'confident'],
                    'code_review': ['analytical', 'focused', 'critical'],
                    'brainstorming': ['creative', 'excited', 'enthusiastic']
                }
                
                call_type = context.get('call_type', '')
                if call_type in context_emotions:
                    context_text = ' '.join(context_emotions[call_type])
                    context_embedding = self.embedding_model.encode(context_text)
                    
                    # Calculate similarity
                    similarity = np.dot(message_embedding, context_embedding) / (
                        np.linalg.norm(message_embedding) * np.linalg.norm(context_embedding)
                    )
                    
                    return {
                        'context_emotions': context_emotions[call_type],
                        'context_confidence': float(similarity),
                        'call_type': call_type
                    }
            
            return {'context_emotions': [], 'context_confidence': 0.5}
            
        except Exception as e:
            self.logger.error(f"Error in context analysis: {e}")
            return {'context_emotions': [], 'context_confidence': 0.5}
    
    def _combine_ai_results(self, emotion_results: Dict, sentiment_results: Dict, 
                           context_analysis: Dict) -> Dict[str, Any]:
        """Combine AI analysis results into final emotion analysis"""
        
        # Primary emotion from AI model
        primary_emotion = emotion_results.get('emotion', EmotionType.NEUTRAL)
        emotion_confidence = emotion_results.get('confidence', 0.5)
        
        # Sentiment influence
        sentiment = sentiment_results.get('sentiment', 'neutral')
        sentiment_confidence = sentiment_results.get('confidence', 0.5)
        
        # Context influence
        context_confidence = context_analysis.get('context_confidence', 0.5)
        
        # Determine intensity based on confidence levels
        combined_confidence = (emotion_confidence + sentiment_confidence + context_confidence) / 3
        
        if combined_confidence > 0.8:
            intensity = EmotionIntensity.HIGH
        elif combined_confidence > 0.6:
            intensity = EmotionIntensity.MEDIUM
        else:
            intensity = EmotionIntensity.LOW
        
        # Secondary emotions from context
        secondary_emotions = []
        context_emotions = context_analysis.get('context_emotions', [])
        
        # Map context emotions to our emotion types
        context_emotion_mapping = {
            'stressed': EmotionType.STRESSED,
            'focused': EmotionType.FOCUSED,
            'nervous': EmotionType.NERVOUS,
            'confident': EmotionType.CONFIDENT,
            'excited': EmotionType.EXCITED,
            'creative': EmotionType.ENTHUSIASTIC,
            'analytical': EmotionType.FOCUSED
        }
        
        for context_emotion in context_emotions:
            if context_emotion in context_emotion_mapping:
                mapped_emotion = context_emotion_mapping[context_emotion]
                if mapped_emotion != primary_emotion:
                    secondary_emotions.append(mapped_emotion)
        
        # Generate indicators
        indicators = []
        indicators.append(f"AI emotion model: {primary_emotion.value} (confidence: {emotion_confidence:.2f})")
        indicators.append(f"Sentiment: {sentiment} (confidence: {sentiment_confidence:.2f})")
        
        if context_analysis.get('call_type'):
            indicators.append(f"Context: {context_analysis['call_type']} (relevance: {context_confidence:.2f})")
        
        return {
            'primary_emotion': primary_emotion,
            'intensity': intensity,
            'confidence': combined_confidence,
            'secondary_emotions': secondary_emotions[:3],  # Limit to top 3
            'indicators': indicators
        }
    
    def _fallback_analysis(self, message: str) -> EmotionAnalysis:
        """Fallback analysis when AI models fail"""
        
        # Simple keyword-based fallback
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['nervous', 'worried', 'anxious', 'scared']):
            primary_emotion = EmotionType.NERVOUS
        elif any(word in message_lower for word in ['excited', 'amazing', 'awesome', 'great']):
            primary_emotion = EmotionType.EXCITED
        elif any(word in message_lower for word in ['frustrated', 'annoying', 'terrible']):
            primary_emotion = EmotionType.FRUSTRATED
        elif any(word in message_lower for word in ['confident', 'sure', 'definitely']):
            primary_emotion = EmotionType.CONFIDENT
        elif any(word in message_lower for word in ['stressed', 'pressure', 'overwhelmed']):
            primary_emotion = EmotionType.STRESSED
        else:
            primary_emotion = EmotionType.NEUTRAL
        
        return EmotionAnalysis(
            primary_emotion=primary_emotion,
            intensity=EmotionIntensity.LOW,
            confidence=0.3,
            secondary_emotions=[],
            indicators=["fallback analysis"],
            timestamp=datetime.now()
        )
    
    def analyze_conversation_flow(self, messages: List[Dict[str, Any]], 
                                 call_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyze emotional flow throughout a conversation using AI"""
        
        participant_emotions = {}
        overall_flow = []
        
        for message in messages:
            participant_id = message.get('participant_id', '')
            message_text = message.get('message', '')
            timestamp = message.get('timestamp', '')
            
            # Analyze individual message with AI
            emotion_analysis = self.analyze_message_with_ai(message_text, call_context)
            
            # Track participant emotions
            if participant_id not in participant_emotions:
                participant_emotions[participant_id] = []
            
            participant_emotions[participant_id].append({
                'timestamp': timestamp,
                'emotion': emotion_analysis.primary_emotion.value,
                'intensity': emotion_analysis.intensity.value,
                'confidence': emotion_analysis.confidence,
                'secondary_emotions': [e.value for e in emotion_analysis.secondary_emotions],
                'indicators': emotion_analysis.indicators,
                'message': message_text[:100] + '...' if len(message_text) > 100 else message_text
            })
            
            # Add to overall flow
            overall_flow.append({
                'timestamp': timestamp,
                'participant_id': participant_id,
                'participant_name': message.get('participant_name', ''),
                'emotion': emotion_analysis.primary_emotion.value,
                'intensity': emotion_analysis.intensity.value,
                'confidence': emotion_analysis.confidence,
                'secondary_emotions': [e.value for e in emotion_analysis.secondary_emotions]
            })
        
        # Analyze patterns with AI insights
        patterns = self._analyze_ai_emotion_patterns(participant_emotions)
        
        # Generate AI-powered summary
        summary = self._generate_ai_emotion_summary(participant_emotions, call_context)
        
        return {
            'participant_emotions': participant_emotions,
            'overall_flow': overall_flow,
            'patterns': patterns,
            'summary': summary,
            'ai_insights': self._generate_ai_conversation_insights(participant_emotions, call_context)
        }
    
    def _analyze_emotion_patterns(self, participant_emotions: Dict[str, List]) -> Dict[str, Any]:
        """Analyze emotional patterns in the conversation"""
        
        patterns = {}
        
        for participant_id, emotions in participant_emotions.items():
            if not emotions:
                continue
            
            # Most common emotion
            emotion_counts = {}
            for emotion_data in emotions:
                emotion = emotion_data['emotion']
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            
            most_common = max(emotion_counts, key=emotion_counts.get) if emotion_counts else 'neutral'
            
            # Emotional trajectory
            first_emotion = emotions[0]['emotion'] if emotions else 'neutral'
            last_emotion = emotions[-1]['emotion'] if emotions else 'neutral'
            
            # Stability (how much emotions changed)
            unique_emotions = len(set(e['emotion'] for e in emotions))
            stability = 'stable' if unique_emotions <= 2 else 'varied'
            
            patterns[participant_id] = {
                'most_common_emotion': most_common,
                'first_emotion': first_emotion,
                'last_emotion': last_emotion,
                'emotional_stability': stability,
                'emotion_changes': unique_emotions,
                'total_messages': len(emotions)
            }
        
        return patterns
    
    def _generate_emotion_summary(self, participant_emotions: Dict[str, List]) -> Dict[str, Any]:
        """Generate a summary of the emotional state of the conversation"""
        
        all_emotions = []
        for emotions in participant_emotions.values():
            all_emotions.extend([e['emotion'] for e in emotions])
        
        if not all_emotions:
            return {'dominant_emotion': 'neutral', 'overall_mood': 'neutral'}
        
        # Most common emotion overall
        emotion_counts = {}
        for emotion in all_emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)
        
        # Determine overall mood
        positive_emotions = ['confident', 'excited', 'happy', 'enthusiastic', 'calm']
        negative_emotions = ['nervous', 'frustrated', 'stressed', 'sad', 'angry', 'anxious']
        
        positive_count = sum(emotion_counts.get(e, 0) for e in positive_emotions)
        negative_count = sum(emotion_counts.get(e, 0) for e in negative_emotions)
        
        if positive_count > negative_count:
            overall_mood = 'positive'
        elif negative_count > positive_count:
            overall_mood = 'negative'
        else:
            overall_mood = 'neutral'
        
        return {
            'dominant_emotion': dominant_emotion,
            'overall_mood': overall_mood,
            'emotion_distribution': emotion_counts,
            'total_messages': len(all_emotions)
        }
    
    def get_agent_emotion_context(self, analysis: Dict[str, Any], 
                                 target_participant: str) -> str:
        """Generate context for agents about detected emotions"""
        
        patterns = analysis.get('patterns', {})
        participant_pattern = patterns.get(target_participant, {})
        
        if not participant_pattern:
            return ""
        
        context_parts = []
        
        # Primary emotion
        most_common = participant_pattern.get('most_common_emotion', 'neutral')
        if most_common != 'neutral':
            context_parts.append(f"This person seems to be feeling {most_common}")
        
        # Emotional change
        first_emotion = participant_pattern.get('first_emotion', 'neutral')
        last_emotion = participant_pattern.get('last_emotion', 'neutral')
        
        if first_emotion != last_emotion:
            context_parts.append(f"Their mood shifted from {first_emotion} to {last_emotion}")
        
        # Stability
        stability = participant_pattern.get('emotional_stability', 'stable')
        if stability == 'varied':
            context_parts.append("They've shown varied emotions throughout the conversation")
        
        return "; ".join(context_parts)
    
    def get_conversation_insights(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate insights about the conversation for participants"""
        
        insights = []
        summary = analysis.get('summary', {})
        
        # Overall mood insight
        overall_mood = summary.get('overall_mood', 'neutral')
        dominant_emotion = summary.get('dominant_emotion', 'neutral')
        
        if overall_mood == 'positive':
            insights.append(f"The conversation had a positive tone with {dominant_emotion} being the dominant emotion")
        elif overall_mood == 'negative':
            insights.append(f"The conversation showed some challenges with {dominant_emotion} being prominent")
        
        # Participant insights
        patterns = analysis.get('patterns', {})
        
        # Find most engaged participant
        most_messages = 0
        most_engaged = None
        for participant_id, pattern in patterns.items():
            if pattern.get('total_messages', 0) > most_messages:
                most_messages = pattern.get('total_messages', 0)
                most_engaged = participant_id
        
        if most_engaged:
            insights.append(f"Participant {most_engaged} was most engaged with {most_messages} contributions")
        
        return insights
    
    def _analyze_ai_emotion_patterns(self, participant_emotions: Dict[str, List]) -> Dict[str, Any]:
        """Analyze emotional patterns using AI insights"""
        
        patterns = {}
        
        for participant_id, emotions in participant_emotions.items():
            if not emotions:
                continue
            
            # AI-powered pattern analysis
            emotion_sequence = [e['emotion'] for e in emotions]
            confidence_sequence = [e['confidence'] for e in emotions]
            
            # Most confident emotion (AI's strongest prediction)
            max_confidence_idx = confidence_sequence.index(max(confidence_sequence))
            most_confident_emotion = emotion_sequence[max_confidence_idx]
            
            # Emotional trajectory with confidence weighting
            weighted_emotions = {}
            for emotion, confidence in zip(emotion_sequence, confidence_sequence):
                if emotion not in weighted_emotions:
                    weighted_emotions[emotion] = []
                weighted_emotions[emotion].append(confidence)
            
            # Calculate weighted average for each emotion
            weighted_scores = {}
            for emotion, confidences in weighted_emotions.items():
                weighted_scores[emotion] = sum(confidences) / len(confidences)
            
            dominant_emotion = max(weighted_scores, key=weighted_scores.get)
            
            # Emotional stability based on confidence variance
            confidence_variance = np.var(confidence_sequence) if len(confidence_sequence) > 1 else 0
            stability = 'highly_stable' if confidence_variance < 0.01 else 'stable' if confidence_variance < 0.05 else 'variable'
            
            # Emotional journey analysis
            first_emotion = emotions[0]['emotion'] if emotions else 'neutral'
            last_emotion = emotions[-1]['emotion'] if emotions else 'neutral'
            
            # Secondary emotions analysis
            secondary_emotions_flat = []
            for emotion_data in emotions:
                secondary_emotions_flat.extend(emotion_data.get('secondary_emotions', []))
            
            secondary_emotion_counts = {}
            for emotion in secondary_emotions_flat:
                secondary_emotion_counts[emotion] = secondary_emotion_counts.get(emotion, 0) + 1
            
            patterns[participant_id] = {
                'dominant_emotion': dominant_emotion,
                'dominant_emotion_confidence': weighted_scores[dominant_emotion],
                'most_confident_emotion': most_confident_emotion,
                'max_confidence': max(confidence_sequence),
                'average_confidence': sum(confidence_sequence) / len(confidence_sequence),
                'emotional_stability': stability,
                'confidence_variance': confidence_variance,
                'first_emotion': first_emotion,
                'last_emotion': last_emotion,
                'emotion_changes': len(set(emotion_sequence)),
                'total_messages': len(emotions),
                'secondary_emotions': secondary_emotion_counts
            }
        
        return patterns
    
    def _generate_ai_emotion_summary(self, participant_emotions: Dict[str, List], 
                                    call_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate AI-powered emotion summary"""
        
        all_emotions = []
        all_confidences = []
        
        for emotions in participant_emotions.values():
            for emotion_data in emotions:
                all_emotions.append(emotion_data['emotion'])
                all_confidences.append(emotion_data['confidence'])
        
        if not all_emotions:
            return {'dominant_emotion': 'neutral', 'overall_mood': 'neutral', 'ai_confidence': 0.5}
        
        # Weighted emotion analysis
        emotion_confidence_pairs = list(zip(all_emotions, all_confidences))
        weighted_emotions = {}
        
        for emotion, confidence in emotion_confidence_pairs:
            if emotion not in weighted_emotions:
                weighted_emotions[emotion] = []
            weighted_emotions[emotion].append(confidence)
        
        # Calculate weighted scores
        weighted_scores = {}
        for emotion, confidences in weighted_emotions.items():
            weighted_scores[emotion] = sum(confidences) / len(confidences)
        
        dominant_emotion = max(weighted_scores, key=weighted_scores.get)
        overall_confidence = sum(all_confidences) / len(all_confidences)
        
        # AI-powered mood classification
        positive_emotions = ['confident', 'excited', 'happy', 'enthusiastic', 'calm', 'focused']
        negative_emotions = ['nervous', 'frustrated', 'stressed', 'sad', 'angry', 'anxious']
        
        positive_weight = sum(weighted_scores.get(e, 0) for e in positive_emotions)
        negative_weight = sum(weighted_scores.get(e, 0) for e in negative_emotions)
        
        if positive_weight > negative_weight * 1.2:  # Threshold for positive
            overall_mood = 'positive'
        elif negative_weight > positive_weight * 1.2:  # Threshold for negative
            overall_mood = 'negative'
        else:
            overall_mood = 'mixed'
        
        return {
            'dominant_emotion': dominant_emotion,
            'dominant_emotion_confidence': weighted_scores[dominant_emotion],
            'overall_mood': overall_mood,
            'overall_confidence': overall_confidence,
            'emotion_distribution': weighted_scores,
            'total_messages': len(all_emotions),
            'confidence_range': {
                'min': min(all_confidences),
                'max': max(all_confidences),
                'avg': overall_confidence
            }
        }
    
    def _generate_ai_conversation_insights(self, participant_emotions: Dict[str, List], 
                                          call_context: Dict[str, Any] = None) -> List[str]:
        """Generate AI-powered conversation insights"""
        
        insights = []
        
        # Analyze each participant's emotional journey
        for participant_id, emotions in participant_emotions.items():
            if not emotions:
                continue
            
            # Confidence trend analysis
            confidences = [e['confidence'] for e in emotions]
            if len(confidences) > 1:
                confidence_trend = 'increasing' if confidences[-1] > confidences[0] else 'decreasing'
                if abs(confidences[-1] - confidences[0]) > 0.2:
                    insights.append(f"Participant {participant_id} showed {confidence_trend} emotional clarity")
            
            # Emotional complexity analysis
            unique_emotions = set([e['emotion'] for e in emotions])
            if len(unique_emotions) > 3:
                insights.append(f"Participant {participant_id} expressed a wide range of emotions ({len(unique_emotions)} different types)")
            
            # High confidence insights
            high_confidence_emotions = [e for e in emotions if e['confidence'] > 0.8]
            if high_confidence_emotions:
                most_confident = max(high_confidence_emotions, key=lambda x: x['confidence'])
                insights.append(f"Participant {participant_id} showed strong {most_confident['emotion']} (confidence: {most_confident['confidence']:.2f})")
        
        # Overall conversation insights
        all_emotions = []
        for emotions in participant_emotions.values():
            all_emotions.extend(emotions)
        
        if all_emotions:
            avg_confidence = sum(e['confidence'] for e in all_emotions) / len(all_emotions)
            if avg_confidence > 0.8:
                insights.append("High emotional clarity throughout the conversation")
            elif avg_confidence < 0.5:
                insights.append("Mixed or ambiguous emotional signals detected")
        
        return insights
    
    def store_call_analysis_to_rag(self, call_id: int, analysis: Dict[str, Any], 
                                  rag_manager, project_id: str = None) -> None:
        """Store call emotion analysis in RAG memory system for future context"""
        
        try:
            # Create comprehensive call summary for RAG storage
            call_summary = self._generate_call_summary_for_rag(call_id, analysis)
            
            # Store in RAG with appropriate tags
            rag_manager.add_message(
                content=call_summary,
                project_id=project_id or "default",
                conversation_id=f"call_{call_id}",
                sender="system",
                agent_id=None,
                message_type="call_analysis"
            )
            
            # Store individual emotional insights
            for participant_id, emotions in analysis.get('participant_emotions', {}).items():
                participant_insights = self._generate_participant_insights_for_rag(
                    participant_id, emotions, call_id
                )
                
                rag_manager.add_message(
                    content=participant_insights,
                    project_id=project_id or "default",
                    conversation_id=f"participant_{participant_id}",
                    sender="system",
                    agent_id=None,
                    message_type="emotion_profile"
                )
            
            self.logger.info(f"Stored call {call_id} analysis in RAG memory")
            
        except Exception as e:
            self.logger.error(f"Error storing call analysis to RAG: {e}")
    
    def _generate_call_summary_for_rag(self, call_id: int, analysis: Dict[str, Any]) -> str:
        """Generate comprehensive call summary for RAG storage"""
        
        summary = analysis.get('summary', {})
        patterns = analysis.get('patterns', {})
        insights = analysis.get('ai_insights', [])
        
        # Build structured summary
        call_summary = f"""CALL ANALYSIS SUMMARY - Call ID: {call_id}
        
OVERALL EMOTIONAL TONE:
- Dominant emotion: {summary.get('dominant_emotion', 'neutral')}
- Overall mood: {summary.get('overall_mood', 'neutral')}
- Confidence level: {summary.get('overall_confidence', 0.5):.2f}
- Total messages analyzed: {summary.get('total_messages', 0)}

PARTICIPANT EMOTIONAL PATTERNS:
"""
        
        for participant_id, pattern in patterns.items():
            call_summary += f"""
- {participant_id}:
  * Primary emotion: {pattern.get('dominant_emotion', 'neutral')} (confidence: {pattern.get('dominant_emotion_confidence', 0.5):.2f})
  * Emotional stability: {pattern.get('emotional_stability', 'stable')}
  * Message count: {pattern.get('total_messages', 0)}
  * Emotional range: {pattern.get('emotion_changes', 0)} different emotions
"""
        
        # Add AI insights
        if insights:
            call_summary += "\nAI INSIGHTS:\n"
            for insight in insights:
                call_summary += f"- {insight}\n"
        
        call_summary += f"\nAnalysis timestamp: {datetime.now().isoformat()}"
        
        return call_summary
    
    def _generate_participant_insights_for_rag(self, participant_id: str, 
                                              emotions: List[Dict], call_id: int) -> str:
        """Generate participant-specific insights for RAG storage"""
        
        if not emotions:
            return f"No emotional data recorded for participant {participant_id} in call {call_id}"
        
        # Analyze emotional journey
        first_emotion = emotions[0].get('emotion', 'neutral')
        last_emotion = emotions[-1].get('emotion', 'neutral')
        
        # Calculate emotional metrics
        confidence_scores = [e.get('confidence', 0.5) for e in emotions]
        avg_confidence = sum(confidence_scores) / len(confidence_scores)
        
        # Most frequent emotion
        emotion_counts = {}
        for emotion_data in emotions:
            emotion = emotion_data.get('emotion', 'neutral')
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        most_frequent = max(emotion_counts, key=emotion_counts.get) if emotion_counts else 'neutral'
        
        insights = f"""PARTICIPANT EMOTION PROFILE - {participant_id} (Call {call_id})
        
EMOTIONAL JOURNEY:
- Started feeling: {first_emotion}
- Ended feeling: {last_emotion}
- Most frequent emotion: {most_frequent}
- Average AI confidence: {avg_confidence:.2f}
- Total interactions: {len(emotions)}

EMOTIONAL PATTERNS:
"""
        
        # Add specific emotional moments
        high_confidence_moments = [e for e in emotions if e.get('confidence', 0) > 0.8]
        if high_confidence_moments:
            insights += "High confidence emotional moments:\n"
            for moment in high_confidence_moments[:3]:  # Top 3
                insights += f"- {moment.get('emotion', 'neutral')} (confidence: {moment.get('confidence', 0):.2f})\n"
        
        # Add secondary emotions
        secondary_emotions = []
        for emotion_data in emotions:
            secondary_emotions.extend(emotion_data.get('secondary_emotions', []))
        
        if secondary_emotions:
            secondary_counts = {}
            for emotion in secondary_emotions:
                secondary_counts[emotion] = secondary_counts.get(emotion, 0) + 1
            
            top_secondary = max(secondary_counts, key=secondary_counts.get)
            insights += f"Most common secondary emotion: {top_secondary}\n"
        
        insights += f"\nProfile updated: {datetime.now().isoformat()}"
