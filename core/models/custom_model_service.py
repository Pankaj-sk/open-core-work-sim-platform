import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from typing import Optional
import logging
import os

logger = logging.getLogger(__name__)

class CustomModelService:
    """
    Service for loading and running custom trained models locally
    """
    
    def __init__(self, model_path: str, device: str = "auto"):
        self.model_path = model_path
        self.device = self._get_device(device)
        self.model = None
        self.tokenizer = None
        self._load_model()
    
    def _get_device(self, device: str) -> str:
        """Determine the best device to use"""
        if device == "auto":
            if torch.cuda.is_available():
                return "cuda"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                return "mps"  # Apple Silicon
            else:
                return "cpu"
        return device
    
    def _load_model(self):
        """Load the model and tokenizer"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model path does not exist: {self.model_path}")
            
            logger.info(f"Loading custom model from {self.model_path}")
            logger.info(f"Using device: {self.device}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path,
                trust_remote_code=True
            )
            
            # Load model with appropriate settings
            model_kwargs = {
                "trust_remote_code": True,
                "torch_dtype": torch.float16 if self.device == "cuda" else torch.float32,
            }
            
            if self.device == "cuda":
                model_kwargs["device_map"] = "auto"
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_path,
                **model_kwargs
            )
            
            # Move to device if not using device_map
            if self.device != "cuda":
                self.model = self.model.to(self.device)
            
            # Add padding token if not present
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Set model to evaluation mode
            self.model.eval()
            
            # Compile model for faster inference (PyTorch 2.0+)
            if hasattr(torch, 'compile') and self.device == "cuda":
                try:
                    self.model = torch.compile(self.model)
                    logger.info("Model compiled for faster inference")
                except Exception as e:
                    logger.warning(f"Could not compile model: {e}")
                
            logger.info("Custom model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load custom model: {e}")
            raise
    
    def generate_response(self, 
                         system_prompt: str, 
                         user_message: str,
                         max_tokens: int = 150,
                         temperature: float = 0.7,
                         top_p: float = 0.9) -> str:
        """
        Generate a response using the custom model
        
        Args:
            system_prompt: The system/persona prompt
            user_message: The user's message
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            
        Returns:
            Generated response string
        """
        try:
            if self.model is None or self.tokenizer is None:
                raise RuntimeError("Model not loaded")
            
            # Format prompt - adjust this based on your training format
            # Common formats:
            # Option 1: Chat format
            full_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{user_message}\n<|assistant|>\n"
            
            # Option 2: Simple format
            # full_prompt = f"System: {system_prompt}\nUser: {user_message}\nAssistant:"
            
            # Option 3: Alpaca format
            # full_prompt = f"### Instruction:\n{system_prompt}\n\n### Input:\n{user_message}\n\n### Response:\n"
            
            # Tokenize
            inputs = self.tokenizer(
                full_prompt, 
                return_tensors="pt", 
                padding=True, 
                truncation=True,
                max_length=512
            ).to(self.device)
            
            # Generate response
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=True,
                    pad_token_id=self.tokenizer.pad_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1,
                    no_repeat_ngram_size=3
                )
            
            # Decode only the new tokens
            new_tokens = outputs[0][inputs['input_ids'].shape[1]:]
            response = self.tokenizer.decode(
                new_tokens, 
                skip_special_tokens=True
            ).strip()
            
            # Clean up response
            response = self._clean_response(response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise
    
    def _clean_response(self, response: str) -> str:
        """Clean up the generated response"""
        # Remove common artifacts
        response = response.strip()
        
        # Remove incomplete sentences at the end
        if response and not response[-1] in '.!?':
            # Find the last complete sentence
            last_punct = max(
                response.rfind('.'),
                response.rfind('!'),
                response.rfind('?')
            )
            if last_punct > len(response) * 0.5:  # Only if we have substantial content
                response = response[:last_punct + 1]
        
        return response
    
    def is_available(self) -> bool:
        """Check if the model is loaded and available"""
        return self.model is not None and self.tokenizer is not None
    
    def get_model_info(self) -> dict:
        """Get information about the loaded model"""
        if not self.is_available():
            return {"status": "not_loaded"}
        
        return {
            "status": "loaded",
            "model_path": self.model_path,
            "device": self.device,
            "model_type": self.model.config.model_type if hasattr(self.model, 'config') else "unknown",
            "vocab_size": len(self.tokenizer) if self.tokenizer else 0
        }
