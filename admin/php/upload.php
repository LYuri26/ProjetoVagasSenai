<?php
// Exibe erros para facilitar a depuração
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Definindo os diretórios de upload
$uploadDirImages = '../uploads/photos/';
$uploadDirVideos = '../uploads/videos/';
$jsonPath = '../config.json';

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
            $response['success'] = false;
            $response['message'] = 'Tipo de arquivo inválido: ' . $fileType;
            echo json_encode($response);
            exit;
        }

        // Faz o upload do arquivo
        if (move_uploaded_file($fileTmp, $uploadPath)) {
            // Carrega os dados existentes do arquivo JSON
            $jsonData = json_decode(file_get_contents($jsonPath), true);
            $id = count($jsonData) + 1; // ID único simples, incrementa com base no número de itens existentes

            // Adiciona o novo item ao JSON
            $jsonData[] = [
                'id' => $id,
                'file' => $fileName,
                'type' => $type,
            ];

            // Grava no JSON
            file_put_contents($jsonPath, json_encode($jsonData, JSON_PRETTY_PRINT));
        } else {
            $response['success'] = false;
            $response['message'] = 'Falha ao mover o arquivo: ' . $fileName;
        }
    }

    echo json_encode($response);
} else {
    echo json_encode(['success' => false, 'message' => 'Nenhum arquivo enviado']);
}
exit; // Adiciona isto para evitar saída adicional
?>
