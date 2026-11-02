<?php
// Contact form handler for PHP hosting (e.g. Hostinger). Emails via Resend.
// Requires config.php (not in git) defining RESEND_API_KEY and optionally CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL.
header('Content-Type: application/json');

function out($code, $arr) { http_response_code($code); echo json_encode($arr); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['error' => 'Method not allowed']);
if (file_exists(__DIR__ . '/config.php')) require __DIR__ . '/config.php';
if (!defined('RESEND_API_KEY')) define('RESEND_API_KEY', '');

$d = json_decode(file_get_contents('php://input'), true);
if (!is_array($d)) out(400, ['error' => 'Invalid request']);
$f = function ($k) use ($d) { return trim((string)($d[$k] ?? '')); };
$name = $f('name'); $email = $f('email'); $message = $f('message');
$company = $f('company'); $service = $f('service');
if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($message) > 10000) {
    out(400, ['error' => 'Missing or invalid fields']);
}

$e = function ($s) { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); };
$html = '<p><b>Name:</b> ' . $e($name) . '<br><b>Company:</b> ' . $e($company)
      . '<br><b>Email:</b> ' . $e($email) . '<br><b>Service:</b> ' . $e($service) . '</p><p>'
      . nl2br($e($message)) . '</p>';

$payload = json_encode([
    'from' => defined('CONTACT_FROM_EMAIL') ? CONTACT_FROM_EMAIL : 'Kingfisher & Kite <noreply@kingfisherandkite.com>',
    'to' => [defined('CONTACT_TO_EMAIL') ? CONTACT_TO_EMAIL : 'matthewuycoque@gmail.com'],
    'reply_to' => $email,
    'subject' => 'Website inquiry: ' . ($service ?: 'General') . ' - ' . $name,
    'html' => $html,
]);

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . RESEND_API_KEY, 'Content-Type: application/json'],
]);
curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status >= 200 && $status < 300) out(200, ['ok' => true]);

// Fallback while the Resend domain is unverified: PHP mail() from the site's own domain.
$to = defined('CONTACT_TO_EMAIL') ? CONTACT_TO_EMAIL : 'matthewuycoque@gmail.com';
$clean = function ($s) { return str_replace(["\r", "\n"], ' ', $s); };
$headers = "From: Kingfisher & Kite <noreply@kingfisherandkite.com>\r\nReply-To: " . $clean($email)
         . "\r\nContent-Type: text/plain; charset=UTF-8";
$text = "Name: $name\nCompany: $company\nEmail: $email\nService: $service\n\n$message";
if (@mail($to, '=?UTF-8?B?' . base64_encode('Website inquiry: ' . ($service ?: 'General') . ' - ' . $clean($name)) . '?=', $text, $headers)) {
    out(200, ['ok' => true]);
}
out(502, ['error' => 'Could not send']);
