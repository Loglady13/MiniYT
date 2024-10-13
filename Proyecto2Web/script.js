document.addEventListener('DOMContentLoaded', (event) => {
    // Comprueba si el estado de éxito está en localStorage
    const uploadSuccess = localStorage.getItem('uploadSuccess');
    searchTopVideos(); // Llama a la función cuando el contenido del DOM esté completamente cargado
    searchTop10Favorites();
    fetchComments();
    if (uploadSuccess === 'true') {
        document.getElementById('successMessage').style.display = 'block';
    }
    
});

async function deleteSuccess(event){
    localStorage.setItem('uploadSuccess', 'false');
    document.getElementById('successMessage').style.display = 'none';
}

async function validateVideo(event) {
    event.preventDefault();  // Evita que el formulario recargue la página
    localStorage.setItem('uploadSuccess', 'false');
    // Oculta los mensajes anteriores
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    //Video 
    const videoInput = document.getElementById('videoinput');
    const video = videoInput.files[0];

    if (!video || video.type !== 'video/mp4') {
        showError('Por favor selecciona un archivo .mp4 para el video');
        return;
    }

    const videoSizeInMB = video.size / (1024 * 1024); // Max 10 MB
    if (videoSizeInMB > 10) {
        showError('El archivo de video no debe exceder los 10 MB');
        return;
    }

    const title = document.getElementById('titleNewVideo').value;
    if (!title) {
        showError('El título no puede estar vacío');
        return;
    }

    const description = document.getElementById('description').value;
    if (description.length > 300) {
        showError('La descripción no debe superar los 300 caracteres');
        return;
    }

    const thumbnailInput = document.getElementById('newThumbnail');
    const thumbnail = thumbnailInput.files[0];
    if (!thumbnail) {
        showError('Por favor selecciona un archivo para el thumbnail');
        return;
    }

    const maxSizeInBytes = 2 * 1024 * 1024;  // 2 MB en bytes

    if (thumbnail.type === 'image/jpg' || thumbnail.type === 'image/jpeg') {
        if (thumbnail.size > maxSizeInBytes) {
            showError("El archivo de imagen debe pesar menos de 2MB");
            return;
        }
    } else if (thumbnail.type !== 'video/mp4') {
        showError("Solo se aceptan archivos .jpg o .mp4");
        return;
    }

    
    

    let success = false;

    try {
        
        // Subir video y thumbnail
        await saveFile(thumbnail, video, title, description);
        
        success = true;  // Indica que la subida fue exitosa

        // Guarda el estado de éxito en localStorage
        localStorage.setItem('uploadSuccess', 'true');
    } catch (error) {
        showError('Error al subir el archivo. Por favor, inténtalo de nuevo.');
        document.getElementById('loadingIndicator').style.display = 'none';
        return;
    }

    // Muestra el mensaje de éxito si la subida fue exitosa
    if (success) {
        document.getElementById('successMessage').style.display = 'block';
    }
    
}


async function saveFile(thumbnail, video, title, description) {
    // Mantener el indicador de carga visible por al menos 5 segundos
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('loadingIndicator').style.display = 'block';
   

    const formData = new FormData();
    formData.append('thumbnail', thumbnail);
    formData.append('video', video);
    formData.append('title', title);
    formData.append('description', description);

    const response = await fetch('http://127.0.0.1:8000/upload_file', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Error al subir el archivo');
    }
    

}

function showError(message) {
    const errorMessageDiv = document.getElementById('errorMessage');
    errorMessageDiv.innerHTML = message;
    errorMessageDiv.style.display = 'block';
}

