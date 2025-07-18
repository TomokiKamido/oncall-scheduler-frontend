import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card"
import { Button } from "src/components/ui/button"
import { Label } from "src/components/ui/label"
import { Switch } from "src/components/ui/switch"

// ユーザー型定義 (app/page.tsxからコピー)
interface StaffMember {
  id: number
  name: string
  department: string
  role: "admin" | "manager" | "staff"
  avatar: string
  workload: number
  status: string
  employeeId: string
  email?: string
  birthDate?: string
  nameKana?: string
}

interface StaffNotificationsProps {
  currentUser: StaffMember
}

export function StaffNotifications({ currentUser }: StaffNotificationsProps) {
  const [enableShiftNotifications, setEnableShiftNotifications] = useState(true)
  const [enableRequestStatusNotifications, setEnableRequestStatusNotifications] = useState(true)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleSaveSettings = () => {
    // TODO: 設定を保存するロジックを実装
    console.log("Notification settings saved for", currentUser.name, {
      enableShiftNotifications,
      enableRequestStatusNotifications,
    })
    setSaveMessage("設定が保存されました！")
    setTimeout(() => {
      setSaveMessage(null)
    }, 3000) // 3秒後にメッセージを非表示にする
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>通知設定</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {saveMessage && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
              role="status"
              aria-live="polite"
            >
              <span className="block sm:inline">{saveMessage}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="shift-notifications">シフト変更通知</Label>
            <Switch
              id="shift-notifications"
              checked={enableShiftNotifications}
              onCheckedChange={setEnableShiftNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="request-status-notifications">申請ステータス通知</Label>
            <Switch
              id="request-status-notifications"
              checked={enableRequestStatusNotifications}
              onCheckedChange={setEnableRequestStatusNotifications}
            />
          </div>
          <Button onClick={handleSaveSettings} className="w-full justify-start bg-transparent" variant="outline">
            設定を保存
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
