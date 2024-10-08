from fastapi import FastAPI
from fastapi import Depends, File, UploadFile, Form
from sqlalchemy.orm import sessionmaker
from database import engine, get_db 
from sqlalchemy.orm import Session
from models import Base, Video, FavoriteVideos, Comments
from fastapi.responses import JSONResponse
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from datetime import date
from typing import List
from models import VideoResponse

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
@app.post("/upload_file")
async def upload_file(
    thumbnail: UploadFile = File(...), 
    video: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    db: Session = Depends(get_db)
):
    # Carpeta donde se almacenarán los archivos subidos
    UPLOAD_FOLDER = './files'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Definir la ubicación de los archivos
    thumbnail_location = os.path.join('backend/files', thumbnail.filename)
    video_location = os.path.join('backend/files', video.filename)

    try:
        # Guardar el archivo thumbnail
        with open(thumbnail_location, "wb") as f:
            shutil.copyfileobj(thumbnail.file, f)

        # Guardar el archivo video
        with open(video_location, "wb") as f:
            shutil.copyfileobj(video.file, f)

        # Llamar a la función para guardar los datos en la base de datos
        success = saveVideoDatabase(db, title, description, thumbnail_location, video_location)

        if success:
            return JSONResponse(
                content={
                    "status": "success",
                    "thumbnail_path": thumbnail_location,
                    "video_path": video_location
                },
                status_code=200
            )
        else:
            return JSONResponse(
                content={"status": "error", "detail": "Error al guardar el video en la base de datos"},
                status_code=500
            )
    except Exception as e:
        # Manejar cualquier error que ocurra durante la subida de archivos
        return JSONResponse(
            content={"status": "error", "detail": str(e)},
            status_code=500
        )
    
@app.get("/videos/", response_model=List[VideoResponse])
def get_videos(title: str = None, db: Session = Depends(get_db)):
    query = db.query(Video)

    if title:
        query = query.filter(Video.title.ilike(f"%{title}%"))  # Búsqueda insensible a mayúsculas
    
    videos = query.all()  # Ejecuta la consulta y obtiene todos los resultados
    return videos

# Endpoint para obtener los 10 videos más vistos
@app.get("/videos/top10")
def get_top_videos(db: Session = Depends(get_db)):
    # Obtener los 10 videos más vistos en orden descendente
    top_videos = db.query(Video).order_by(Video.viewsCount.desc()).limit(10).all()
    
    # Retornar los videos en el formato deseado
    return top_videos


def saveVideoDatabase(db: Session, title: str, description: str, pathThumbnail: str, pathVideo: str):
    try:
        # Crear un nuevo objeto Video
        new_video = Video(
            title=title,
            creationDate=date.today(),
            description=description,
            videoPath=pathVideo,
            thumbnail=pathThumbnail,
            viewsCount=0,  # Asignar un valor inicial a viewsCount
            isFavorite=None  # Asegúrate de manejar esto correctamente (relación FK)
        )
        
        # Insertar el nuevo video en la base de datos
        db.add(new_video)
        db.commit()  # Guardar los cambios en la base de datos
        db.refresh(new_video)  # Actualizar el objeto con los datos insertados

        return True  # Devolver True si la operación fue exitosa
    except Exception as e:
        db.rollback()  # Revertir la transacción en caso de error
        print(f"Error al insertar el video: {str(e)}")
        return False  # Devolver False si hubo un error

