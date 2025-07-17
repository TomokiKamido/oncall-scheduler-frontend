import { Button } from "src/components/ui/button"
import {
  Building2,
  CalendarIcon,
  CheckSquare,
  ClipboardList,
  Cog,
  Home,
  Menu,
  PieChart,
  SignalIcon as Notification,
  User,
  Users,
} from "lucide-react"

// ロール定義 (app/page.tsxからコピー)
type UserRole = "admin" | "manager" | "staff"

interface SidebarProps {
  userRole: UserRole
  isCollapsed: boolean
  onToggle: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ userRole, isCollapsed, onToggle, activeTab, onTabChange }: SidebarProps) {
  const getMenuItems = () => {
    switch (userRole) {
      case "admin":
        return [
          { id: "dashboard", label: "ダッシュボード", icon: Home },
          { id: "users", label: "ユーザー管理", icon: Users },
          { id: "departments", label: "部署管理", icon: Building2 },
          { id: "shifts", label: "シフト管理", icon: CalendarIcon },
          { id: "requests", label: "リクエスト管理", icon: ClipboardList },
          { id: "settings", label: "システム設定", icon: Cog },
        ]
      case "manager":
        return [
          { id: "dashboard", label: "ダッシュボード", icon: Home },
          { id: "shifts", label: "シフト管理", icon: CalendarIcon },
          { id: "approval", label: "承認ワークフロー", icon: CheckSquare },
          { id: "reports", label: "レポート", icon: PieChart },
        ]
      case "staff":
        return [
          { id: "my-shifts", label: "自分のシフト", icon: CalendarIcon },
          { id: "requests", label: "休暇申請", icon: ClipboardList },
          { id: "profile", label: "プロフィール", icon: User },
          { id: "notifications", label: "通知設定", icon: Notification },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button variant="ghost" size="sm" onClick={onToggle} className="w-full justify-start">
          <Menu className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">メニュー</span>}
        </Button>
      </div>

      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"}`}
                onClick={() => onTabChange(item.id)}
              >
                <IconComponent className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">{item.label}</span>}
              </Button>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          {!isCollapsed && (
            <>
              <div>OnCall Scheduler v2.1.0</div>
              <div className="mt-1">
                <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                  サポート
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
