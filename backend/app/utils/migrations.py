import logging
from sqlalchemy import text, inspect
from app.database import engine, Base
from app.config import settings

logger = logging.getLogger("inno_sphere.migrations")

def run_db_migrations():
    """
    Applies non-destructive schema migrations for vector search, research, and experimentation engine.
    Preserves all existing data while ensuring required columns, extensions,
    and indexes are present.
    """
    logger.info("Checking database schema migrations...")
    # First ensure all tables exist
    Base.metadata.create_all(bind=engine)

    try:
        with engine.connect() as conn:
            # 1. If on PostgreSQL, attempt to create pgvector extension
            if not settings.DATABASE_URL.startswith("sqlite"):
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                    conn.commit()
                    logger.info("PostgreSQL pgvector extension verified.")
                except Exception as ext_err:
                    logger.warning(f"Could not enable pgvector extension (falling back to JSON storage): {ext_err}")

            inspector = inspect(engine)
            
            # 2. Check columns on 'resources' table
            if "resources" in inspector.get_table_names():
                columns = [c["name"] for c in inspector.get_columns("resources")]
                columns_to_add = [
                    ("doi", "VARCHAR"),
                    ("external_id", "VARCHAR"),
                    ("quality_score", "FLOAT DEFAULT 75.0"),
                    ("embedding", "TEXT" if settings.DATABASE_URL.startswith("sqlite") else "JSONB"),
                    ("embedding_model", "VARCHAR"),
                    ("embedding_version", "VARCHAR DEFAULT 'v1'"),
                    ("embedding_created_at", "TIMESTAMP"),
                    ("embedding_text_hash", "VARCHAR"),
                    ("embedding_status", "VARCHAR DEFAULT 'pending'")
                ]

                for col_name, col_type in columns_to_add:
                    if col_name not in columns:
                        try:
                            logger.info(f"Adding column '{col_name}' to 'resources' table...")
                            conn.execute(text(f"ALTER TABLE resources ADD COLUMN {col_name} {col_type};"))
                            conn.commit()
                        except Exception as col_err:
                            logger.warning(f"Note on adding column '{col_name}': {col_err}")

            # 3. Check columns on 'research_documents' table
            if "research_documents" in inspector.get_table_names():
                doc_columns = [c["name"] for c in inspector.get_columns("research_documents")]
                doc_cols_to_add = [
                    ("content_markdown", "TEXT DEFAULT ''"),
                    ("content_latex", "TEXT DEFAULT ''"),
                    ("doc_type", "VARCHAR DEFAULT 'research_paper'"),
                    ("quality_summary", "TEXT" if settings.DATABASE_URL.startswith("sqlite") else "JSONB"),
                    ("citation_coverage_pct", "FLOAT DEFAULT 0.0"),
                    ("content_hash", "VARCHAR"),
                    ("generated_at", "TIMESTAMP"),
                ]
                for col_name, col_type in doc_cols_to_add:
                    if col_name not in doc_columns:
                        try:
                            logger.info(f"Adding column '{col_name}' to 'research_documents' table...")
                            conn.execute(text(f"ALTER TABLE research_documents ADD COLUMN {col_name} {col_type};"))
                            conn.commit()
                        except Exception as col_err:
                            logger.warning(f"Note on adding column '{col_name}': {col_err}")

            # 4. Check columns on 'research_document_versions' table
            if "research_document_versions" in inspector.get_table_names():
                ver_columns = [c["name"] for c in inspector.get_columns("research_document_versions")]
                if "content_hash" not in ver_columns:
                    try:
                        logger.info("Adding column 'content_hash' to 'research_document_versions' table...")
                        conn.execute(text("ALTER TABLE research_document_versions ADD COLUMN content_hash VARCHAR;"))
                        conn.commit()
                    except Exception as col_err:
                        logger.warning(f"Note on adding column 'content_hash': {col_err}")

            # 5. Check columns on 'project_experiments' table
            if "project_experiments" in inspector.get_table_names():
                exp_columns = [c["name"] for c in inspector.get_columns("project_experiments")]
                exp_cols_to_add = [
                    ("research_gap_id", "INTEGER"),
                    ("independent_variables", "TEXT" if settings.DATABASE_URL.startswith("sqlite") else "JSONB"),
                    ("dependent_variables", "TEXT" if settings.DATABASE_URL.startswith("sqlite") else "JSONB"),
                    ("controlled_variables", "TEXT" if settings.DATABASE_URL.startswith("sqlite") else "JSONB"),
                    ("dataset_version", "VARCHAR DEFAULT 'v1.0'"),
                    ("dataset_source", "VARCHAR DEFAULT 'Kaggle / OpenData'"),
                    ("preprocessing_notes", "TEXT"),
                    ("model_algorithm", "VARCHAR"),
                    ("hardware_environment", "VARCHAR DEFAULT 'ESP32 Microcontroller + Host GPU'"),
                    ("software_environment", "VARCHAR DEFAULT 'Python 3.11, PyTorch 2.2, FastAPI'"),
                    ("hyperparameters", "TEXT" if settings.DATABASE_URL.startswith("sqlite") else "JSONB"),
                    ("random_seed", "INTEGER DEFAULT 42"),
                    ("evaluation_metrics", "TEXT" if settings.DATABASE_URL.startswith("sqlite") else "JSONB"),
                    ("expected_outcome", "TEXT"),
                    ("actual_outcome", "TEXT"),
                    ("is_simulated", "BOOLEAN DEFAULT 0"),
                    ("hardware_device_id", "INTEGER"),
                    ("reproducibility_score", "FLOAT DEFAULT 0.0"),
                    ("reproducibility_checklist", "TEXT" if settings.DATABASE_URL.startswith("sqlite") else "JSONB"),
                    ("started_at", "TIMESTAMP")
                ]

                for col_name, col_type in exp_cols_to_add:
                    if col_name not in exp_columns:
                        try:
                            logger.info(f"Adding column '{col_name}' to 'project_experiments' table...")
                            conn.execute(text(f"ALTER TABLE project_experiments ADD COLUMN {col_name} {col_type};"))
                            conn.commit()
                        except Exception as col_err:
                            logger.warning(f"Note on adding column '{col_name}' to 'project_experiments': {col_err}")

            logger.info("Database schema migration completed successfully.")
    except Exception as e:
        logger.error(f"Migration check encountered an error (continuing startup): {e}")
