/**
 * Notification Email Template
 * For important updates like account activity, security alerts
 */

export const notificationEmailTemplate = (
    userName: string,
    notificationType: 'security' | 'activity' | 'achievement' | 'reminder',
    notificationTitle: string,
    notificationContent: string,
    actionLink?: string,
    actionText?: string
) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CanvasFlow - ${notificationTitle}</title>
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
            border-radius: 10px;
            padding: 40px;
            color: white;
        }
        .container.security {
            background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
        }
        .container.activity {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
        }
        .container.achievement {
            background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
        }
        .container.reminder {
            background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
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
        .notification-icon {
            font-size: 48px;
            text-align: center;
            margin: 20px 0;
        }
        .notification-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            margin: 10px 0;
            font-size: 12px;
        }
        .notification-badge.security {
            background: #ffebee;
            color: #c62828;
        }
        .notification-badge.activity {
            background: #e3f2fd;
            color: #1565c0;
        }
        .notification-badge.achievement {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .notification-badge.reminder {
            background: #fff3e0;
            color: #e65100;
        }
        .action-button {
            display: inline-block;
            color: white;
            padding: 15px 40px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            margin: 20px 0;
            font-size: 16px;
            transition: transform 0.3s;
        }
        .security .action-button {
            background: #d32f2f;
        }
        .activity .action-button {
            background: #1976d2;
        }
        .achievement .action-button {
            background: #388e3c;
        }
        .reminder .action-button {
            background: #f57c00;
        }
        .action-button:hover {
            transform: translateY(-2px);
        }
        .details-box {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container ${notificationType}">
        <div class="header">
            <div class="notification-icon">
                ${notificationType === 'security' ? '🔒' : notificationType === 'activity' ? '📢' : notificationType === 'achievement' ? '🏆' : '⏰'}
            </div>
            <h1>CanvasFlow</h1>
            <span class="notification-badge ${notificationType}">${
                notificationType === 'security' ? 'Güvenlik Uyarısı' :
                notificationType === 'activity' ? 'Aktivite Bildirim' :
                notificationType === 'achievement' ? 'Başarı Kazanıldı' :
                'Hatırlatma'
            }</span>
        </div>
    </div>

    <div class="content">
        <h2>${notificationTitle}</h2>
        
        ${notificationContent}

        ${actionLink && actionText ? `
        <div style="text-align: center;">
            <a href="${actionLink}" class="action-button">${actionText} →</a>
        </div>
        ` : ''}

        <div class="details-box">
            <strong>📌 Bilgi:</strong> Bu e-posta, CanvasFlow hesabınızla ilgili önemli bilgileri içerir. E-posta tercihlerinizden bu tür bildirimleri kontrol edebilirsiniz.
        </div>

    </div>

    <div class="footer">
        <p>CanvasFlow © 2026. Tüm hakları saklıdır.</p>
        <p><a href="https://canvasflow.example.com/settings/notifications" style="color: #667eea; text-decoration: none;">Bildirim Ayarlarım</a> | <a href="https://canvasflow.example.com/privacy" style="color: #667eea; text-decoration: none;">Gizlilik Politikası</a></p>
    </div>
</body>
</html>
`;
