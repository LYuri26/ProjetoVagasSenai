
document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    const feedbackMessage = document.getElementById("feedback-message");
    const filePreviewList = document.getElementById("file-preview-list");
    const uploadedList = document.getElementById("uploaded-list");
    const uploadButton = document.getElementById("upload-btn");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");

    // Variáveis de estado
    let selectedFiles = [];
    let uploadedItems = [];
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB em bytes

    // Função para atualizar a lista de itens carregados
    function updateUploadedList() {
        fetch("./php/list_uploads.php") // Arquivo PHP que lista os uploads
            .then((response) => response.json())
            .then((data) => {
                uploadedItems = data; // Armazena os itens carregados
                uploadedList.innerHTML = ""; // Limpa a lista

                data.forEach((item) => {
                    const itemDiv = document.createElement("div");
                    itemDiv.classList.add("item", "mb-2");

                    // Exibição de imagem ou vídeo
                    if (item.type === "image") {
                        const img = document.createElement("img");
                        img.src = "./uploads/photos/" + item.file;
                        img.alt = "Imagem carregada";
                        img.style.width = "50px"; // Tamanho da miniatura
                        img.style.height = "auto"; // Mantém a proporção
                        itemDiv.appendChild(img);
                    } else if (item.type === "video") {
                        const video = document.createElement("video");
                        video.src = "./uploads/videos/" + item.file;
                        video.style.width = "50px"; // Tamanho da miniatura
                        video.style.height = "auto"; // Mantém a proporção
                        video.controls = true; // Permite os controles do player
                    
                        // Para iniciar a reprodução com som após um clique
                        video.onclick = () => {
                            video.muted = false; // Desmuta o vídeo
                            video.play(); // Inicia a reprodução
                        };
                    
                        // Adiciona o vídeo à lista de itens carregados
                        itemDiv.appendChild(video);
                    }
                    
                    // Campo para alterar o tempo de exibição (apenas para imagens)
                    if (item.type === "image") {
                        const timeInput = document.createElement("input");
                        timeInput.type = "number";
                        timeInput.classList.add("form-control", "d-inline");
                        timeInput.value = item.display_time || 0; // Pega o tempo já definido, ou 0
                        timeInput.placeholder = "Tempo (em segundos)";
                        itemDiv.appendChild(timeInput);

                        // Botão de salvar o tempo
                        const saveBtn = document.createElement("button");
                        saveBtn.textContent = "Salvar";
                        saveBtn.classList.add("btn", "btn-success", "ms-2");
                        saveBtn.onclick = () => updateTime(item.id, timeInput.value);
                        itemDiv.appendChild(saveBtn);
                    }

                    // Botão de deletar
                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "X";
                    deleteBtn.classList.add("delete-btn", "btn", "btn-danger", "ms-2");
                    deleteBtn.onclick = () => deleteItem(item.id);
                    itemDiv.appendChild(deleteBtn);

                    uploadedList.appendChild(itemDiv);
                });

                // Inicia o slideshow após a atualização da lista
                if (uploadedItems.length > 0) {
                    startSlideshow(uploadedItems); // Chama a função de slideshow no outro arquivo
                }
            })
            .catch((error) => console.error("Erro ao atualizar a lista:", error));
    }

    // Função para enviar arquivos via AJAX e fornecer feedback visual
    uploadButton.addEventListener("click", () => {
        if (selectedFiles.length === 0) {
            showFeedback("Nenhum arquivo selecionado para upload!", "danger");
            return;
        }

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append("files[]", file); // Adiciona todos os arquivos ao FormData
        });

        // Mostrar a barra de progresso
        progressContainer.classList.remove("d-none");
        progressBar.style.width = '0%'; // Reseta a barra de progresso
        progressBar.setAttribute('aria-valuenow', 0);
        progressBar.textContent = '0%';

        // Envio do AJAX usando XMLHttpRequest para monitorar o progresso
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "./php/upload.php");

        // Atualiza a barra de progresso
        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
                progressBar.setAttribute('aria-valuenow', percentComplete);
                progressBar.textContent = Math.round(percentComplete) + '%'; // Mostra a porcentagem
            }
        });

        // Quando a requisição for completada
        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    showFeedback("Upload realizado com sucesso!", "success");
                    updateUploadedList(); // Atualiza a lista de arquivos
                    filePreviewList.innerHTML = ""; // Limpa a lista de pré-visualização
                    selectedFiles = []; // Limpa os arquivos selecionados
                } else {
                    showFeedback("Falha no upload: " + data.message, "danger");
                }
            } else {
                showFeedback("Erro ao enviar o upload", "danger");
            }
            progressContainer.classList.add("d-none"); // Esconde a barra de progresso após o upload
        };

        // Envia a requisição
        xhr.send(formData);
    });

    // Função para exibir feedback ao usuário
    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `alert alert-${type}`;
        feedbackMessage.classList.remove("d-none");
        setTimeout(() => {
            feedbackMessage.classList.add("d-none");
        }, 4000); // Esconde a mensagem após 4 segundos
    }

    // Função para atualizar o tempo de exibição de um item
    function updateTime(itemId, newTime) {
        fetch("./php/update_time.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: itemId, display_time: newTime }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                showFeedback("Tempo de exibição atualizado com sucesso!", "success");
                updateUploadedList(); // Atualiza a lista
            } else {
                showFeedback("Erro ao atualizar o tempo: " + data.message, "danger");
            }
        })
        .catch((error) => {
            console.error("Erro ao atualizar o tempo:", error);
            showFeedback("Erro ao atualizar o tempo", "danger");
        });
    }

    // Função para deletar um item
    function deleteItem(id) {
        fetch("./php/delete_item.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: id }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                showFeedback("Item deletado com sucesso!", "success");
                updateUploadedList(); // Atualiza a lista
            } else {
                showFeedback("Erro ao deletar o item: " + data.message, "danger");
            }
        })
        .catch((error) => {
            console.error("Erro ao deletar o item:", error);
            showFeedback("Erro ao deletar o item", "danger");
        });
    }

    // Funções de Drag-and-Drop
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragging");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragging");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragging");
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    fileInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });

    // Função para lidar com arquivos selecionados
// Função para lidar com arquivos selecionados
function handleFiles(files) {
    files.forEach((file) => {
        // Verifica se o arquivo é maior que o limite permitido
        if (file.size > MAX_FILE_SIZE) {
            showFeedback(`O arquivo "${file.name}" excede o limite de 30 MB!`, "danger");
            return; // Para evitar adicionar o arquivo à lista
        }

        // Se o arquivo for válido, adiciona à lista selecionada
        selectedFiles.push(file);

        // Cria um item de div para o arquivo válido
        const fileItem = document.createElement("div");
        fileItem.classList.add("file-item", "mb-2");
        fileItem.textContent = file.name;

        // Cria o botão de cancelar
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancelar";
        cancelBtn.classList.add("btn", "btn-danger", "ms-2");

        // Ação ao clicar no botão de cancelar
        cancelBtn.onclick = () => {
            // Remove o item da lista de pré-visualização
            fileItem.remove();
            // Remove o arquivo da lista selecionada
            const index = selectedFiles.indexOf(file);
            if (index > -1) {
                selectedFiles.splice(index, 1); // Remove o arquivo da lista selecionada
            }
        };

        // Adiciona o botão ao item da lista
        fileItem.appendChild(cancelBtn);
        // Adiciona o item à lista de pré-visualização
        filePreviewList.appendChild(fileItem);
    });
}


    // Atualiza a lista de uploads ao carregar a página
    updateUploadedList();
});
