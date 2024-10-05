async function validateVideo(event) {
    event.preventDefault();  // Evita que el formulario recargue la página

    const form = document.getElementById('AddVideo');

    const videoInput = document.getElementById('videoinput');  // Obtiene el campo de video
    const video = videoInput.files[0];  // Obtiene el primer archivo de video

    //Validations 

    const videoFormat = video.type;  //Format
    if (videoFormat !== 'video/mp4') {
        alert('Please select a .mp4 file');
        return false;
      }

    const videoSizeInMB = video.size / (1024 * 1024); //Max 10 MB
    if (videoSizeInMB > 10) {
        alert('File exceeds the maximum file size of 10 MB');
        return false;
    }

    const title = document.forms['addVideo']['titleNewVideo'].value; //Title
    if ( title == ""){
        document.getElementById('titleVideo').innerHTML = "Title cannot be empty*";
        return false;
    }


    

    const formData = new FormData();
    formData.append('video', video);  // Agrega el archivo de video a formData

    try {
        const response = await fetch('http://127.0.0.1:8000/upload_video', {  // Asegúrate de que la URL del servidor sea correcta
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        console.log(result);  // Maneja la respuesta del servidor

        if (response.ok) {
            alert("Video subido exitosamente.");
        } else {
            alert("Error al subir el video.");
        }

    } catch (error) {
        alert('Error al subir el archivo:', error);
    }
}
