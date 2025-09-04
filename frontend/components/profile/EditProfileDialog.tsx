"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Set your backend URL here

interface FormData {
  name: string;
  username: string;
  profileImageUrl?: string;
  bio: string;
  gender: string;
  birthday: string;
  status: string;
  visibility: string;
  openChat: boolean;
}

interface FormErrors {
  [key: string]: string | undefined;
  general?: string;
}

interface EditProfileDialogProps {
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  formData: FormData;
  formErrors: FormErrors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: string, value: string) => void;
  handleSwitchChange: (field: string, checked: boolean) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleUpdateProfile: (e: React.FormEvent<HTMLFormElement>) => void;
  uploading: boolean;
  uploadProgress: number;
  Backend_URL: string;
  isUpdating: boolean;
}

export default function EditProfileDialog({
  editModalOpen,
  setEditModalOpen,
  formData,
  formErrors,
  handleInputChange,
  handleSelectChange,
  handleSwitchChange,
  handleFileUpload,
  triggerFileInput,
  fileInputRef,
  Backend_URL,
  handleUpdateProfile,
  uploading,
  uploadProgress,
  isUpdating,
}: EditProfileDialogProps) {
  return (
    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent className="bg-[#14171A] backdrop-blur-xl border border-[#222832] rounded-2xl overflow-hidden max-w-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1F24]/20 to-[#0B0D10]/50 pointer-events-none"></div>

        <DialogHeader className="mb-6 relative z-10">
          <DialogTitle className="text-2xl font-bold text-[#E6EAF0]">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-[#A9B4C2]">
            Update your profile information below.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleUpdateProfile}
          className="space-y-6 relative z-10"
        >
          {formErrors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm backdrop-blur-sm"
            >
              {formErrors.general}
            </motion.div>
          )}

          {/* Name & Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#E6EAF0]">
                Name ({formData.name.length}/50)
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-[#1A1F24] backdrop-blur-sm border-[#222832] text-[#E6EAF0] focus:ring-2 focus:ring-[#12D6DF]"
                maxLength={50}
              />
              {formErrors.name && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs"
                >
                  {formErrors.name}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#E6EAF0]">
                Username ({formData.username.length}/50)
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="bg-[#1A1F24] backdrop-blur-sm border-[#222832] text-[#E6EAF0] focus:ring-2 focus:ring-[#12D6DF]"
                maxLength={50}
              />
              {formErrors.username && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs"
                >
                  {formErrors.username}
                </motion.p>
              )}
            </div>
          </div>

          {/* Profile Image */}
          <div className="space-y-2">
            <Label className="text-[#E6EAF0]">Profile Image</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {formData.profileImageUrl ? (
                  <img src={`${Backend_URL}${formData.profileImageUrl}`} alt="Profile preview" className="w-16 h-16 rounded-full object-cover border border-[#222832]" />

                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#1A1F24] border border-[#222832] flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#A9B4C2]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="bg-[#1A1F24] hover:bg-[#222832] border border-[#222832] text-[#E6EAF0]"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                {formErrors.profileImage && (
                  <p className="text-red-400 text-xs mt-1">
                    {formErrors.profileImage}
                  </p>
                )}
                {uploading && (
                  <div className="mt-2">
                    <Progress
                      value={uploadProgress}
                      className="h-2 bg-[#1A1F24]"
                    />
                    <p className="text-xs text-[#A9B4C2] mt-1">
                      {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-[#E6EAF0]">
              Bio ({formData.bio.length}/200)
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="bg-[#1A1F24] backdrop-blur-sm border-[#222832] text-[#E6EAF0] focus:ring-2 focus:ring-[#12D6DF] min-h-[100px]"
              maxLength={200}
            />
            {formErrors.bio && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs"
              >
                {formErrors.bio}
              </motion.p>
            )}
          </div>

          {/* Gender & Birthday */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-[#E6EAF0]">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleSelectChange("gender", value)}
              >
                <SelectTrigger className="bg-[#1A1F24] backdrop-blur-sm border-[#222832] text-[#E6EAF0] focus:ring-2 focus:ring-[#12D6DF]">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1F24] border-[#222832] text-[#E6EAF0]">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility" className="text-[#E6EAF0]">
                Visibility
              </Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) =>
                  handleSelectChange("visibility", value)
                }
              >
                <SelectTrigger className="bg-[#1A1F24] backdrop-blur-sm border-[#222832] text-[#E6EAF0] focus:ring-2 focus:ring-[#12D6DF]">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1F24] border-[#222832] text-[#E6EAF0]">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday" className="text-[#E6EAF0]">
                Birthday
              </Label>
              <Input
                id="birthday"
                name="birthday"
                type="date"
                value={formData.birthday}
                onChange={handleInputChange}
                className="bg-[#1A1F24] backdrop-blur-sm border-[#222832] text-[#E6EAF0] focus:ring-2 focus:ring-[#12D6DF]"
              />
              {formErrors.birthday && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs"
                >
                  {formErrors.birthday}
                </motion.p>
              )}
            </div>
            
          </div>
            

          {/* Open Chat Switch & Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-[#222832]">
            <div className="flex items-center space-x-2">
              <Switch
                id="openChat"
                checked={formData.openChat}
                onCheckedChange={(checked) =>
                  handleSwitchChange("openChat", checked)
                }
                className="data-[state=checked]:bg-[#12D6DF]"
              />
              <Label htmlFor="openChat" className="text-[#E6EAF0]">
                Enable Open Chat
              </Label>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-[#12D6DF] hover:bg-[#0ebcc5] text-[#0B0D10] font-semibold"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B0D10] mr-2"></div>
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </motion.div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