async function searchTopVideos() {
    try {
        // Realizar la solicitud GET al endpoint de los 10 videos más vistos
        const response = await fetch('http://127.0.0.1:8000/videos/top10');
        
        // Verificar si la solicitud fue exitosa
        if (!response.ok) {
            throw new Error('Error al obtener los videos más vistos');
        }

        // Parsear la respuesta a formato JSON
        const topVideos = await response.json();

        // Llamar a la función que muestra los videos en el HTML
        displayTopVideos(topVideos);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function searchTop10Favorites(){
    try{
        const response = await fetch('http://127.0.0.1:8000/videos/top10/favorites');

        // Verificar si la solicitud fue exitosa
        if (!response.ok) {
            throw new Error('Error al obtener los videos favoritos');
        }

        // Parsear la respuesta a formato JSON
        const topFavorites = await response.json();

        displayTopFavorites(topFavorites);
    }
    catch (error) {
        console.error('Error:', error);
    }
}

function displayTopFavorites(videos){
    const videoContainer = document.getElementById('videoFavorite');

    videoContainer.innerHTML = '';

    videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.className = 'video-item col-md-3'; // Usar columnas de Bootstrap para el diseño

        // Crear elementos HTML para cada campo del video
        videoElement.innerHTML = `
            <div class="card mb-4">
                <a href="seeVideo.html?id=${video.id}">
                    <img src="backend/${video.thumbnail}" class="card-img-top" alt="Thumbnail">
                    <div class="card-body">
                        <h5 class="card-title">${video.title}</h5>
                        <p class="card-text"><strong>Fecha de creación:</strong> ${new Date(video.creationDate).toLocaleDateString()}</p>
                        <p class="card-text"><strong>Descripción:</strong> ${video.description}</p>
                        <p class="card-text"><strong>Vistas:</strong> ${video.viewsCount}</p>
                    </div>
                </a>
            </div>
        `;

        // Añadir el video al contenedor
        videoContainer.appendChild(videoElement);
    });
}

// Función para mostrar los videos en el HTML
function displayTopVideos(videos) {
    const videoContainer = document.getElementById('videoContainer');

    // Limpiar el contenedor por si ya tiene contenido
    videoContainer.innerHTML = '';

    // Iterar sobre la lista de videos y crear elementos HTML para mostrarlos
    videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.className = 'video-item col-md-3'; // Usar columnas de Bootstrap para el diseño

        // Crear elementos HTML para cada campo del video
        videoElement.innerHTML = `
            <div class="card mb-4">
                <a href="seeVideo.html?id=${video.id}">
                    <img src="backend/${video.thumbnail}" class="card-img-top" alt="Thumbnail">
                    <div class="card-body">
                        <h5 class="card-title">${video.title}</h5>
                        <p class="card-text"><strong>Fecha de creación:</strong> ${new Date(video.creationDate).toLocaleDateString()}</p>
                        <p class="card-text"><strong>Descripción:</strong> ${video.description}</p>
                        <p class="card-text"><strong>Vistas:</strong> ${video.viewsCount}</p>
                    </div>
                </a>
            </div>
        `;

        // Añadir el video al contenedor
        videoContainer.appendChild(videoElement);
    });
}

// Función para manejar la búsqueda en el formulario
function handleSearch(event) {
    event.preventDefault();  // Evita que el formulario recargue la página
    const searchTerm = document.getElementById('searchInput').value;

    // Redirigir a videoResult.html con el término de búsqueda como parámetro de consulta
    window.location.href = `videoResult.html?title=${encodeURIComponent(searchTerm)}`;
}


async function searchVideos() {
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');  // Obtener el parámetro 'title' de la URL

    // Validar que el título exista y no sea una cadena vacía o solo espacios en blanco
    if (title && title.trim().length > 0) {
        try {
            // Realizar la solicitud a la API con el título de búsqueda
            const response = await fetch(`http://127.0.0.1:8000/videos/?title=${encodeURIComponent(title.trim())}`);
            
            if (!response.ok) {
                throw new Error('Error al obtener los videos');
            }

            const videos = await response.json();  // Obtener los videos en formato JSON
            showResults(videos);  // Mostrar los resultados en la página
            document.getElementById('searchInput').value = decodeURIComponent(title);
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('videoContainer').innerHTML = '<p>Ocurrió un error al buscar los videos.</p>';
        }
    } else {
        // Si el título no es válido, mostrar un mensaje al usuario
        document.getElementById('videoContainer').innerHTML = '<p>Por favor, ingrese un título válido para buscar videos.</p>';
    }
}    


// Función para mostrar los resultados de los videos en la página
function showResults(videos) {
    const videoContainer = document.getElementById('videoContainer');
    videoContainer.innerHTML = '';  // Limpiar el contenedor de videos

    if (videos.length === 0) {
        videoContainer.innerHTML = '<p>No se encontraron resultados.</p>';
        return;
    }

    videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.classList.add('col-md-4', 'mb-4');
        videoElement.innerHTML = `
            <div class="card">
                <a href="seeVideo.html?id=${video.id}" >
                    <img class="card-img-top" src="backend/${video.thumbnail.replace("\\", "/")}"></img>
                    <div class="card-body">
                        <h5 class="card-title">${video.title}</h5>
                        <p class="card-text">${video.description || 'No hay descripción'}</p>
                    </div>
                </a>
            </div>
        `;
        videoContainer.appendChild(videoElement);
    });
}

