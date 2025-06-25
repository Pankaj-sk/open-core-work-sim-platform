# Custom Model Integration Guide

## How to Integrate Your Custom Model API

### 1. **Configure Your API Settings**

Create a `.env` file in the root directory with your custom model settings:

```bash
# Custom Model Configuration
CUSTOM_MODEL_API_URL=https://your-api-endpoint.com/v1/chat/completions
CUSTOM_MODEL_API_KEY=your-api-key-here
CUSTOM_MODEL_NAME=your-model-name
CUSTOM_MODEL_MAX_TOKENS=150
CUSTOM_MODEL_TEMPERATURE=0.7
```

### 2. **API Response Format**

The system expects your API to return responses in one of these formats:

#### Option A: OpenAI-compatible format
```json
{
  "choices": [
    {
      "message": {
        "content": "Your model's response here"
      }
    }
  ]
}
```

#### Option B: Simple content format
```json
{
  "content": "Your model's response here"
}
```

#### Option C: Response field format
```json
{
  "response": "Your model's response here"
}
```

### 3. **Request Format**

Your API will receive requests in this format:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are Sarah Johnson, a Team Manager. Personality: Professional, supportive..."
    },
    {
      "role": "user", 
      "content": "User's message to the agent"
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "model": "your-model-name"
}
```

### 4. **Authentication**

If your API requires authentication, it will be sent as:
```
Authorization: Bearer your-api-key-here
```

### 5. **Customize the Response Parser**

If your API uses a different response format, modify the response parsing in:
`core/agents/manager.py` in the `_call_custom_model` method around lines 160-170.

### 6. **Testing Your Integration**

1. Set up your `.env` file with your API credentials
2. Start the backend: `python main.py`
3. Test the chat endpoint: `POST http://localhost:8000/api/v1/agents/manager_001/chat`
4. Send a test message and verify the response

### 7. **Error Handling**

The system includes automatic fallback to predefined responses if your API fails. You can customize these fallback responses in the `_get_fallback_response` method.

### 8. **Multiple Model Support**

To use different models for different agents, you can modify the `_call_custom_model` method to:
- Use different endpoints based on agent type
- Use different model names based on agent personality
- Adjust parameters (temperature, max_tokens) per agent

### Example Integration for Popular APIs:

#### Hugging Face Inference API:
```bash
CUSTOM_MODEL_API_URL=https://api-inference.huggingface.co/models/your-model-name
CUSTOM_MODEL_API_KEY=your-hf-token
```

#### Replicate API:
```bash
CUSTOM_MODEL_API_URL=https://api.replicate.com/v1/predictions
CUSTOM_MODEL_API_KEY=your-replicate-token
```

#### Together AI:
```bash
CUSTOM_MODEL_API_URL=https://api.together.xyz/inference
CUSTOM_MODEL_API_KEY=your-together-token
```

## Next Steps

1. ✅ **Configure your `.env` file** with your API details
2. ✅ **Test the API integration** with a simple chat request
3. ✅ **Customize agent personalities** in `core/agents/manager.py`
4. ✅ **Adjust response parsing** if needed for your API format
5. ✅ **Fine-tune parameters** (temperature, max_tokens) for your use case

The system is designed to be plug-and-play with most API formats!
