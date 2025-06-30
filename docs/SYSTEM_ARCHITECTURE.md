# System Architecture: Immersive AI Workplace Simulation

This document outlines the system architecture for the multi-agent AI workplace simulation platform. The design is component-based, ensuring modularity, scalability, and maintainability.

## 1. Architecture Overview

The system is designed around a microservices-inspired architecture, with distinct components handling specific responsibilities. This allows for independent development, scaling, and maintenance of each part of the system.

```
+----------------------+      +-------------------------+      +-----------------------+
|                      |      |                         |      |                       |
|   React Frontend     +----->|   FastAPI Backend Gateway +----->|  Authentication Service |
| (User Interface)     |      |    (api.py)             |      |      (User Auth)      |
|                      |      |                         |      |                       |
+----------------------+      +-----------+-------------+      +-----------------------+
                                          |
                                          |
          +-------------------------------+--------------------------------+
          |                               |                                |
+---------v-------------+      +----------v------------+      +------------v----------+
|                       |      |                       |      |                       |
| Project Management    +----->| Agent Management      +----->|  Conversation Service |
|      Service          |      |      Service          |      |   (Real-time Chat)    |
| (Projects, Roles)     |      | (AI Personas)         |      |                       |
+-----------------------+      +-----------------------+      +-----------------------+
          |                               ^                                |
          |                               |                                |
+---------v-------------+      +----------+------------+      +------------v----------+
|                       |      |                       |      |                       |
|  Scheduler &          |      |   RAG Service         |      |   LLM Integration     |
|  Background Worker    |<---->| (Project Memory Core) |<---->|       Layer         |
| (AI-Initiated Events) |      |                       |      | (Gemini, OpenAI, etc.)|
+-----------------------+      +-----------+-----------+      +-----------------------+
                                          |
                               +----------v-----------+
                               |                       |
                               |   Data Persistence    |
                               | (PostgreSQL, VectorDB)|
                               |                       |
                               +-----------------------+
```

## 2. Core Components

### 2.1. Frontend (React)

*   **Responsibilities:**
    *   Provides the user interface for all interactions.
    *   Handles user registration, login, and session management.
    *   Manages project creation and role selection UI.
    *   Displays the chat interface for conversations with AI personas.
    *   Presents the daily conversation and activity log.
    *   Communicates with the Backend Gateway via a RESTful API.

### 2.2. Backend Gateway (FastAPI)

*   **Responsibilities:**
    *   Acts as the single entry point for the frontend.
    *   Routes incoming requests to the appropriate downstream service.
    *   Handles request validation and serialization.
    *   Aggregates responses from multiple services if needed.
    *   Corresponds to the existing `core/api.py`.

### 2.3. Authentication Service

*   **Responsibilities:**
    *   Manages user onboarding (registration), login, and logout.
    *   Issues, validates, and refreshes authentication tokens (e.g., JWT).
    *   Securely stores user credentials in a persistent database (e.g., PostgreSQL).
    *   **Fulfills Requirement 1 (User Onboarding).**

### 2.4. Project Management Service

*   **Responsibilities:**
    *   Handles the creation and lifecycle of `Projects`.
    *   Manages `Role Selection` for the user within a project.
    *   Generates the team of `AI Personas` and establishes the organizational hierarchy based on the user's selected role.
    *   Stores and manages project state, including goals, status, and team composition.
    *   Maintains the `Daily Conversation & Activity Log`.
    *   **Fulfills Requirements 1, 2, 3, and 6.**

### 2.5. Agent Management Service

*   **Responsibilities:**
    *   Defines and manages the pool of available AI `AgentPersonas`.
    *   Contains the logic for persona-specific behaviors, communication styles, and decision-making.
    *   Triggers AI-initiated actions based on instructions from the Scheduler.
    *   **Fulfills Requirement 3.**

### 2.6. Conversation Service

*   **Responsibilities:**
    *   Manages the real-time flow of conversations.
    *   Handles both user-initiated and AI-initiated communication sessions.
    *   Broadcasts messages to relevant participants in a conversation.
    *   **Fulfills Requirement 5.**

### 2.7. RAG Service (Project Memory Core)

*   **Responsibilities:**
    *   Provides a persistent, project-scoped memory.
    *   **Indexing:** Continuously receives and indexes all project-related data: conversation transcripts, tasks, user actions, goals, and relationship dynamics.
    *   **Retrieval:** Before any AI action, this service is queried to provide the necessary historical context. The query retrieves the most relevant documents from the project's knowledge base.
    *   Uses a hybrid data storage approach:
        *   **Vector Database (e.g., Pinecone, ChromaDB):** For semantic search over conversation content.
        *   **Relational Database (e.g., PostgreSQL):** For storing structured data like tasks, project metadata, and conversation logs.
    *   **Fulfills Requirement 4.**

### 2.8. Scheduler & Background Worker

*   **Responsibilities:**
    *   Manages and executes asynchronous, AI-initiated events.
    *   Periodically evaluates project state to determine if an AI should initiate contact (e.g., a manager checking on a task).
    *   Triggers the `Agent Management Service` to perform actions, like starting a conversation or assigning a task.
    *   This enables proactive, bi-directional communication.
    *   **Fulfills Requirement 5 (AI-Initiated Communication).**

### 2.9. LLM Integration Layer

*   **Responsibilities:**
    *   Abstracts the communication with various third-party Large Language Models (LLMs).
    *   Contains the logic for formatting prompts and parsing responses from different providers (Gemini, OpenAI, etc.).
    *   Implements the fallback logic to ensure resilience.

### 2.10. Data Persistence

*   **Responsibilities:**
    *   **PostgreSQL (or similar SQL DB):** Stores structured, relational data: user accounts, project definitions, team structures, task lists, and conversation metadata.
    *   **Vector Database:** Stores text embeddings for all conversational content, enabling efficient semantic search for the RAG service.

## 3. Data Flow Example: AI-Initiated Conversation

This flow demonstrates how the system achieves realistic, context-aware workplace dynamics.

1.  **Trigger:** The **Scheduler** determines it's time for a 'Senior Manager' AI to check on the user's progress. The trigger is based on time (e.g., daily check-in) and project state (e.g., a task is nearing its deadline).
2.  **Context Retrieval:** The Scheduler instructs the **Agent Management Service** to prepare for the interaction. The Agent Manager's first step is to query the **RAG Service**.
    *   **Query:** "What is the full history of my (Senior Manager's) interactions with the 'Junior Software Engineer' regarding 'Task-123'?"
    *   The **RAG Service** searches its Vector DB and PostgreSQL store for the project and retrieves:
        *   The initial task assignment conversation.
        *   All subsequent status updates from the user.
        *   Related peer conversations.
        *   The project's current goals and deadlines.
3.  **Prompt Generation:** The **Agent Management Service** uses the retrieved context to construct a detailed system prompt for the LLM. This prompt instructs the AI to act as the 'Senior Manager', be aware of the entire history, and ask a relevant, context-aware question.
4.  **LLM Call:** The prompt is sent to the **LLM Integration Layer**, which forwards it to the appropriate LLM (e.g., Gemini).
5.  **Response Generation:** The LLM generates a realistic response, such as: "Hi [User Name], just checking in on the 'Task-123' deployment. I see from our last chat you were working on the final tests. How is that progressing against the deadline?"
6.  **Conversation Initiation:** The **Agent Management Service** sends this message to the **Conversation Service**, which initiates a new conversation with the user.
7.  **Indexing:** The entire interaction, including the AI's initiated message, is sent to the **RAG Service** to be indexed, ensuring it becomes part of the project's permanent memory for all future interactions.