"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Repeat } from "lucide-react"; // Lucide icon
import { Loader2 } from "lucide-react"; // Spinner icon

interface VerificationModalProps {
  showVerificationModal: boolean;
  setShowVerificationModal: (value: boolean) => void;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  handleVerificationSubmit: () => void;
  handleResendCode: () => void;
  isVerifying: boolean;
  isResending: boolean;
}

export default function VerificationModal({
  showVerificationModal,
  setShowVerificationModal,
  verificationCode,
  setVerificationCode,
  handleVerificationSubmit,
  handleResendCode,
  isVerifying,
  isResending,
}: VerificationModalProps) {
  return (
    <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
      <DialogContent
        className="rounded-xl max-w-md"
        style={{
          background: "var(--bg-dark-3)", // main popup bg
          border: "1px solid var(--color-brand-mid)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-bold text-center mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Verify Your Email
          </DialogTitle>
          <DialogDescription
            className="text-center"
            style={{ color: "var(--text-brand-2)" }}
          >
            We've sent a 6-digit code to your email address
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Verification Code
            </label>
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="rounded-xl py-3 px-4 w-full focus:outline-none"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--color-brand-mid)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleVerificationSubmit}
              disabled={isVerifying}
              className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{
                background: "var(--bg-brand-3)", // better gradient for main button
                color: "var(--text-light)",
              }}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Verifying...
                </>
              ) : (
                "Verify Account"
              )}
            </Button>

            <Button
              onClick={handleResendCode}
              disabled={isResending}
              className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{
                background: "var(--bg-brand-2)", // better resend button gradient
                color: "var(--text-light)",
              }}
            >
              {isResending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Sending...
                </>
              ) : (
                <>
                  <Repeat className="h-4 w-4" />
                  Resend Code
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
