# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de conexión a PostgreSQL
DATABASE_URL = "postgresql://postgres:password@localhost/postgres" #TODO Cambiar : primer postgres : por nombre de usuario en postgres. Password: Contraseña para inngresar a PGAdmin. ultimo postgres: Nombre que desea que se le ponga a la nueva bd

# Crear el motor de SQLAlchemy
engine = create_engine(DATABASE_URL)

# Crear una sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para las clases del ORM
Base = declarative_base()

# Función para obtener la sesión de la DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
