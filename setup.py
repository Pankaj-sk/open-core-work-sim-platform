from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("core/requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="work-sim-platform",
    version="1.0.0",
    author="Work Sim Platform Team",
    description="AI-powered work simulation platform with FastAPI backend and React frontend",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/your-username/work-sim-platform",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Framework :: FastAPI",
    ],
    python_requires=">=3.11",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.5.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "work-sim-platform=main:main",
        ],
    },
    include_package_data=True,
    package_data={
        "core": ["**/*.json", "**/*.yaml", "**/*.yml"],
    },
)
