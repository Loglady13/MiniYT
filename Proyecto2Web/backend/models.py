from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Video(Base):
    __tablename__ = 'videos'
    
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    creationDate = Column(Date, nullable=False)
    description = Column(String(300), nullable=True)
    videoPath = Column(String, nullable=False)
    thumbnail = Column(String, nullable=True)
    viewsCount = Column(Integer, default=0)
    isFavorite = Column(Integer, ForeignKey('favoriteVideos.id'))
    comments = Column(Integer, ForeignKey('comments.id'))

class FavoriteVideos(Base):
    __tablename__ = 'favoriteVideos'
    
    id = Column(Integer, primary_key=True)
    videoID = Column(Integer, ForeignKey('videos.id'))
    favoriteDate = Column(Date, nullable=False)

class Comments(Base):
    __tablename__ = 'comments'
    
    id = Column(Integer, primary_key=True)
    videoID = Column(Integer, ForeignKey('videos.id'))
    comment = Column(String, nullable=False)
    creationDate = Column(Date, nullable=False)
