from fastapi import FastAPI
from sqlalchemy.orm import sessionmaker
from database import engine, get_db 
from models import Base, Item
from fastapi.responses import JSONResponse
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil

# Crear la aplicación FastAPI
app = FastAPI()


origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes restringir esto a tu dominio frontend específico
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos HTTP
    allow_headers=["*"],
)

# Crear la tabla en la base de datos
Base.metadata.create_all(bind=engine)

# Rutas de la API

@app.post("/upload_video")
async def upload_video(video: UploadFile = File(...)):
    # Carpeta donde se almacenarán los archivos subidos
    UPLOAD_FOLDER = './files'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Definir la ubicación del archivo de video
    video_location = os.path.join(UPLOAD_FOLDER, video.filename)
    
    try:
        # Guardar el archivo de video
        with open(video_location, "wb") as f:
            shutil.copyfileobj(video.file, f)
        
        # Devolver una respuesta exitosa con la información del video
        return JSONResponse(
            content={
                "status": "success",
                "video_path": video_location
            },
            status_code=200
        )
    except Exception as e:
        # Manejar cualquier error que ocurra durante la subida de archivos
        return JSONResponse(
            content={"status": "error", "detail": str(e)},
            status_code=500
        )


