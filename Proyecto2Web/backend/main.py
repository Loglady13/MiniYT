from fastapi import FastAPI
from sqlalchemy.orm import sessionmaker
from database import engine, get_db  # Cambia a importación absoluta
from models import Base, Item

# Crear la aplicación FastAPI
app = FastAPI()

# Crear la tabla en la base de datos
Base.metadata.create_all(bind=engine)

# Rutas de la API
@app.get("/")
def read_root():
    return {"Hello": "World"}
