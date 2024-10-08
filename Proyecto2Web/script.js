async function validateVideo(event) {
    event.preventDefault();  // Evita que el formulario recargue la página

    // Oculta los mensajes anteriores
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    //Video 
    const videoInput = document.getElementById('videoinput');
    const video = videoInput.files[0];

    if (!video || video.type !== 'video/mp4') {
        showError('Por favor selecciona un archivo .mp4 para el video');
        return false;
    }

    const videoSizeInMB = video.size / (1024 * 1024); // Max 10 MB
    if (videoSizeInMB > 10) {
        showError('El archivo de video no debe exceder los 10 MB');
        return false;
    }

    const title = document.getElementById('titleNewVideo').value;
    if (!title) {
        showError('El título no puede estar vacío');
        return false;
    }

    const description = document.getElementById('description').value;
    if (description.length > 300) {
        showError('La descripción no debe superar los 300 caracteres');
        return false;
    }

    const thumbnailInput = document.getElementById('newThumbnail');
    const thumbnail = thumbnailInput.files[0];
    if(!thumbnail){
        showError('Por favor selecciona un archivo para el thumbnail');
        return false;
    }

    const maxSizeInBytes = 2 * 1024 * 1024;  // 2 MB en bytes

    if (thumbnail.type === 'image/jpg' || thumbnail.type === 'image/jpeg') {
        // Verificar tamaño solo si es imagen .jpg
        if (thumbnail.size > maxSizeInBytes) {
            console.error("El archivo de imagen debe pesar menos de 2MB");
            return false;
        }
    } else if (thumbnail.type !== 'video/mp4') {
        showError("Solo se aceptan archivos .jpg o .mp4");
        return false;
    }

    // Muestra el indicador de carga
    document.getElementById('loadingIndicator').style.display = 'block';

    try {
        // Subir video y thumbnail
        await saveFile(thumbnail, video);

        // Oculta el indicador de carga y muestra éxito
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';

    } catch (error) {
        showError('Error al subir el archivo. Por favor, inténtalo de nuevo.');
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

async function saveFile(thumbnail, video) {
    const formData = new FormData();
    formData.append('thumbnail', thumbnail);
    formData.append('video', video);

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
