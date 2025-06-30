#!/usr/bin/env python3
"""
Setup script for the Workplace Simulation Platform
"""

from setuptools import setup, find_packages
import os

# Read the README file
def read_readme():
    with open("README.md", "r", encoding="utf-8") as fh:
        return fh.read()

# Read requirements
def read_requirements():
    with open("requirements.txt", "r", encoding="utf-8") as fh:
        return [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="workplace-simulation-platform",
    version="2.0.0",
    author="Workplace Simulation Team",
    author_email="team@worksimulation.com",
    description="AI-powered workplace simulation platform with persistent memory and realistic interactions",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/your-org/workplace-simulation-platform",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Education",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Education",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Communications :: Chat",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    python_requires=">=3.8",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "pytest-cov>=4.1.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.5.0",
            "pre-commit>=3.3.0",
        ],
        "production": [
            "gunicorn>=21.2.0",
            "uvloop>=0.17.0",
            "psycopg2-binary>=2.9.9",
            "redis>=5.0.1",
            "celery>=5.3.4",
        ],
        "ai": [
            "openai>=1.3.7",
            "anthropic>=0.7.8",
            "langchain>=0.0.350",
            "langchain-openai>=0.0.2",
            "langchain-anthropic>=0.0.1",
            "sentence-transformers>=2.2.2",
            "faiss-cpu>=1.7.4",
        ],
    },
    entry_points={
        "console_scripts": [
            "workplace-sim=main:main",
            "workplace-setup=scripts.setup:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.json", "*.yaml", "*.yml", "*.md", "*.txt"],
    },
    keywords=[
        "workplace",
        "simulation",
        "ai",
        "conversation",
        "training",
        "education",
        "rag",
        "memory",
        "agents",
        "chat",
        "team",
        "project",
        "management",
    ],
    project_urls={
        "Bug Reports": "https://github.com/your-org/workplace-simulation-platform/issues",
        "Source": "https://github.com/your-org/workplace-simulation-platform",
        "Documentation": "https://github.com/your-org/workplace-simulation-platform/docs",
    },
)
