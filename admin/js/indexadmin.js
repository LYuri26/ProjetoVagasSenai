// admin/js/slideshow.js
let uploadedItems = [];
let currentIndex = 0;
let displayTimes = {}; // Para armazenar os tempos de exibição das imagens
let transitionTime = 1; // Tempo de transição padrão
let isVideoPlaying = false; // Estado para verificar se um vídeo está sendo reproduzido
let isAutoPlayEnabled = true; // Estado para verificar se a reprodução automática está ativada
let shouldUnmuteAll = false; // Estado global para desmutar todos os vídeos

// Função para iniciar o slideshow
function startSlideshow(items) {
    uploadedItems = items; // Atualiza os itens para o slideshow
    if (uploadedItems.length === 0) return; // Não faz nada se não houver itens
    currentIndex = 0; // Reinicia o índice
    showItem(currentIndex); // Exibe o primeiro item
}

// Função para mostrar um item específico no displayArea
function showItem(index) {
    const item = uploadedItems[index];
    const displayArea = document.getElementById('display-area');
    displayArea.innerHTML = ""; // Limpa o display atual

    // Obtém o tempo de exibição
    const displayTime = item.display_time || 1; // Pega o tempo do item ou 5 segundos como padrão

    // Limpa qualquer classe anterior
    displayArea.classList.remove('fade-in', 'fade-out');

    // Se é uma imagem
    if (item.type === "image") {
        const img = document.createElement("img");
        img.src = "./uploads/photos/" + item.file;
        img.alt = "Imagem carregada";
        img.style.width = "100%"; // Ajusta para o tamanho da tela
        img.style.height = "auto";
        displayArea.appendChild(img);

        // Inicia a transição com fade-out
        displayArea.classList.add('fade-out');

        // Espera o tempo de transição antes de aplicar o fade-in
        setTimeout(() => {
            // Limpa a classe fade-out e adiciona fade-in
            displayArea.classList.remove('fade-out');
            displayArea.classList.add('fade-in');
        }, transitionTime * 1000); // Aplica o fade-in após o tempo de transição

        // Transição para a próxima imagem após o tempo total (tempo de exibição + transição)
        setTimeout(() => {
            displayArea.classList.remove('fade-in'); // Remove o fade-in para próxima transição
            currentIndex = (currentIndex + 1) % uploadedItems.length; // Ciclo entre os índices
            showItem(currentIndex);
        }, (displayTime + transitionTime) * 1000); // Tempo total para o próximo item

    // Se é um vídeo
    } else if (item.type === "video") {
        isVideoPlaying = true; // Define que um vídeo está sendo reproduzido
        const video = document.createElement("video");
        video.src = "./uploads/videos/" + item.file;
        video.autoplay = true; // Inicia automaticamente
        video.muted = !shouldUnmuteAll; // Define se deve ser mutado com base no estado global
        video.style.width = "100%"; // Ajusta para o tamanho da tela
        video.style.height = "auto";
        video.controls = true; // Habilita os controles do vídeo
        displayArea.appendChild(video);

        // Limpa qualquer classe anterior
        displayArea.classList.remove('fade-in', 'fade-out'); // Garante que não haja animações

        // Tenta iniciar a reprodução
        video.play().catch(error => {
            console.error("Erro ao tentar iniciar a reprodução do vídeo:", error);
            isVideoPlaying = false; // Reseta o estado se falhar
        });

        // Evento para detectar se o usuário desmutou o vídeo
        video.onvolumechange = () => {
            if (video.muted === false) {
                // Se o vídeo não estiver mutado, significa que o usuário desmutou
                console.log("Vídeo desmutado pelo usuário.");
                shouldUnmuteAll = true; // Define que devemos desmutar todos os vídeos
                unmuteAllVideos(); // Chama a função para desmutar todos os vídeos
            }
        };

        // Espera até que o vídeo termine para passar para o próximo
        video.onended = () => {
            isVideoPlaying = false; // Define que o vídeo foi encerrado
            currentIndex = (currentIndex + 1) % uploadedItems.length; // Ciclo entre os índices
            showItem(currentIndex);
        };
    }
}

// Função para desmutar todos os vídeos
function unmuteAllVideos() {
    const videos = document.querySelectorAll('video'); // Seleciona todos os vídeos na página
    videos.forEach(video => {
        video.muted = false; // Desmuta cada vídeo
    });
}   