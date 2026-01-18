/**
 * Welcome Email Template
 * Sent when user successfully creates account
 */

export const welcomeEmailTemplate = (userName: string, userEmail: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CanvasFlow - Hoş Geldiniz!</title>
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
        .content h2 {
            color: #667eea;
            margin-top: 0;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .feature-list li:before {
            content: "✓ ";
            color: #667eea;
            font-weight: bold;
            margin-right: 10px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            margin: 20px 0;
            transition: transform 0.3s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
        .social-links {
            text-align: center;
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 CanvasFlow</h1>
            <p>Hoş Geldiniz!</p>
        </div>
    </div>

    <div class="content">
        <h2>Merhaba ${userName}! 👋</h2>
        
        <p>CanvasFlow platformuna katıldığınız için teşekkür ederiz! Dijital içeriğinizi organize etmenin ve paylaşmanın en iyi yolu sizi bekliyor.</p>

        <h3>Başlangıç İçin İpuçları:</h3>
        <ul class="feature-list">
            <li><strong>Canvas Oluştur:</strong> Kendi dijital tuvalinizi oluşturun ve içerik ekleyin</li>
            <li><strong>Widget Ekle:</strong> Saatler, notlar, yapılacaklar listesi ve daha fazlası</li>
            <li><strong>Video Entegrasyonu:</strong> YouTube, Vimeo ve daha birçok platformdan video ekleyin</li>
            <li><strong>Arkadaşlarınızla Paylaş:</strong> Tuvallarınızı arkadaşlarınızla güvenli şekilde paylaşın</li>
            <li><strong>AI Asistanı Kullan:</strong> Yapay zeka destekli yardımcı ile daha hızlı çalışın</li>
        </ul>

        <p style="text-align: center;">
            <a href="https://canvasflow.example.com/dashboard" class="cta-button">Dashboard'a Git →</a>
        </p>

        <h3>Hesabınızı Kurun:</h3>
        <p>Profil resmi ve bilgilerinizi ekleyerek hesabınızı tamamlayın. Bu, diğer kullanıcılarla daha iyi bağlantı kurmanıza yardımcı olacak.</p>

        <div class="social-links">
            <a href="https://twitter.com/canvasflow">𝕏 Twitter</a>
            <a href="https://discord.gg/canvasflow">💬 Discord</a>
            <a href="https://instagram.com/canvasflow">📸 Instagram</a>
        </div>
    </div>

    <div class="footer">
        <p>E-posta: ${userEmail}</p>
        <p>CanvasFlow © 2026. Tüm hakları saklıdır.</p>
        <p><a href="https://canvasflow.example.com/settings/preferences" style="color: #667eea; text-decoration: none;">E-posta Tercihlerini Ayarla</a></p>
    </div>
</body>
</html>
`;
