from fastapi import FastAPI, HTTPException
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
from models import VideoResponse, CommentCreate, CommentResponse
from sqlalchemy import or_
from datetime import datetime


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

@app.post("/upload_file")
async def upload_file(
    thumbnail: UploadFile = File(...), 
    video: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    db: Session = Depends(get_db)
):
    # Carpeta donde se almacenarán los archivos subidos
    UPLOAD_FOLDER_VIDEOS = './videos'
    UPLOAD_FOLDER_THUMBNAILS = './thumbnails'
    
    # Crear las carpetas si no existen
    os.makedirs(UPLOAD_FOLDER_VIDEOS, exist_ok=True)
    os.makedirs(UPLOAD_FOLDER_THUMBNAILS, exist_ok=True)

    # Definir la ubicación de los archivos
    thumbnail_location = os.path.join(UPLOAD_FOLDER_THUMBNAILS, thumbnail.filename)
    video_location = os.path.join(UPLOAD_FOLDER_VIDEOS, video.filename)

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
        # Busca coincidencias en el título o en la descripción
        query = query.filter(
            or_(
                Video.title.ilike(f"%{title}%"),  # Búsqueda insensible a mayúsculas en el título
                Video.description.ilike(f"%{title}%")  # Búsqueda insensible a mayúsculas en la descripción
            )
        )
    
    videos = query.all()  # Ejecuta la consulta y obtiene todos los resultados
    return videos

# Endpoint para obtener los 10 videos más vistos
@app.get("/videos/top10")
def get_top_videos(db: Session = Depends(get_db)):
    # Obtener los 10 videos más vistos en orden descendente
    top_videos = db.query(Video).order_by(Video.viewsCount.desc()).limit(10).all()
    
    # Retornar los videos en el formato deseado
    return top_videos

@app.get("/videos/top10/favorites")
def get_top_favorite_videos(db: Session = Depends(get_db)):
    # Obtener los 10 videos más recientes añadidos a favoritos en orden descendente
    top_favorite_videos = (
        db.query(FavoriteVideos)
        .order_by(FavoriteVideos.favoriteDate.desc())
        .limit(10)
        .all()
    )
    
    # Obtener los IDs de los videos favoritos
    video_ids = [fav.videoID for fav in top_favorite_videos]
    
    # Obtener la información completa de los videos basados en los IDs
    videos = db.query(Video).filter(Video.id.in_(video_ids)).all()
    
    # Retornar los videos en el formato deseado
    return videos


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
    

@app.get("/videosId/{id}", response_model=VideoResponse)
def get_video_by_id(id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == id).first()    
    return video


@app.put("/favorites/{video_id}")
async def add_to_favorites(video_id: int, db: Session = Depends(get_db)):
    # Crea una nueva instancia de FavoriteVideos
    favorite_video = FavoriteVideos(videoID=video_id, favoriteDate=date.today())

    # Añade el nuevo favorito a la sesión
    db.add(favorite_video)
    db.commit()
    db.refresh(favorite_video)  # Para obtener el objeto actualizado con su ID

    return {"message": "Video agregado a favoritos", "favorite_id": favorite_video.id}



@app.delete("/favorites/{video_id}", response_model=dict)
def delete_favorite_video(video_id: int, db: Session = Depends(get_db)):
    # Busca el video en la tabla de favoritos
    favorite_video = db.query(FavoriteVideos).filter(FavoriteVideos.videoID == video_id).first()
    
    if not favorite_video:
        raise HTTPException(status_code=404, detail="Video no encontrado en favoritos")
    
    try:
        # Elimina el video de los favoritos
        db.delete(favorite_video)
        db.commit()
    except Exception as e:
        db.rollback()  # Deshacer cambios en caso de error
        raise HTTPException(status_code=500, detail="Error al eliminar el video") from e
    
    return {"detail": "Video eliminado de favoritos"}

@app.post("/addComment/{video_id}")
async def add_comment(video_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    # Crea una nueva instancia de Comments
    new_comment = Comments(
        videoID=video_id,
        comment=comment.comment,
        creationDate=datetime.now()  # O la fecha actual si es necesario
    )

    # Añade el nuevo comentario a la sesión
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)  # Para obtener el objeto actualizado con su ID

    return {"message": "Comentario agregado exitosamente", "comment_id": new_comment.id}

@app.get("/comments/{video_id}", response_model=List[CommentResponse])
def get_comments(video_id: int, db: Session = Depends(get_db)):
    # Consulta para obtener los comentarios del video
    comments = db.query(Comments).filter(Comments.videoID == video_id).order_by(Comments.creationDate.desc()).all()
    
    if not comments:
        raise HTTPException(status_code=404, detail="No hay comentarios para este video")
    
    return comments

@app.put("/videos/{video_id}/increment_views")
async def increment_views(video_id: int, db: Session = Depends(get_db)):
    # Buscar el video por su ID
    video = db.query(Video).filter(Video.id == video_id).first()

    # Si no se encuentra el video, lanzar una excepción
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")

    # Incrementar el contador de vistas
    video.viewsCount += 1

    # Guardar los cambios en la base de datos
    db.commit()

    return {"message": "Reproducción incrementada", "viewsCount": video.viewsCount}
