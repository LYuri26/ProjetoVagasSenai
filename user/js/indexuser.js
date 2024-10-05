let previousData = null; // Variável para armazenar os dados anteriores

// Função para verificar se há novos dados e iniciar o slideshow
function fetchDataAndStartSlideshow() {
    fetch('../admin/config.json') // Ajuste o caminho para o arquivo JSON
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados carregados:", data); // Log dos dados carregados
            
            // Verifica se os dados foram alterados
            if (JSON.stringify(data) !== JSON.stringify(previousData)) {
                previousData = data; // Atualiza os dados anteriores
                startSlideshow(data); // Passa o novo array para o slideshow
            }
        })
        .catch(error => {
            console.error("Erro ao carregar os dados do slideshow:", error);
        });
}

// Chama a função para buscar os dados inicialmente
fetchDataAndStartSlideshow();

// Atualiza a cada 5 segundos (5000 milissegundos)
setInterval(fetchDataAndStartSlideshow, 5000);

// Função para iniciar o slideshow
function startSlideshow(slides) {
    const displayArea = document.getElementById('display-area');
    let currentIndex = 0;
    let isVideoPlaying = false; // Estado para verificar se um vídeo está sendo reproduzido
    let shouldUnmuteAll = false; // Estado para verificar se todos os vídeos devem ser desmutados

    function showItem(index) {
        const item = slides[index]; // Acesse o item diretamente do array
        displayArea.innerHTML = ""; // Limpa o display atual

        // Verifica o tipo do item (imagem ou vídeo)
        if (item.type === "image") {
            const img = document.createElement("img");
            img.src = "../../admin/uploads/photos/" + item.file; // Caminho para a imagem
            img.alt = "Imagem carregada";
            img.classList.add("fade-in"); // Adiciona a classe de fade in
            displayArea.appendChild(img);
            isVideoPlaying = false; // Reseta o estado do vídeo

            // Define um tempo padrão de exibição (em milissegundos)
            const displayTime = 3000; // Tempo de exibição da imagem
            setTimeout(() => {
                img.classList.remove("fade-in"); // Remove a classe fade in antes de aplicar fade out
                img.classList.add("fade-out"); // Adiciona a classe de fade out

                // Espera o tempo do fade out antes de mostrar a próxima imagem
                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % slides.length; // Incrementa o índice circularmente
                    showItem(currentIndex); // Chama a próxima imagem ou vídeo
                }, 1000); // Duração do fade out é de 1 segundo
            }, displayTime);
        } else if (item.type === "video") {
            const video = document.createElement("video");
            video.src = "../../admin/uploads/videos/" + item.file; // Caminho para o vídeo
            video.controls = true; // Adiciona controles ao vídeo
            video.autoplay = true; // Inicia o vídeo automaticamente
            video.muted = !shouldUnmuteAll; // Muta o vídeo, caso não deva ser desmutado
            displayArea.appendChild(video);
            isVideoPlaying = true; // Define que um vídeo está sendo reproduzido

            // Espera até que o vídeo termine para passar para o próximo
            video.onended = () => {
                isVideoPlaying = false; // Define que o vídeo foi encerrado
                currentIndex = (currentIndex + 1) % slides.length; // Ciclo entre os índices
                showItem(currentIndex); // Chama a próxima imagem ou vídeo
            };

            // Adiciona um evento de volumechange para detectar se o vídeo foi desmutado
            video.onvolumechange = () => {
                if (!video.muted) {
                    // Se o vídeo não estiver mutado, significa que o usuário desmutou
                    shouldUnmuteAll = true; // Define que devemos desmutar todos os vídeos
                    unmuteAllVideos(); // Chama a função para desmutar todos os vídeos
                }
            };

            // Adiciona um evento de pause para não mudar antes do final
            video.onpause = () => {
                isVideoPlaying = false; // Define que o vídeo foi pausado
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

    showItem(currentIndex); // Inicia o slideshow
}
