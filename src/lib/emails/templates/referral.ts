/**
 * Referral Email Template
 * Sent when a friend joins via referral link
 */

export const referralEmailTemplate = (referrerName: string, referralName: string, referralEmail: string, bonusCredit?: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CanvasFlow - Arkadaşınız Katıldı!</title>
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
        .bonus-box {
            background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .bonus-box h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .bonus-amount {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
        }
        .friend-info {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .profile-link {
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
        .profile-link:hover {
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
        .reward-info {
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
            <h1>🎉 CanvasFlow</h1>
            <p>Arkadaşınız Katıldı!</p>
        </div>
    </div>

    <div class="content">
        <h2>Harika Haber, ${referrerName}! 🎊</h2>
        
        <p><strong>${referralName}</strong> (${referralEmail}) sizin referans bağlantınızı kullanarak CanvasFlow'a katıldı!</p>

        <div class="friend-info">
            <h3>👤 Arkadaşınız Hakkında:</h3>
            <p><strong>İsim:</strong> ${referralName}</p>
            <p><strong>E-posta:</strong> ${referralEmail}</p>
            <p><strong>Katılma Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>

        ${bonusCredit ? `
        <div class="bonus-box">
            <h3>🎁 Bonus Krediniz Hazır!</h3>
            <div class="bonus-amount">${bonusCredit}</div>
            <p>Arkadaşınızı davet ettiğiniz için teşekkür ederiz! Bonus kredinizi premium özellikleri açmak için kullanabilirsiniz.</p>
        </div>
        ` : ''}

        <div class="reward-info">
            <strong>💰 Referral Programı:</strong> Her başarılı referral için bonus kredit kazanın! Unlimited arkadaş davet edebilir ve her biri için ödül alabilirsiniz.
        </div>

        <h3>Sonraki Adımlar:</h3>
        <ol>
            <li>Arkadaşınızın profilini ziyaret edin ve bağlantı kurun</li>
            <li>Birlikte çalışabilecekleriniz hakkında fikir alışverişi yapın</li>
            <li>İçerik paylaşarak işbirliğine başlayın</li>
        </ol>

        <p style="text-align: center;">
            <a href="https://canvasflow.example.com/dashboard" class="profile-link">Daha Fazla Arkadaş Davet Et →</a>
        </p>

        <p><strong>Başkalarını davet etmeyi istiyorsanız:</strong> Hesap ayarlarınızdan özel referral bağlantınızı bulabilirsiniz ve isteyen herkese gönderebilirsiniz!</p>

    </div>

    <div class="footer">
        <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıt vermeyin.</p>
        <p>CanvasFlow © 2026. Tüm hakları saklıdır.</p>
        <p><a href="https://canvasflow.example.com/settings/referral" style="color: #667eea; text-decoration: none;">Referral Ayarlarım</a></p>
    </div>
</body>
</html>
`;