async function searchVideosId() {
    const params = new URLSearchParams(window.location.search);
    const title = params.get('id');  // Obtener el parámetro 'title' de la URL

    if (title) {
        try {
            // Realizar la solicitud a la API con el título de búsqueda
            const response = await fetch(`http://127.0.0.1:8000/videos/?title=${encodeURIComponent(title)}`);
            
            if (!response.ok) {
                throw new Error('Error al obtener los videos');
            }

            const videos = await response.json();  // Obtener los videos en formato JSON
            showResults(videos);  // Mostrar los resultados en la página
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('videoContainer').innerHTML = '<p>Ocurrió un error al buscar los videos.</p>';
        }
    }
}

// Función para agregar el video a favoritos
async function addToFavorites() {
    try {
        const response = await fetch(`http://127.0.0.1:8000/favorites/${videoId}`, {
            method: 'PUT', // Usamos PUT para actualizar o agregar
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoId: videoId, // Puedes enviar el ID del video
                // Añade otros datos si es necesario, como el usuario, etc.
            })
        });

        if (!response.ok) {
            throw new Error('Error al agregar el video a favoritos');
        }

        const result = await response.json(); // Obtener la respuesta del servidor
        alert('Video agregado a favoritos exitosamente');
        console.log(result); // Verificar la respuesta del servidor

    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar el video a favoritos');
    }
}

async function addComment(event) {
    event.preventDefault(); // Evitar que el formulario se envíe y recargue la página

    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('id'); // Obtener el parámetro 'id' de la URL
    const commentText = document.getElementById('commentInput').value.trim(); // Obtener el valor del comentario y eliminar espacios innecesarios

    // Validaciones del comentario
    if (!commentText) {
        showError('No puedes dejar comentarios vacíos');
        return false;
    } else if (commentText.length > 100) {
        showError('El texto no puede ser mayor a 100 caracteres');
        return false;
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:8000/addComment/${videoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoId: videoId,
                comment: commentText
            })
        });

        if (!response.ok) {
            throw new Error('Error al agregar el comentario');
        }

        const result = await response.json();
        console.log(result);

        // Limpiar el campo de entrada
        document.getElementById('commentInput').value = '';

        // Agregar el comentario nuevo a la lista sin recargar todos los comentarios
        const commentsList = document.getElementById('comments-list');
        const newCommentItem = document.createElement('li');
        newCommentItem.classList.add('comment-item');
        newCommentItem.innerHTML = `<strong>${new Date().toLocaleString()}</strong>: ${commentText}`;
        commentsList.appendChild(newCommentItem);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar el comentario. Por favor, inténtalo de nuevo.');
    }
}

async function fetchComments() {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('id');  // Obtener el parámetro 'id' de la URL

    try {
        const response = await fetch(`http://127.0.0.1:8000/comments/${videoId}`);
        if (!response.ok) {
            throw new Error('Error al obtener los comentarios');
        }

        const comments = await response.json();
        const commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = ''; // Limpiar la lista antes de añadir nuevos comentarios

        comments.forEach(comment => {
            const listItem = document.createElement('li');
            listItem.classList.add('comment-item');
            // Crear un texto con la fecha de creación y el comentario
            listItem.innerHTML = `<strong>${(comment.creationDate).toLocaleString()}</strong>: ${comment.comment}`;
            commentsList.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error al obtener los comentarios:', error);
    }
}


async function incrementVideoViews(videoId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/videos/${videoId}/increment_views`, {
            method: 'PUT',  // Utilizamos el método PUT
            headers: {
                'Content-Type': 'application/json'  // Aseguramos que sea de tipo JSON
            }
        });

        // Verificamos si la solicitud fue exitosa
        if (!response.ok) {
            throw new Error('Error al incrementar las reproducciones');
        }

        const result = await response.json();  // Obtenemos la respuesta como JSON
        console.log(result);  // Imprimimos el resultado en la consola para verificarlo

    } catch (error) {
        console.error('Error:', error);  // En caso de error, lo mostramos en la consola
    }
}
