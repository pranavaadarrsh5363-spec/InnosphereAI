from typing import List, Dict, Any, Optional
from app.integrations.base import BaseConnector

class MockAdapter(BaseConnector):
    """
    Curated resource adapter containing real-world datasets, official APIs,
    production-grade open-source tools, and academic benchmark frameworks.
    """

    def __init__(self):
        super().__init__(name="CuratedIndex", source_type="multi_source")
        self.curated_resources = [
            # Healthcare & Medical AI
            {
                "title": "MIMIC-IV Clinical Database & Telemetry Records",
                "description": "De-identified comprehensive electronic health records containing vital signs, lab measurements, medications, and diagnostic notes for clinical AI modeling.",
                "resource_type": "dataset",
                "source": "PhysioNet / MIT",
                "url": "https://physionet.org/content/mimiciv/",
                "authors": ["MIT Laboratory for Computational Physiology"],
                "technologies": ["PostgreSQL", "Pandas", "Python", "BioBERT"],
                "domain": "Healthcare",
                "published_date": "2024-11-10",
                "difficulty": "Advanced",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"records": "40,000+ patients", "license": "PhysioNet Credentialed"}
            },
            {
                "title": "FastAPI Production Medical Telemetry Service Architecture",
                "description": "High-performance asynchronous REST API backend blueprint with WebSockets for real-time patient vital sign streaming and alert dispatch.",
                "resource_type": "github_repo",
                "source": "GitHub",
                "url": "https://github.com/tiangolo/fastapi",
                "authors": ["Sebastián Ramírez", "FastAPI Core Team"],
                "technologies": ["FastAPI", "Python", "WebSockets", "Pydantic"],
                "domain": "Healthcare",
                "published_date": "2025-02-18",
                "difficulty": "Intermediate",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"stars": 78000, "license": "MIT"}
            },
            {
                "title": "Deep Learning for Real-Time Cardiac Arrhythmia Detection from ECG",
                "description": "Peer-reviewed methodology for 1D-CNN and Transformer architectures detecting atrial fibrillation and anomalies from wearable ECG sensors.",
                "resource_type": "research_paper",
                "source": "arXiv",
                "url": "https://arxiv.org/abs/2301.04153",
                "authors": ["A. Hannun", "P. Rajpurkar", "A. Ng"],
                "technologies": ["PyTorch", "Signal Processing", "Transformers"],
                "domain": "Healthcare",
                "published_date": "2024-08-15",
                "difficulty": "Advanced",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"citations": 1240, "accuracy": "97.4%"}
            },
            # Agriculture & Smart Farming
            {
                "title": "PlantVillage Crop Disease and Pest Image Dataset",
                "description": "Standard benchmark dataset containing 54,303 labeled leaf images across 38 crop disease classes for computer vision disease identification.",
                "resource_type": "dataset",
                "source": "Kaggle",
                "url": "https://www.kaggle.com/datasets/emmarex/plantdisease",
                "authors": ["Penn State University", "David Hughes"],
                "technologies": ["OpenCV", "TensorFlow", "PyTorch", "YOLOv8"],
                "domain": "Agriculture",
                "published_date": "2024-05-12",
                "difficulty": "Intermediate",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"classes": 38, "images": 54303}
            },
            {
                "title": "OpenWeatherMap Agro API & Soil Moisture Data",
                "description": "Dedicated weather and satellite imagery API delivering historical NDVI indices, solar radiation, soil temperature, and precipitation forecasts.",
                "resource_type": "api",
                "source": "OpenWeather",
                "url": "https://openweathermap.org/api/agro",
                "authors": ["OpenWeather Ltd"],
                "technologies": ["REST API", "JSON", "GIS", "Python"],
                "domain": "Agriculture",
                "published_date": "2025-01-20",
                "difficulty": "Beginner",
                "is_open_source": False,
                "is_free": True,
                "metadata_json": {"free_tier": "1000 calls/day", "format": "GeoJSON"}
            },
            # Smart Cities & Traffic Management
            {
                "title": "YOLOv10 / Ultralytics Real-Time Vehicle and Pedestrian Tracking",
                "description": "State-of-the-art end-to-end real-time object detection framework without NMS post-processing, ideal for edge CCTV traffic analysis.",
                "resource_type": "ai_model",
                "source": "HuggingFace",
                "url": "https://huggingface.co/jameslahm/yolov10x",
                "authors": ["Tsinghua University", "Ultralytics"],
                "technologies": ["PyTorch", "ONNX", "OpenCV", "CUDA"],
                "domain": "Smart Cities",
                "published_date": "2024-12-05",
                "difficulty": "Intermediate",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"latency": "4.2ms", "mAP": 54.4}
            },
            {
                "title": "OpenStreetMap & Overpass API for Urban Traffic Graph Modeling",
                "description": "Global crowd-sourced spatial database with programmatic querying for road hierarchies, intersection nodes, signal data, and routing graphs.",
                "resource_type": "api",
                "source": "OpenStreetMap Foundation",
                "url": "https://wiki.openstreetmap.org/wiki/Overpass_API",
                "authors": ["OSM Contributors"],
                "technologies": ["NetworkX", "OSMnx", "GeoPandas", "Python"],
                "domain": "Smart Cities",
                "published_date": "2025-03-01",
                "difficulty": "Intermediate",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"coverage": "Global", "license": "ODbL"}
            },
            # Waste Management & Sustainability
            {
                "title": "TACO: Trash Annotations in Context Dataset",
                "description": "High-resolution open image dataset of waste in varied environments (urban, coastal, forest) with detailed segmentation masks.",
                "resource_type": "dataset",
                "source": "TACO Project",
                "url": "http://tacodataset.org/",
                "authors": ["Pedro F. Proença", "Pedro Simões"],
                "technologies": ["Mask R-CNN", "COCO format", "Roboflow"],
                "domain": "Environment",
                "published_date": "2024-09-18",
                "difficulty": "Intermediate",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"categories": 60, "annotations": 15000}
            },
            # Education & Skill Recommendation
            {
                "title": "ESCO: European Skills, Competences, Qualifications and Occupations Taxonomy",
                "description": "Hierarchical multilingual knowledge graph mapping 13,890 skills and 3,008 occupations for precision career matching and gap analysis.",
                "resource_type": "dataset",
                "source": "European Commission",
                "url": "https://esco.ec.europa.eu/en",
                "authors": ["European Commission Directorate-General for Employment"],
                "technologies": ["Graph Databases", "RDF/OWL", "Neo4j", "Python"],
                "domain": "Education",
                "published_date": "2025-01-15",
                "difficulty": "Intermediate",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"skills_count": 13890, "format": "CSV/RDF"}
            },
            {
                "title": "Sentence-Transformers: Multilingual Semantic Embeddings",
                "description": "Framework for state-of-the-art sentence, text, and code embeddings using BERT/RoBERTa for resume-job similarity matching.",
                "resource_type": "tool",
                "source": "UKPLab / GitHub",
                "url": "https://github.com/UKPLab/sentence-transformers",
                "authors": ["Nils Reimers", "Iryna Gurevych"],
                "technologies": ["PyTorch", "HuggingFace", "FAISS", "Scikit-Learn"],
                "domain": "Education",
                "published_date": "2025-02-10",
                "difficulty": "Beginner",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"stars": 16000, "license": "Apache 2.0"}
            },
            # General AI / Tools / Frameworks
            {
                "title": "LangChain & LangGraph Multi-Agent Workflow Framework",
                "description": "Production framework for building stateful, multi-agent AI applications with tool calling, human-in-the-loop validation, and memory persistence.",
                "resource_type": "tool",
                "source": "GitHub",
                "url": "https://github.com/langchain-ai/langchain",
                "authors": ["Harrison Chase", "LangChain Team"],
                "technologies": ["Python", "TypeScript", "LLMs", "VectorDB"],
                "domain": "Artificial Intelligence",
                "published_date": "2025-03-10",
                "difficulty": "Intermediate",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"stars": 95000, "license": "MIT"}
            },
            {
                "title": "PostgreSQL with pgvector for Vector Similarity Search",
                "description": "Open-source vector similarity search extension for PostgreSQL storing embeddings directly alongside relational metadata.",
                "resource_type": "documentation",
                "source": "pgvector GitHub",
                "url": "https://github.com/pgvector/pgvector",
                "authors": ["Andrew Kane"],
                "technologies": ["PostgreSQL", "C", "HNSW", "Cosine Similarity"],
                "domain": "Artificial Intelligence",
                "published_date": "2025-02-28",
                "difficulty": "Intermediate",
                "is_open_source": True,
                "is_free": True,
                "metadata_json": {"stars": 15000, "license": "PostgreSQL License"}
            }
        ]

    async def search(self, query: str, limit: int = 10, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        query_tokens = [t.lower() for t in query.split() if len(t) > 2]
        matched = []
        
        for res in self.curated_resources:
            score = 0
            text_blob = f"{res['title']} {res['description']} {res['domain']} {' '.join(res['technologies'])}".lower()
            
            if domain and domain.lower() in res['domain'].lower():
                score += 30
                
            for token in query_tokens:
                if token in text_blob:
                    score += 15

            if score > 0 or not query:
                item = res.copy()
                item["_curated_match_score"] = score
                matched.append(item)
                
        # Sort by relevance
        matched.sort(key=lambda x: x.get("_curated_match_score", 0), reverse=True)
        return matched[:limit]
