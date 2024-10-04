<?php
// Define o cabeçalho para JSON
header('Content-Type: application/json');

// Obtém os dados do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

// Verifica se o tempo de transição foi recebido
if (isset($data['transitionTime'])) {
    $transitionTime = $data['transitionTime'];

    // Salva o tempo de transição em um arquivo JSON
    $filePath = '../transition.json';
    $jsonData = json_encode(['transitionTime' => $transitionTime], JSON_PRETTY_PRINT);

    if (file_put_contents($filePath, $jsonData)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao escrever no arquivo.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Tempo de transição não definido.']);
}
?>
