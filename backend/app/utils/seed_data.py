from sqlalchemy.orm import Session
from datetime import datetime
from app.models.user import User, Profile
from app.models.project import Project
from app.models.idea import Idea
from app.models.analysis import AIAnalysis
from app.models.resource import Resource, SavedResource
from app.models.insight import AIInsight
from app.models.roadmap import ProjectRoadmap, RoadmapTask
from app.models.chat import MentorReview
from app.utils.security import get_password_hash
from app.services.ai_service import ai_service
import asyncio

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).filter(User.email == "innovator@student.edu").first():
        return

    print("[SEED] Seeding InnoSphere database with realistic demo projects and personas...")

    # 1. Create Users
    student = User(
        email="innovator@student.edu",
        hashed_password=get_password_hash("password123"),
        full_name="Aarav Sharma",
        role="student",
        is_active=True
    )
    db.add(student)
    db.flush()

    student_profile = Profile(
        user_id=student.id,
        institution="National Institute of Technology",
        course="B.Tech Computer Science & Engineering",
        department="School of Computing & AI",
        skills=["Python", "FastAPI", "PyTorch", "React", "TypeScript", "PostgreSQL"],
        interests=["Applied Deep Learning", "Edge Computing", "Healthcare IoT", "GreenTech"],
        innovation_domains=["Healthcare", "Agriculture", "Smart Cities", "Environment", "Education"],
        bio="Final-year student innovator passionate about building AI-driven solutions for social impact."
    )
    db.add(student_profile)

    mentor = User(
        email="mentor@university.edu",
        hashed_password=get_password_hash("password123"),
        full_name="Dr. Radhika Sen",
        role="mentor",
        is_active=True
    )
    db.add(mentor)
    db.flush()

    mentor_profile = Profile(
        user_id=mentor.id,
        institution="Center for Advanced Innovation & Research",
        course="Faculty Mentor & Research Director",
        department="Department of Artificial Intelligence",
        skills=["Machine Learning", "System Architecture", "Patent Filing", "Research Grants"],
        interests=["Edge AI", "Federated Learning", "Bioinformatics", "Smart Grids"],
        innovation_domains=["Healthcare", "Robotics", "AI", "Agriculture"],
        bio="Senior research faculty guiding student startups from hackathon prototypes to venture-backed pilots."
    )
    db.add(mentor_profile)

    admin = User(
        email="admin@innosphere.ai",
        hashed_password=get_password_hash("admin123"),
        full_name="Platform Administrator",
        role="admin",
        is_active=True
    )
    db.add(admin)
    db.flush()

    # 2. Seed Five Complete Production-Grade Sample Projects
    sample_projects_data = [
        {
            "title": "AI-Based Smart Community Health Monitoring and Early Warning System",
            "domain": "Healthcare",
            "status": "prototype",
            "progress": 65,
            "tags": ["AI", "HealthTech", "IoT", "Early Warning", "Epidemiology", "Water Quality"],
            "problem": "Rural communities and primary health centers lack real-time surveillance tools to detect water-borne pathogen outbreaks and early respiratory infection clusters before widespread community contamination occurs.",
            "solution": "An integrated AI early-warning platform combining edge IoT water turbidity/pH/microbiological sensor telemetry with a spatio-temporal GNN epidemiology model to forecast pathogen outbreak risks 72 hours in advance and alert district health officers.",
            "target_users": "Rural primary health centers, community health workers, district medical officers, and municipal water authorities.",
            "known_tech": ["Python", "FastAPI", "PyTorch", "React"],
            "interested_tech": ["Graph Neural Networks", "TimescaleDB", "LoRaWAN", "WebSockets", "Docker"],
            "impact": "Provides 72-hour advance early warning for cholera and water-borne enteric outbreaks, reducing clinical emergency admissions by 65% in pilot rural districts.",
            "feasibility": 88,
            "innovation": 94
        },
        {
            "title": "Smart Agriculture Prediction System",
            "domain": "Agriculture",
            "status": "development",
            "progress": 45,
            "tags": ["Computer Vision", "AgriTech", "IoT", "LoRaWAN", "Edge AI"],
            "problem": "Smallholder farmers lose 30-40% of crop yields to late-stage fungal diseases and pest infestations because traditional manual inspection is slow and costly.",
            "solution": "A multi-modal crop health diagnosis system combining smartphone camera leaf disease classification using YOLOv8 with ESP32 soil moisture/pH sensor telemetry to provide hyper-localized irrigation and fertilizer recommendations.",
            "target_users": "Smallholder farmers, agricultural extension workers, and agronomy researchers.",
            "known_tech": ["Python", "OpenCV", "React"],
            "interested_tech": ["YOLOv8", "ESP32", "LoRaWAN", "GeoPandas"],
            "impact": "Increases crop yield by up to 25% while decreasing unnecessary pesticide usage by 35%.",
            "feasibility": 90,
            "innovation": 89
        },
        {
            "title": "AI-Powered Waste Management & Segregation",
            "domain": "Environment",
            "status": "planning",
            "progress": 30,
            "tags": ["Robotics", "Computer Vision", "Sustainability", "Edge TPU"],
            "problem": "Municipal recycling facilities struggle with manual sorting errors, leading to 60% of recyclable plastics and hazardous e-waste ending up in municipal landfills.",
            "solution": "An automated optical waste sorting mechanism combining edge camera vision (Mask R-CNN on Raspberry Pi 5 + Google Coral TPU) with pneumatic diverters to sort recyclable, organic, and hazardous items at 45 items/minute.",
            "target_users": "Municipal waste plants, smart campuses, and circular economy enterprises.",
            "known_tech": ["Python", "TensorFlow"],
            "interested_tech": ["Coral TPU", "Mask R-CNN", "ROS2", "Next.js"],
            "impact": "Diverts 75% of recyclable waste from landfills and reduces manual hazardous handling risks.",
            "feasibility": 82,
            "innovation": 93
        },
        {
            "title": "Intelligent Traffic Management & Signal Optimization",
            "domain": "Smart Cities",
            "status": "research",
            "progress": 20,
            "tags": ["Reinforcement Learning", "Simulation", "SUMO", "Smart Cities"],
            "problem": "Static timer-based traffic lights cause extensive gridlock, fuel wastage, and emergency vehicle delays in dense urban corridors.",
            "solution": "A Reinforcement Learning (PPO) adaptive traffic control engine integrated with SUMO simulation that optimizes intersection signal phase durations dynamically from real-time CCTV vehicle counts.",
            "target_users": "City traffic police departments, urban mobility planners, and transit authorities.",
            "known_tech": ["Python", "NumPy"],
            "interested_tech": ["SUMO", "Deep Reinforcement Learning", "Kafka", "FastAPI"],
            "impact": "Reduces urban intersection waiting times by 28% and cuts commuter carbon emissions.",
            "feasibility": 85,
            "innovation": 91
        },
        {
            "title": "Student Skill Recommendation & Career Gap Analyzer",
            "domain": "Education",
            "status": "completed",
            "progress": 100,
            "tags": ["NLP", "Knowledge Graph", "CareerTech", "Semantic Search"],
            "problem": "College students struggle to identify specific curriculum gaps between academic syllabi and current industry job descriptions, causing suboptimal internship placement rates.",
            "solution": "A semantic graph knowledge engine using Sentence-Transformers and ESCO taxonomy that parses student project portfolios, compares them with live tech job postings, and generates personalized milestone roadmaps.",
            "target_users": "Undergraduate students, university placement cells, and career counselors.",
            "known_tech": ["Python", "FastAPI", "React", "PostgreSQL"],
            "interested_tech": ["Neo4j", "Sentence-Transformers", "FastAPI", "Tailwind CSS"],
            "impact": "Helped 500+ student pilot users bridge technology skill gaps and achieve a 40% improvement in technical interview pass rates.",
            "feasibility": 95,
            "innovation": 87
        }
    ]

    for p_data in sample_projects_data:
        # Create Project
        proj = Project(
            title=p_data["title"],
            problem_statement=p_data["problem"],
            proposed_solution=p_data["solution"],
            domain=p_data["domain"],
            technologies=p_data["known_tech"] + p_data["interested_tech"],
            status=p_data["status"],
            progress=p_data["progress"],
            tags=p_data["tags"],
            user_id=student.id
        )
        db.add(proj)
        db.flush()

        # Create Idea
        idea = Idea(
            title=p_data["title"],
            problem_description=p_data["problem"],
            proposed_solution=p_data["solution"],
            domain=p_data["domain"],
            target_users=p_data["target_users"],
            technologies_known=p_data["known_tech"],
            technologies_interested=p_data["interested_tech"],
            expected_impact=p_data["impact"],
            available_resources="College lab GPU cluster and development kits.",
            project_stage="Prototype" if p_data["progress"] >= 50 else "Concept",
            user_id=student.id,
            project_id=proj.id
        )
        db.add(idea)
        db.flush()

        # Create AI Analysis
        analysis_data = ai_service._build_deterministic_analysis(
            title=p_data["title"],
            problem=p_data["problem"],
            solution=p_data["solution"],
            domain=p_data["domain"],
            known_techs=p_data["known_tech"],
            interested_techs=p_data["interested_tech"],
            impact=p_data["impact"],
            target_users=p_data["target_users"]
        )
        ai_analysis = AIAnalysis(
            idea_id=idea.id,
            summary=analysis_data["summary"],
            problem_identified=analysis_data["problem_identified"],
            target_users=analysis_data["target_users"],
            required_technologies=analysis_data["required_technologies"],
            required_resources=analysis_data["required_resources"],
            innovation_opportunities=analysis_data["innovation_opportunities"],
            potential_challenges=analysis_data["potential_challenges"],
            ai_suggestions=analysis_data["ai_suggestions"],
            feasibility_score=p_data["feasibility"],
            innovation_score=p_data["innovation"],
            market_potential_score=85,
            complexity_level="Intermediate"
        )
        db.add(ai_analysis)

        # Create AI Insights
        async def make_insight():
            return await ai_service.generate_insights({"title": p_data["title"], "domain": p_data["domain"]})
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        try:
            insights_res = loop.run_until_complete(make_insight())
        except Exception:
            insights_res = loop.run_until_complete(ai_service.generate_insights({"title": p_data["title"], "domain": p_data["domain"]}))

        ai_insight = AIInsight(
            project_id=proj.id,
            key_insights=insights_res["key_insights"],
            technology_trends=insights_res["technology_trends"],
            research_trends=insights_res["research_trends"],
            innovation_gaps=insights_res["innovation_gaps"],
            opportunity_areas=insights_res["opportunity_areas"],
            similar_solutions=insights_res["similar_solutions"]
        )
        db.add(ai_insight)

        # Create 10-Phase Roadmap
        try:
            roadmap_tasks_data = loop.run_until_complete(ai_service.generate_roadmap({"title": p_data["title"], "domain": p_data["domain"]}))
        except Exception:
            roadmap_tasks_data = loop.run_until_complete(ai_service.generate_roadmap({"title": p_data["title"], "domain": p_data["domain"]}))

        roadmap = ProjectRoadmap(
            project_id=proj.id,
            title=f"10-Phase Innovation Roadmap: {p_data['title']}",
            total_phases=10,
            completion_percentage=p_data["progress"]
        )
        db.add(roadmap)
        db.flush()

        completed_tasks_target = int((len(roadmap_tasks_data) * p_data["progress"]) / 100)
        for idx, task_data in enumerate(roadmap_tasks_data):
            t = RoadmapTask(
                roadmap_id=roadmap.id,
                phase_number=task_data["phase_number"],
                phase_name=task_data["phase_name"],
                title=task_data["title"],
                description=task_data["description"],
                is_completed=(idx < completed_tasks_target),
                deadline=task_data["deadline"],
                notes="Verified benchmark validation complete." if idx < completed_tasks_target else "",
                order_idx=task_data["order_idx"],
                priority=task_data["priority"],
                resources_suggested=task_data["resources_suggested"]
            )
            db.add(t)

        # Create Mentor Review
        mentor_review = MentorReview(
            project_id=proj.id,
            mentor_id=mentor.id,
            feedback=f"Excellent progress on {p_data['title']}. The problem framing is sharply aligned with community requirements. Ensure you perform ablation experiments on your neural network layers before final defense.",
            rating=5 if p_data["progress"] > 50 else 4,
            strengths=["Clear social impact", "Strong choice of technology stack", "Modular architectural separation"],
            areas_for_improvement=["Add automated integration test coverage", "Include edge device battery consumption benchmarks"],
            recommended_technologies=p_data["interested_tech"],
            status="Reviewed"
        )
        db.add(mentor_review)

        # 3. Seed Hardware Devices & Sensors
        from app.api.hardware import _provision_default_hardware_for_project
        _provision_default_hardware_for_project(proj, db)

    db.commit()
    print("[SUCCESS] Seed data populated successfully with 5 projects, AI analyses, roadmaps, mentor feedback, and Hardware Lab devices!")
