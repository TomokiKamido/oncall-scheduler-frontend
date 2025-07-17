import { AlertCircle, CheckCircle, Info } from "lucide-react"

// ロール定義 (app/page.tsxからコピー)
type UserRole = "admin" | "manager" | "staff"

interface NotificationDisplayProps {
  userRole: UserRole
}

export function NotificationDisplay({ userRole }: NotificationDisplayProps) {
  const getNotifications = () => {
    switch (userRole) {
      case "admin":
        return [
          { id: 1, type: "alert", message: "システム負荷が高まっています。確認してください。", time: "5分前" },
          { id: 2, type: "info", message: "新規ユーザーが登録されました: 山田 太郎", time: "1時間前" },
          { id: 3, type: "success", message: "部署情報が更新されました: 内科", time: "3時間前" },
        ]
      case "manager":
        return [
          { id: 1, type: "alert", message: "承認待ちの休暇申請があります: 田中 太郎", time: "10分前" },
          { id: 2, type: "info", message: "シフト交換リクエストが届きました: 鈴木 次郎", time: "30分前" },
          { id: 3, type: "success", message: "新しいスタッフが部署に配属されました: 佐藤 健太", time: "1日前" },
        ]
      case "staff":
        return [
          { id: 1, type: "success", message: "あなたのシフトが確定しました: 1月25日 日勤", time: "15分前" },
          { id: 2, type: "info", message: "休暇申請のステータスが更新されました: 承認済み", time: "2時間前" },
          { id: 3, type: "alert", message: "システムメンテナンスのお知らせ: 2月1日 22:00-24:00", time: "1日前" },
        ]
      default:
        return []
    }
  }

  const notifications = getNotifications()

  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-4">
      {notifications.length > 0 ? (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-muted-foreground py-4">新しい通知はありません。</p>
      )}
    </div>
  )
}
