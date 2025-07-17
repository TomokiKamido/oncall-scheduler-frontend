"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card"
import { Button } from "src/components/ui/button"
import { Badge } from "src/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Shuffle, Download } from "lucide-react"
import { cn } from "src/lib/utils"

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

// シフト型定義 (app/page.tsxからコピー)
interface Shift {
  id: number
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  staffId: number
  staffName: string
  department: string
  shiftType: string // 勤務形態名
}

type StaffDashboardProps = {
  currentUser?: StaffMember // currentUserをpropsとして受け取る（オプショナル）
  sampleShifts?: Shift[]
}

export function StaffDashboard({ 
  currentUser = {
    id: 1,
    name: "山田太郎",
    department: "内科",
    role: "staff",
    avatar: "/avatars/placeholder.png",
    workload: 75,
    status: "勤務中",
    employeeId: "EMP001"
  }, 
  sampleShifts = [
    { id: 1, date: "2024-07-15", startTime: "09:00", endTime: "17:00", staffId: 1, staffName: "山田太郎", department: "内科", shiftType: "日勤" },
    { id: 2, date: "2024-07-16", startTime: "17:00", endTime: "09:00", staffId: 1, staffName: "山田太郎", department: "内科", shiftType: "夜勤" },
  ]
}: StaffDashboardProps) {
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date()) // 表示する月の基準日

  const displayYear = currentDisplayDate.getFullYear()
  const displayMonth = currentDisplayDate.getMonth() // 0-indexed

  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay() // 0 for Sunday, 1 for Monday

  // 月曜日を週の開始とする (日曜日が0の場合、-6で前週の月曜日に、それ以外は1で今週の月曜日に)
  const startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const calendarDays = []
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push(null) // 月の初めまでの空白セル
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  // 現在のユーザーの表示月のシフトをフィルタリング
  const userShiftsThisMonth = sampleShifts.filter(
    (shift) =>
      shift.staffId === currentUser.id &&
      new Date(shift.date).getFullYear() === displayYear &&
      new Date(shift.date).getMonth() === displayMonth,
  )

  // シフトがある日付のセットを作成
  const shiftDates = new Set(userShiftsThisMonth.map((shift) => new Date(shift.date).getDate()))

  // 前の月に移動
  const handlePreviousMonth = () => {
    setCurrentDisplayDate((prevDate) => {
      const newDate = new Date(prevDate)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  // 次の月に移動
  const handleNextMonth = () => {
    setCurrentDisplayDate((prevDate) => {
      const newDate = new Date(prevDate)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 今月のシフトカレンダーを大きく表示するため、col-span-full を適用 */}
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                {displayYear}年 {displayMonth + 1}月
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-base">
              {" "}
              {/* gapとtext-baseを調整 */}
              {["月", "火", "水", "木", "金", "土", "日"].map((day) => (
                <div key={day} className="font-medium text-gray-500 dark:text-gray-400 py-2">
                  {" "}
                  {/* 曜日にもpaddingを追加 */}
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-md aspect-square flex items-center justify-center", // paddingとaspect-squareを調整
                    day && shiftDates.has(day)
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold"
                      : "text-gray-700 dark:text-gray-300",
                    day === new Date().getDate() &&
                      displayMonth === new Date().getMonth() &&
                      displayYear === new Date().getFullYear()
                      ? "border-2 border-blue-500" // 今日の日付をハイライト
                      : "",
                    !day && "opacity-0 pointer-events-none", // 空のセルを非表示
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 申請ステータスカードは残す */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">申請ステータス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">1</div>
            <p className="text-xs text-muted-foreground">承認待ち</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>今週のスケジュール</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "1/22 (月)", shift: "日勤", time: "8:00-17:00", status: "confirmed" },
                { date: "1/23 (火)", shift: "休み", time: "-", status: "confirmed" },
                { date: "1/24 (水)", shift: "夜勤", time: "17:00-8:00", status: "confirmed" },
                { date: "1/25 (木)", shift: "休み", time: "-", status: "confirmed" },
                { date: "1/26 (金)", shift: "日勤", time: "8:00-17:00", status: "pending" },
              ].map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{schedule.date}</div>
                    <div className="text-sm text-gray-500">{schedule.time}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={schedule.shift === "休み" ? "secondary" : "default"}>{schedule.shift}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              休暇申請
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Shuffle className="h-4 w-4 mr-2" />
              シフト交換申請
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              シフト表ダウンロード
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default StaffDashboard
