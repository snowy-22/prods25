/**
 * Account Activation Email Template
 * Sent when email verification is required
 */

export const accountActivationEmailTemplate = (userName: string, confirmLink: string, expiresIn: string = "24 saat") => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CanvasFlow - E-posta Doğrulaması</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 40px;
            color: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .verification-code {
            background: #f0f4ff;
            border: 2px solid #667eea;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #667eea;
            font-family: 'Courier New', monospace;
        }
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            margin: 20px 0;
            font-size: 16px;
            transition: transform 0.3s;
        }
        .verify-button:hover {
            transform: translateY(-2px);
        }
        .link-text {
            word-break: break-all;
            color: #667eea;
            font-size: 12px;
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
        .security-info {
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ CanvasFlow</h1>
            <p>E-posta Doğrulaması</p>
        </div>
    </div>

    <div class="content">
        <h2>Merhaba ${userName}! 👋</h2>
        
        <p>CanvasFlow hesabınızı oluşturmaya devam etmek için e-posta adresinizi doğrulamanız gerekiyor. Lütfen aşağıdaki düğmeye tıklayın:</p>

        <div style="text-align: center;">
            <a href="${confirmLink}" class="verify-button">E-postayı Doğrula ✓</a>
        </div>

        <p>Veya aşağıdaki bağlantıyı tarayıcınıza kopyalayın:</p>
        <div class="link-text">${confirmLink}</div>

        <p><strong>Bu bağlantı ${expiresIn} için geçerlidir.</strong> Lütfen beklemeden doğrulama işlemini tamamlayın.</p>

        <div class="security-info">
            <strong>🔒 Güvenlik Bilgisi:</strong> CanvasFlow asla e-posta veya mesaj aracılığıyla şifrenizi veya kişisel bilgilerinizi isteyecek değildir. Yukarıdaki bağlantı size özel ve tek kullanımlıktır.
        </div>

        <h3>Sonra Ne Olacak?</h3>
        <p>E-postanız doğrulandıktan sonra, aşağıdaki özelliklere erişebileceksiniz:</p>
        <ul style="list-style-position: inside;">
            <li>✓ Canvas oluşturma ve düzenleme</li>
            <li>✓ Widget ekleyerek çalışma alanını kişiselleştirme</li>
            <li>✓ İçerikle arkadaşlarınızla paylaşma</li>
            <li>✓ AI asistanından yardım alma</li>
            <li>✓ Toplulukla bağlantı kurma</li>
        </ul>

    </div>

    <div class="footer">
        <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıt vermeyin.</p>
        <p>CanvasFlow © 2026. Tüm hakları saklıdır.</p>
        <p><a href="https://canvasflow.example.com/help" style="color: #667eea; text-decoration: none;">Yardım Merkezi</a> | <a href="https://canvasflow.example.com/privacy" style="color: #667eea; text-decoration: none;">Gizlilik Politikası</a></p>
    </div>
</body>
</html>
`;
