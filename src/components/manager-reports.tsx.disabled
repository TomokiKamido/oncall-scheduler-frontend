import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "src/components/ui/table"

// シフト型定義 (app/page.tsxからコピー)
interface Shift {
  id: number
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  staffId: number
  staffName: string
  department: string
  shiftType: "日勤" | "夜勤" | "日直" | "当直"
}

// リクエスト型定義 (app/page.tsxからコピー)
interface Request {
  id: number
  type: "vacation" | "substitute" // 休暇申請 or 代替シフト
  staffName: string
  department: string // リクエストに部署情報を追加
  date: string
  status: "pending" | "approved" | "rejected"
  reason: string
}

interface ManagerReportsProps {
  currentUserDepartment: string
  sampleShifts: Shift[]
  requests: Request[]
}

export function ManagerReports({ currentUserDepartment, sampleShifts, requests }: ManagerReportsProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0") // 01-12

  const [selectedYearForMonthly, setSelectedYearForMonthly] = useState<string>(currentYear.toString())
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)
  const [selectedYearForAnnual, setSelectedYearForAnnual] = useState<string>(currentYear.toString())

  const years = Array.from({ length: 3 }, (_, i) => (currentYear - 1 + i).toString()) // Current year, previous, next
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")) // 01-12

  // 月間勤務日数を計算
  const calculateMonthlyWorkingDays = () => {
    const monthlyData: { [key: string]: Set<string> } = {} // staffName -> Set of unique dates

    sampleShifts
      .filter(
        (shift) =>
          shift.department === currentUserDepartment &&
          shift.date.startsWith(`${selectedYearForMonthly}-${selectedMonth}`),
      )
      .forEach((shift) => {
        if (!monthlyData[shift.staffName]) {
          monthlyData[shift.staffName] = new Set()
        }
        monthlyData[shift.staffName].add(shift.date)
      })

    return Object.entries(monthlyData).map(([staffName, dates]) => ({
      staffName,
      days: dates.size,
    }))
  }

  // 年間休日取得日数を計算
  const calculateAnnualLeaveDays = () => {
    const annualLeaveData: { [key: string]: number } = {} // staffName -> count of leave requests

    requests
      .filter(
        (req) =>
          req.department === currentUserDepartment &&
          req.type === "vacation" &&
          req.date.startsWith(selectedYearForAnnual),
      )
      .forEach((req) => {
        annualLeaveData[req.staffName] = (annualLeaveData[req.staffName] || 0) + 1
      })

    return Object.entries(annualLeaveData).map(([staffName, days]) => ({
      staffName,
      days,
    }))
  }

  const monthlyWorkingDays = calculateMonthlyWorkingDays()
  const annualLeaveDays = calculateAnnualLeaveDays()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">
            月間勤務日数 ({selectedYearForMonthly}年{Number.parseInt(selectedMonth)}月)
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedYearForMonthly} onValueChange={setSelectedYearForMonthly}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="年度" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="月" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {Number.parseInt(month)}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>スタッフ名</TableHead>
                <TableHead className="text-right">勤務日数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyWorkingDays.length > 0 ? (
                monthlyWorkingDays.map((data, index) => (
                  <TableRow key={index}>
                    <TableCell>{data.staffName}</TableCell>
                    <TableCell className="text-right">{data.days}日</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">年間休日取得日数 ({selectedYearForAnnual}年)</CardTitle>
          {/* 年間休日取得日数のカード内に年度選択を配置 */}
          <Select value={selectedYearForAnnual} onValueChange={setSelectedYearForAnnual}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="年度を選択" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>スタッフ名</TableHead>
                <TableHead className="text-right">取得日数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {annualLeaveDays.length > 0 ? (
                annualLeaveDays.map((data, index) => (
                  <TableRow key={index}>
                    <TableCell>{data.staffName}</TableCell>
                    <TableCell className="text-right">{data.days}日</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
