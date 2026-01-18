/**
 * Promotional Email Template
 * Marketing emails for new features, updates, events
 */

export const promotionalEmailTemplate = (
    userName: string,
    promoTitle: string,
    promoDescription: string,
    promoImage?: string,
    ctaText: string = "Daha Fazla Bilgi Al",
    ctaLink: string = "https://canvasflow.example.com"
) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CanvasFlow - ${promoTitle}</title>
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
        .promo-image {
            width: 100%;
            max-height: 300px;
            border-radius: 8px;
            margin: 20px 0;
            object-fit: cover;
        }
        .promo-title {
            color: #667eea;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0 10px 0;
        }
        .promo-description {
            color: #555;
            line-height: 1.8;
            margin: 15px 0;
        }
        .features {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .features ul {
            list-style: none;
            padding: 0;
        }
        .features li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .features li:last-child {
            border-bottom: none;
        }
        .features li:before {
            content: "→ ";
            color: #667eea;
            font-weight: bold;
            margin-right: 10px;
        }
        .cta-button {
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
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .limited-time {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #856404;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
        .unsubscribe {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
        }
        .unsubscribe a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ CanvasFlow</h1>
            <p>${promoTitle}</p>
        </div>
    </div>

    <div class="content">
        <h2>Merhaba ${userName}! 👋</h2>
        
        ${promoImage ? `<img src="${promoImage}" alt="${promoTitle}" class="promo-image">` : ''}

        <div class="promo-title">${promoTitle}</div>
        <div class="promo-description">${promoDescription}</div>

        <div style="text-align: center;">
            <a href="${ctaLink}" class="cta-button">${ctaText} →</a>
        </div>

        <h3>Özet:</h3>
        <div class="features">
            <ul>
                <li>Yeni ve geliştirilmiş özellikleri keşfet</li>
                <li>Daha verimli çalış ve zaman kazanın</li>
                <li>Topluluğumuzla bağlan</li>
                <li>Özel avantajlardan yararlan</li>
            </ul>
        </div>

        <div class="limited-time">
            ⏰ Sınırlı Zaman Teklifi: Bu promosyon belirli bir tarihte sona erecektir. Şimdi harekete geç!
        </div>

        <p>Sorularınız varsa veya daha fazla bilgiye ihtiyacınız varsa, <a href="https://canvasflow.example.com/support" style="color: #667eea; text-decoration: none;">destek ekibimiz</a> her zaman yardımcı olmak için hazır.</p>

    </div>

    <div class="footer">
        <p>CanvasFlow © 2026. Tüm hakları saklıdır.</p>
        <div class="unsubscribe">
            <a href="https://canvasflow.example.com/settings/email-preferences?unsubscribe=promo">Tanıtım E-postalarından Aboneliğini Iptal Et</a> | 
            <a href="https://canvasflow.example.com/privacy">Gizlilik Politikası</a>
        </div>
    </div>
</body>
</html>
`;
