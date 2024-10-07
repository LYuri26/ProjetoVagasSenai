document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("drop-zone"),
          fileInput = document.getElementById("file-input"),
          feedbackMessage = document.getElementById("feedback-message"),
          filePreviewList = document.getElementById("file-preview-list"),
          uploadedList = document.getElementById("uploaded-list"),
          uploadButton = document.getElementById("upload-btn"),
          progressContainer = document.getElementById("progress-container"),
          progressBar = document.getElementById("progress-bar");

    let selectedFiles = [], uploadedItems = [];
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

    const updateUploadedList = () => {
        fetch("./php/list_uploads.php")
            .then(response => response.text())
            .then(data => {
                try {
                    uploadedItems = JSON.parse(data);
                    uploadedList.innerHTML = "";
                    uploadedItems.forEach(item => {
                        const itemDiv = document.createElement("div");
                        itemDiv.classList.add("item", "mb-2");
                        if (item.type === "image") {
                            const img = document.createElement("img");
                            img.src = `./uploads/photos/${item.file}`;
                            img.style.width = "50px"; itemDiv.appendChild(img);
                        } else if (item.type === "video") {
                            const video = document.createElement("video");
                            video.src = `./uploads/videos/${item.file}`;
                            video.style.width = "50px"; video.controls = true;
                            video.onclick = () => { video.muted = false; video.play(); };
                            itemDiv.appendChild(video);
                        }
                        if (item.type === "image") {
                            const timeInputWrapper = document.createElement("div");
                            timeInputWrapper.innerHTML = `<input type="number" class="form-control me-2" value="${item.display_time || 0}" placeholder="Tempo"><span class="text-muted ms-1">segundos</span>`;
                            const saveBtn = document.createElement("button");
                            saveBtn.textContent = "Salvar"; saveBtn.classList.add("btn", "btn-success", "ms-2");
                            saveBtn.onclick = () => updateTime(item.id, timeInputWrapper.querySelector('input').value);
                            itemDiv.appendChild(timeInputWrapper);
                            itemDiv.appendChild(saveBtn);
                        }
                        const deleteBtn = document.createElement("button");
                        deleteBtn.textContent = "X"; deleteBtn.classList.add("delete-btn", "btn", "btn-danger", "ms-2");
                        deleteBtn.onclick = () => deleteItem(item.id);
                        itemDiv.appendChild(deleteBtn);
                        uploadedList.appendChild(itemDiv);
                    });
                    if (uploadedItems.length > 0) startSlideshow(uploadedItems);
                } catch (error) {
                    console.error("Erro ao processar a resposta JSON:", error);
                    showFeedback("Erro ao processar a resposta.", "danger");
                }
            }).catch(() => showFeedback("Erro ao atualizar a lista.", "danger"));
    };

    const uploadFiles = () => {
        if (selectedFiles.length === 0) return showFeedback("Nenhum arquivo selecionado!", "danger");
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append("files[]", file));

        progressContainer.classList.remove("d-none"); progressBar.style.width = "0%";
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "./php/upload.php");
        xhr.upload.addEventListener("progress", e => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = `${percentComplete}%`;
                progressBar.setAttribute("aria-valuenow", percentComplete);
                progressBar.textContent = `${Math.round(percentComplete)}%`;
            }
        });
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (data.success) {
                        showFeedback("Upload realizado com sucesso!", "success");
                        updateUploadedList(); filePreviewList.innerHTML = ""; selectedFiles = [];
                    } else {
                        showFeedback(`Falha no upload: ${data.message}`, "danger");
                    }
                } catch (error) {
                    console.error("Erro ao processar a resposta:", error);
                    showFeedback("Erro ao processar a resposta.", "danger");
                }
            } else {
                showFeedback("Erro ao enviar o upload", "danger");
            }
            progressContainer.classList.add("d-none");
        };
        xhr.send(formData);
    };

    const updateTime = (itemId, newTime) => {
        fetch("./php/update_time.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: itemId, display_time: newTime })
        }).then(response => response.json()).then(data => {
            if (data.success) {
                showFeedback("Tempo salvo com sucesso!", "success");
                updateUploadedList();
            } else {
                showFeedback(`Erro ao salvar o tempo: ${data.message}`, "danger");
            }
        }).catch(() => showFeedback("Erro ao salvar o tempo", "danger"));
    };

    const deleteItem = id => {
        fetch("./php/delete_item.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        }).then(response => response.json()).then(data => {
            if (data.success) {
                showFeedback("Item deletado com sucesso!", "success");
                updateUploadedList();
            } else {
                showFeedback(`Erro ao deletar o item: ${data.message}`, "danger");
            }
        }).catch(() => showFeedback("Erro ao deletar o item", "danger"));
    };

    const handleFiles = files => {
        files.forEach(file => {
            if (file.size > MAX_FILE_SIZE) return showFeedback(`O arquivo "${file.name}" excede o limite de 30 MB!`, "danger");
            selectedFiles.push(file);
            const fileItem = document.createElement("div");
            fileItem.classList.add("file-item", "mb-2");
            fileItem.textContent = file.name;
            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Cancelar"; cancelBtn.classList.add("btn", "btn-danger", "ms-2");
            cancelBtn.onclick = () => {
                fileItem.remove(); selectedFiles = selectedFiles.filter(f => f !== file);
            };
            fileItem.appendChild(cancelBtn);
            filePreviewList.appendChild(fileItem);
        });
    };

    const showFeedback = (message, type) => {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `alert alert-${type}`;
        feedbackMessage.classList.remove("d-none");
        setTimeout(() => feedbackMessage.classList.add("d-none"), 4000);
    };

    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragging"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
    dropZone.addEventListener("drop", e => { e.preventDefault(); dropZone.classList.remove("dragging"); handleFiles(Array.from(e.dataTransfer.files)); });
    fileInput.addEventListener("change", e => handleFiles(Array.from(e.target.files)));

    uploadButton.addEventListener("click", uploadFiles);

    updateUploadedList();
});
