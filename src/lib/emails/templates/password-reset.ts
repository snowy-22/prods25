/**
 * Password Reset Email Template
 * Sent when user requests password reset
 */

export const passwordResetEmailTemplate = (userName: string, resetLink: string, expiresIn: string = "1 saat") => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CanvasFlow - Şifre Sıfırlama</title>
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
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-box strong {
            color: #856404;
        }
        .reset-button {
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
        .reset-button:hover {
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
        .steps {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .steps ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .steps li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 CanvasFlow</h1>
            <p>Şifre Sıfırlama</p>
        </div>
    </div>

    <div class="content">
        <h2>Merhaba ${userName}! 👋</h2>
        
        <p>CanvasFlow hesabınız için şifre sıfırlama isteği aldık. Şifrenizi sıfırlamak için aşağıdaki düğmeye tıklayın:</p>

        <div style="text-align: center;">
            <a href="${resetLink}" class="reset-button">Şifremi Sıfırla →</a>
        </div>

        <p>Veya aşağıdaki bağlantıyı tarayıcınıza kopyalayın:</p>
        <div class="link-text">${resetLink}</div>

        <div class="warning-box">
            <strong>⚠️ Önemli:</strong> Bu bağlantı ${expiresIn} için geçerlidir. Şifre sıfırlama talebini yapan sizseniz, lütfen hemen işlemi tamamlayın.
        </div>

        <h3>Şifreniz için Güvenli Bir Seçim Nasıl Yapılır?</h3>
        <div class="steps">
            <ol>
                <li>En az 12 karakterden oluşan bir şifre kullanın</li>
                <li>Harfler, sayılar ve semboller karışımı olsun</li>
                <li>Kişisel bilgilerinizi içermeyen bir şifre seçin</li>
                <li>Hiçbir başka hesapta kullandığınız şifreyi kullanmayın</li>
            </ol>
        </div>

        <p><strong>Eğer bu şifre sıfırlama isteğini siz yapmadıysanız:</strong></p>
        <p>Kalmadı, bu e-posta görmezden gelin. Hesabınız güvende kalacak ve şifreniz değiştirilmeyecektir. Şüpheli aktivite görmüşse, lütfen <a href="https://canvasflow.example.com/support" style="color: #667eea; text-decoration: none;">destek ekibimize başvurun</a>.</p>

    </div>

    <div class="footer">
        <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıt vermeyin.</p>
        <p>CanvasFlow © 2026. Tüm hakları saklıdır.</p>
        <p><a href="https://canvasflow.example.com/security" style="color: #667eea; text-decoration: none;">Hesap Güvenliği Merkezi</a></p>
    </div>
</body>
</html>
`;
