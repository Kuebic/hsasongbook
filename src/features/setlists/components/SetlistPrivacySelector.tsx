import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lock, Link2, Globe } from "lucide-react";

interface SetlistPrivacySelectorProps {
  value: 'private' | 'unlisted' | 'public';
  onChange: (value: 'private' | 'unlisted' | 'public') => void;
  disabled?: boolean;
}

export default function SetlistPrivacySelector({
  value,
  onChange,
  disabled,
}: SetlistPrivacySelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Privacy</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange as (value: string) => void}
        disabled={disabled}
      >
        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="private" id="private" className="mt-1" />
          <Label htmlFor="private" className="flex-1 cursor-pointer font-normal">
            <div className="flex items-center gap-2 font-medium">
              <Lock className="h-4 w-4" />
              Private
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Only you can see this setlist
            </div>
          </Label>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="unlisted" id="unlisted" className="mt-1" />
          <Label htmlFor="unlisted" className="flex-1 cursor-pointer font-normal">
            <div className="flex items-center gap-2 font-medium">
              <Link2 className="h-4 w-4" />
              Unlisted
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Anyone with the link can view
            </div>
          </Label>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="public" id="public" className="mt-1" />
          <Label htmlFor="public" className="flex-1 cursor-pointer font-normal">
            <div className="flex items-center gap-2 font-medium">
              <Globe className="h-4 w-4" />
              Public
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Discoverable in browse and search
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
