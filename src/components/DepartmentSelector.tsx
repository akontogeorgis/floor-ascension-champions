import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DepartmentSelectorProps {
  open: boolean;
  onClose: () => void;
  athleteId: string;
  currentDepartment?: string;
}

const PRESET_DEPARTMENTS = [
  "Senior Troublemakers",
  "0100101101",
  "Orchestrators",
  "Digital Alchemists",
  "Uncategorized",
];

export default function DepartmentSelector({
  open,
  onClose,
  athleteId,
  currentDepartment = "Uncategorized",
}: DepartmentSelectorProps) {
  const [selectedDepartment, setSelectedDepartment] = useState(currentDepartment);
  const [customDepartment, setCustomDepartment] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedDepartment(currentDepartment);
  }, [currentDepartment]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const finalDepartment = isCustom ? customDepartment : selectedDepartment;
      
      if (!finalDepartment.trim()) {
        toast.error("Please select or enter a department");
        setSaving(false);
        return;
      }

      if (!supabase) {
        toast.error("Database not connected");
        setSaving(false);
        return;
      }

      // Debug: Log what we're trying to update
      console.log('Attempting to update department:', {
        athleteId,
        athleteIdParsed: parseInt(athleteId),
        department: finalDepartment.trim()
      });

      const { data, error, count } = await supabase
        .from('profiles')
        .update({ department: finalDepartment.trim() })
        .eq('strava_athlete_id', parseInt(athleteId))
        .select();

      // Debug: Log the response
      console.log('Update response:', { data, error, count });

      if (error) {
        console.error('Error updating department:', error);
        toast.error(`Failed to update department: ${error.message}`);
      } else if (!data || data.length === 0) {
        console.error('No profile found with strava_athlete_id:', athleteId);
        toast.error(`No profile found! Please reconnect to Strava. (ID: ${athleteId})`);
      } else {
        console.log('Successfully updated profile:', data[0]);
        toast.success(`Department updated to "${finalDepartment}"!`);
        
        // Trigger leaderboard refresh
        window.dispatchEvent(new Event('activities-updated'));
        
        onClose();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed to update department: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Your Department</DialogTitle>
          <DialogDescription>
            Choose your team or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isCustom ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsCustom(true)}
                className="px-0"
              >
                + Create new department
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="custom-dept">New Department Name</Label>
                <Input
                  id="custom-dept"
                  placeholder="e.g., Innovation Team"
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                />
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsCustom(false)}
                className="px-0"
              >
                ← Back to preset departments
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
