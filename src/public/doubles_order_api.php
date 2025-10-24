<?php
if (is_dir('./vendor')) {
    require_once "./vendor/autoload.php";
} else {
    require_once "../vendor/autoload.php";
}

use Dotenv\Dotenv;
use Gemini\Data\Content;
use Gemini\Data\GenerationConfig;
use Gemini\Data\Part;
use Gemini\Data\ThinkingConfig;
use Gemini\Enums\ResponseMimeType;
use Gemini\Enums\ModelVariation;
use Gemini\Enums\Role;
use Gemini\GeminiHelper;

if (($_SERVER['SERVER_NAME'] ?? "") === 'localhost') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}
// OPTIONS メソッドの場合はここで終了
if (($_SERVER['REQUEST_METHOD'] ?? "") === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$json = null;
if ($input = file_get_contents('php://input')) {
    $json = json_decode($input, true, 512, JSON_THROW_ON_ERROR);
}
if (!$json || !$json['entries']) {
    throw new Exception('JSON形式が不正です。');
}
$entries = $json['entries'];
$jumble = $json['jumble'];
if ($jumble) {
    $entries['men'] = array_merge($entries['men'], $entries['women']);
    $entries['women'] = [];
}
$entries_json = json_encode($entries, JSON_UNESCAPED_UNICODE);
$entry_num = $entries ? count($entries['men']) + count($entries['women']) : 0;
$pair_num = floor($entry_num / 4) * 2;
$un_entry_num = $entry_num - $pair_num * 2;
$history = $json['history'] ?? [];

if (file_exists('./.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__);
} else {
    $dotenv = Dotenv::createImmutable(dirname(__DIR__));
}
$dotenv->load();
$yourApiKey = $_ENV['GEMINI_API_KEY'];
$client = Gemini::client($yourApiKey);

// Helper method usage
$model = $client->generativeModel(
    model: GeminiHelper::generateGeminiModel(
        variation: ModelVariation::FLASH,
        // variation: ModelVariation::PRO,
        generation: 2.5,
    )
)->withGenerationConfig(
    generationConfig: new GenerationConfig(
        responseMimeType: ResponseMimeType::APPLICATION_JSON,
        temperature: 0.1,
        thinkingConfig: new ThinkingConfig(
            thinkingBudget: 0,
            includeThoughts: false
        ),
    ),
);
// $contents = [
//     new Content(
//         role: Role::USER,
//         parts: [new Part(text: "あなたの現在のModelと、他にGemini APIで使えるModelを教えてください。")],
//     ),
// ];

// $result = $model->generateContent(...$contents);
// echo $result->text();
// exit;

// データ加工の指示
$texts = [
    "次に与えるデータは男性と女性の卓球選手とランクです。",
    $entries_json,
    sprintf(
        "このデータから、ペアを%d組作成してください。%d名の選手は不参加としてください。",
        $pair_num,
        $un_entry_num
    ),
    // "ペアのランク合計値は、最大のものと最小のものが4以内になるようにしてください。",
    // "ペアのランク合計値はゆるやかに減少するように最適化してください。",
    // "できれば、ペアのランク合計値に大きな差がでないようにしてください。",
];
if ($history) {

    $history_limit = array_slice($history, count($history) - 1);
    $texts = array_merge($texts, [
        "前回の出力結果を付けます。前回と違ったペアになるように作ってください。",
        json_encode($history_limit, JSON_UNESCAPED_UNICODE),
    ]);
    if (count($history) % 2 === 1) {
        $texts[] = "ペアのランク合計値は、あまり差が出ないようにしてください。";
    }

    if ($un_entry_num > 0) {
        // 前回試合できなかった人たちの救済措置
        $entry_names = [];
        foreach (array_merge($entries['men'], $entries['women']) as $m) {
            $entry_names[] = $m['name'];
        }
        $entries_history = array_fill_keys($entry_names, 0);
        foreach ($history as $pairs) {
            foreach ($pairs as $pair) {
                foreach ($pair['pair'] as $name) {
                    if (isset($entries_history[$name])) {
                        $entries_history[$name]++;
                    }
                }
            }
        }
        arsort($entries_history);
        $min_entries = array_keys($entries_history, min($entries_history));
        $help_members = [];
        if (count($min_entries) != count($entry_names)) {
            if (count($min_entries) >= $un_entry_num) {
                $help_members = $min_entries;
            } else {
                $help_members = array_slice(array_keys($entries_history), $pair_num * 2);
            }
        }
        if ($help_members) {
            $texts[] = sprintf(
                "次の人達をできる限り参加させてください。%s",
                implode(',', $help_members)
            );
            // mylog($entries_history);
            // mylog($help_members);
        }
    }
}
if (!$jumble) {
    $texts = array_merge($texts, [
        "できれば、男性と女性がペアになるようにしてください。",
        "男性あるいは女性に余りが出たら男性同士・女性同士にしてください。",
    ]);
}
$parts = [];
foreach ($texts as $text) {
    $parts[] = new Part(text: $text);
}
$contents = [
    new Content(
        role: Role::USER,
        parts: $parts,
    ),
];
// 出力形式の指示
$response_sample = <<<EOF
[
    {"pair": ['選手A', '選手B'], "total_rank": 12,},
    {"pair": ['選手C', '選手D'], "total_rank": 11,}
]
EOF;
$contents[] = new Content(
    role: Role::USER,
    parts: [
        new Part(text: "出力形式は以下のJSON配列形式にしてください。total_rankはペアのランク合計値です。"),
        new Part(text: $response_sample),
    ]
);

$result = $model->generateContent(...$contents);
echo $result->text();


function mylog($var)
{
    if ($fp = @fopen(__DIR__ . '/logs/php_log.txt', 'a+')) {
        fputs($fp, var_export($var, true));
        fclose($fp);
    }
}
