"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "src/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "src/components/ui/dialog"
import { Input } from "src/components/ui/input"
import { Label } from "src/components/ui/label"

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

interface StaffProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: StaffMember
  onSave: (updatedUser: StaffMember) => void
}

export function StaffProfileEditDialog({ open, onOpenChange, currentUser, onSave }: StaffProfileEditDialogProps) {
  const [step, setStep] = useState<"email_entry" | "code_entry" | "profile_edit">(
    currentUser.email ? "email_entry" : "profile_edit", // メールアドレスがない場合は直接編集画面へ
  )
  const [emailForVerification, setEmailForVerification] = useState(currentUser.email || "")
  const [verificationCodeInput, setVerificationCodeInput] = useState("")
  const [sentCode, setSentCode] = useState("") // シミュレーション用の送信されたコード
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // プロフィール編集フォームのステート
  const [lastName, setLastName] = useState(currentUser.name.split(" ")[0] || "")
  const [firstName, setFirstName] = useState(currentUser.name.split(" ")[1] || "")
  const [lastNameKana, setLastNameKana] = useState(currentUser.nameKana?.split(" ")[0] || "")
  const [firstNameKana, setFirstNameKana] = useState(currentUser.nameKana?.split(" ")[1] || "")
  const [profileEmail, setProfileEmail] = useState(currentUser.email || "") // プロフィール編集フォームのメールアドレス
  const [birthDate, setBirthDate] = useState(currentUser.birthDate || "")

  // ダイアログが開かれたときに初期状態をリセット
  React.useEffect(() => {
    if (open) {
      setStep(currentUser.email ? "email_entry" : "profile_edit")
      setEmailForVerification(currentUser.email || "")
      setVerificationCodeInput("")
      setSentCode("")
      setIsSendingCode(false)
      setIsVerifyingCode(false)
      setErrorMessage(null)

      // プロフィール編集フォームのステートもリセット
      setLastName(currentUser.name.split(" ")[0] || "")
      setFirstName(currentUser.name.split(" ")[1] || "")
      setLastNameKana(currentUser.nameKana?.split(" ")[0] || "")
      setFirstNameKana(currentUser.nameKana?.split(" ")[1] || "")
      setProfileEmail(currentUser.email || "")
      setBirthDate(currentUser.birthDate || "")
    }
  }, [open, currentUser])

  const handleSendVerificationCode = () => {
    if (!emailForVerification) {
      setErrorMessage("メールアドレスを入力してください。")
      return
    }
    setErrorMessage(null)
    setIsSendingCode(true)

    // メール送信のシミュレーション
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString() // 6桁のランダムなコード
      setSentCode(code)
      console.log(`[DEBUG] Verification code for ${emailForVerification}: ${code}`) // 開発者向けにコンソールに表示
      setIsSendingCode(false)
      setStep("code_entry")
      setErrorMessage("認証コードをメールアドレスに送信しました。")
    }, 1500)
  }

  const handleVerifyCode = () => {
    if (!verificationCodeInput) {
      setErrorMessage("認証コードを入力してください。")
      return
    }
    setErrorMessage(null)
    setIsVerifyingCode(true)

    // コード認証のシミュレーション
    setTimeout(() => {
      if (verificationCodeInput === sentCode) {
        setIsVerifyingCode(false)
        setStep("profile_edit")
        setErrorMessage(null)
      } else {
        setIsVerifyingCode(false)
        setErrorMessage("無効な認証コードです。")
      }
    }, 1000)
  }

  const handleSaveProfile = () => {
    const updatedUser: StaffMember = {
      ...currentUser,
      name: `${lastName} ${firstName}`,
      nameKana: `${lastNameKana} ${firstNameKana}`,
      email: profileEmail,
      birthDate,
    }
    onSave(updatedUser)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>プロフィール編集</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          {step === "email_entry" && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                プロフィールを編集するには、まずメールアドレスを認証してください。
              </p>
              <div className="grid gap-2">
                <Label htmlFor="email-for-verification">メールアドレス</Label>
                <Input
                  id="email-for-verification"
                  type="email"
                  value={emailForVerification}
                  onChange={(e) => setEmailForVerification(e.target.value)}
                  placeholder="メールアドレスを入力"
                  disabled={isSendingCode}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSendingCode}>
                  キャンセル
                </Button>
                <Button onClick={handleSendVerificationCode} disabled={isSendingCode}>
                  {isSendingCode ? "送信中..." : "認証コードを送信"}
                </Button>
              </div>
            </>
          )}

          {step === "code_entry" && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {emailForVerification}に送信された6桁の認証コードを入力してください。
              </p>
              <div className="grid gap-2">
                <Label htmlFor="verification-code">認証コード</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value)}
                  placeholder="認証コードを入力"
                  maxLength={6}
                  disabled={isVerifyingCode}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep("email_entry")} disabled={isVerifyingCode}>
                  メールアドレスを再入力
                </Button>
                <Button onClick={handleVerifyCode} disabled={isVerifyingCode}>
                  {isVerifyingCode ? "認証中..." : "コードを認証"}
                </Button>
              </div>
            </>
          )}

          {step === "profile_edit" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-lastName">姓 *</Label>
                  <Input id="edit-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-firstName">名 *</Label>
                  <Input id="edit-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-lastNameKana">セイ *</Label>
                  <Input
                    id="edit-lastNameKana"
                    value={lastNameKana}
                    onChange={(e) => setLastNameKana(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-firstNameKana">メイ *</Label>
                  <Input
                    id="edit-firstNameKana"
                    value={firstNameKana}
                    onChange={(e) => setFirstNameKana(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-birthDate">生年月日 *</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">メールアドレス *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                  更新
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
