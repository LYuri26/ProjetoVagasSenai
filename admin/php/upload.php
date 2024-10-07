<?php
// Exibe erros para facilitar a depuração
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Definindo os diretórios de upload
$uploadDirImages = '../uploads/photos/';
$uploadDirVideos = '../uploads/videos/';
$jsonPath = '../config.json';

// Definindo o tipo de conteúdo como JSON
header('Content-Type: application/json');

// Verifica se os diretórios existem, se não, cria-os
if (!is_dir($uploadDirImages)) {
    mkdir($uploadDirImages, 0777, true);
}
if (!is_dir($uploadDirVideos)) {
    mkdir($uploadDirVideos, 0777, true);
}

// Verifica se o arquivo JSON existe, se não, cria um arquivo vazio
if (!file_exists($jsonPath)) {
    file_put_contents($jsonPath, json_encode([], JSON_PRETTY_PRINT));
}

// Verifica se os arquivos foram enviados
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['files'])) {
    $files = $_FILES['files'];
    $response = ['success' => true, 'message' => 'Upload realizado com sucesso!'];
    $newItems = []; // Array para armazenar novos itens

    // Carrega os dados existentes do arquivo JSON
    $jsonData = json_decode(file_get_contents($jsonPath), true);
    
    // Inicializa o próximo ID
    $nextId = 1;
    
    // Se houver itens, encontra o maior ID existente
    if (!empty($jsonData)) {
        $existingIds = array_column($jsonData, 'id'); // Supondo que cada item tenha uma chave 'id'
        $nextId = max($existingIds) + 1; // Incrementa o maior ID para o próximo
    }

    // Loop para processar os arquivos enviados
    for ($i = 0; $i < count($files['name']); $i++) {
        $fileName = basename($files['name'][$i]);
        $fileTmp = $files['tmp_name'][$i];
        $fileType = mime_content_type($fileTmp);

        // Verifica se é imagem ou vídeo
        if (strpos($fileType, 'image') !== false) {
            $uploadPath = $uploadDirImages . $fileName;
            $type = 'image';
        } elseif (strpos($fileType, 'video') !== false) {
            $uploadPath = $uploadDirVideos . $fileName;
            $type = 'video';
        } else {
            // Tipo de arquivo inválido
            $response['success'] = false;
            $response['message'] = 'Tipo de arquivo inválido: ' . $fileType;
            echo json_encode($response);
            exit;
        }

        // Faz o upload do arquivo
        if (move_uploaded_file($fileTmp, $uploadPath)) {
            // Adiciona o novo item ao array
            $newItems[] = [
                'id' => $nextId,
                'file' => $fileName,
                'type' => $type,
            ];
            $nextId++; // Incrementa o próximo ID
        } else {
            // Falha ao mover o arquivo
            $response['success'] = false;
            $response['message'] = 'Falha ao mover o arquivo: ' . $fileName;
            echo json_encode($response);
            exit;
        }
    }

    // Se houver novos itens, adiciona ao JSON e grava
    if (!empty($newItems)) {
        $jsonData = array_merge($jsonData, $newItems); // Junta os novos itens aos existentes
        file_put_contents($jsonPath, json_encode($jsonData, JSON_PRETTY_PRINT));
    }

    // Resposta de sucesso
    echo json_encode($response);
    exit; // Evita qualquer saída adicional
} else {
    // Nenhum arquivo enviado
    $response = ['success' => false, 'message' => 'Nenhum arquivo enviado'];
    echo json_encode($response);
    exit; // Evita qualquer saída adicional
}
?>
