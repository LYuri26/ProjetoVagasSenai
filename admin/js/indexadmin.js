document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const feedbackMessage = document.getElementById("feedback-message");
  const filePreviewList = document.getElementById("file-preview-list");
  const uploadedList = document.getElementById("uploaded-list");
  const uploadButton = document.getElementById("upload-btn");
  const transitionIntervalInput = document.getElementById("transition-interval");

  // Variáveis de estado
  let selectedFiles = [];
  let uploadedItems = [];
  let currentIndex = 0;
  let intervalId = null;

  // Função para iniciar o slideshow
  function startSlideshow() {
      if (uploadedItems.length === 0) return; // Não faz nada se não houver itens
      clearInterval(intervalId); // Parar qualquer slideshow anterior
      showItem(currentIndex); // Exibe o primeiro item

      // Obter intervalo do usuário
      const intervalTime = parseInt(transitionIntervalInput.value) * 1000; // Converter para milissegundos

      // Iniciar o intervalo de exibição
      intervalId = setInterval(() => {
          currentIndex = (currentIndex + 1) % uploadedItems.length; // Ciclo entre os índices
          showItem(currentIndex);
      }, intervalTime);
  }

  // Função para mostrar um item específico no displayArea
  function showItem(index) {
      const item = uploadedItems[index];
      const displayArea = document.getElementById('display-area');
      displayArea.innerHTML = ""; // Limpa o display atual

      if (item.type === "image") {
          const img = document.createElement("img");
          img.src = "./uploads/photos/" + item.file;
          img.alt = "Imagem carregada";
          img.style.width = "100%"; // Ajusta para o tamanho da tela
          img.style.height = "auto";
          displayArea.appendChild(img);
      } else if (item.type === "video") {
          const video = document.createElement("video");
          video.src = "./uploads/videos/" + item.file;
          video.controls = true;
          video.style.width = "100%"; // Ajusta para o tamanho da tela
          video.style.height = "auto";
          displayArea.appendChild(video);
      }
  }

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
                      itemDiv.appendChild(img);
                  } else if (item.type === "video") {
                      const video = document.createElement("video");
                      video.src = "./uploads/videos/" + item.file;
                      video.controls = true;
                      itemDiv.appendChild(video);
                  }

                  // Campo para alterar o tempo de exibição
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

                  // Botão de deletar
                  const deleteBtn = document.createElement("button");
                  deleteBtn.textContent = "X";
                  deleteBtn.classList.add("delete-btn", "btn", "btn-danger", "ms-2");
                  deleteBtn.onclick = () => deleteItem(item.id);
                  itemDiv.appendChild(deleteBtn);

                  uploadedList.appendChild(itemDiv);
              });

              startSlideshow(); // Inicia o slideshow após a atualização da lista
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

      // Envio do AJAX
      fetch("./php/upload.php", {
          method: "POST",
          body: formData,
      })
      .then((response) => response.json())
      .then((data) => {
          if (data.success) {
              showFeedback("Upload realizado com sucesso!", "success");
              updateUploadedList(); // Atualiza a lista de arquivos
              filePreviewList.innerHTML = ""; // Limpa a lista de pré-visualização
              selectedFiles = []; // Limpa os arquivos selecionados
          } else {
              showFeedback("Falha no upload: " + data.message, "danger");
          }
      })
      .catch((error) => {
          console.error("Erro ao enviar o upload:", error);
          showFeedback("Erro ao enviar o upload", "danger");
      });
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
      handleFiles(e.dataTransfer.files);
  });

  // Função para manipular os arquivos selecionados manualmente
  fileInput.addEventListener("change", () => {
      handleFiles(fileInput.files);
  });

  // Função para processar e exibir arquivos selecionados
  function handleFiles(files) {
      selectedFiles = [...files]; // Armazena os arquivos selecionados
      filePreviewList.innerHTML = ""; // Limpa a pré-visualização anterior

      // Exibe pré-visualização dos arquivos
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileDiv = document.createElement("div");
          fileDiv.classList.add("item", "mb-2");

          const fileName = document.createElement("p");
          fileName.textContent = `Arquivo: ${file.name}`;
          fileDiv.appendChild(fileName);

          filePreviewList.appendChild(fileDiv);
      }
  }

  // Salvar tempo de transição
  document.getElementById('save-transition-btn').addEventListener('click', function() {
      const transitionTime = transitionIntervalInput.value;

      fetch('./php/save_transition.php', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transitionTime: transitionTime })
      })
      .then(response => response.json())
      .then(data => {
          showFeedback('Tempo de transição salvo com sucesso!', 'success');
      })
      .catch(error => {
          showFeedback('Erro ao salvar o tempo de transição.', 'danger');
          console.error('Error:', error);
      });
  });

  // Atualiza a lista de uploads ao carregar a página
  updateUploadedList();
});
