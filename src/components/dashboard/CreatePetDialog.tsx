import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreatePetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isShelter?: boolean;
}

export function CreatePetDialog({ open, onOpenChange, onSuccess, isShelter = false }: CreatePetDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    gender: "",
    description: "",
    is_for_adoption: isShelter,
    shelter_name: "",
    location: "",
    vaccinated: false,
    neutered: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("pets").insert({
      owner_id: user.id,
      name: formData.name,
      species: formData.species,
      breed: formData.breed || null,
      age: formData.age || null,
      gender: formData.gender || null,
      description: formData.description || null,
      is_for_adoption: formData.is_for_adoption,
      shelter_name: formData.shelter_name || null,
      location: formData.location || null,
      vaccinated: formData.vaccinated,
      neutered: formData.neutered,
    });

    setLoading(false);

    if (error) {
      console.error("Error creating pet:", error);
    } else {
      setFormData({
        name: "",
        species: "",
        breed: "",
        age: "",
        gender: "",
        description: "",
        is_for_adoption: isShelter,
        shelter_name: "",
        location: "",
        vaccinated: false,
        neutered: false,
      });
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isShelter ? "List Pet for Adoption" : "Add Pet Profile"}</DialogTitle>
          <DialogDescription>
            {isShelter
              ? "Add a new pet to your shelter's adoption listings."
              : "Create a profile for your pet."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pet Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="species">Species *</Label>
            <Select
              value={formData.species}
              onValueChange={(value) => setFormData({ ...formData, species: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dog">Dog</SelectItem>
                <SelectItem value="Cat">Cat</SelectItem>
                <SelectItem value="Bird">Bird</SelectItem>
                <SelectItem value="Rabbit">Rabbit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 2 years"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about your pet..."
            />
          </div>

          {isShelter && (
            <>
              <div className="space-y-2">
                <Label htmlFor="shelter_name">Shelter Name</Label>
                <Input
                  id="shelter_name"
                  value={formData.shelter_name}
                  onChange={(e) => setFormData({ ...formData, shelter_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="vaccinated">Vaccinated</Label>
            <Switch
              id="vaccinated"
              checked={formData.vaccinated}
              onCheckedChange={(checked) => setFormData({ ...formData, vaccinated: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="neutered">Neutered/Spayed</Label>
            <Switch
              id="neutered"
              checked={formData.neutered}
              onCheckedChange={(checked) => setFormData({ ...formData, neutered: checked })}
            />
          </div>

          {!isShelter && (
            <div className="flex items-center justify-between">
              <Label htmlFor="adoption">List for Adoption</Label>
              <Switch
                id="adoption"
                checked={formData.is_for_adoption}
                onCheckedChange={(checked) => setFormData({ ...formData, is_for_adoption: checked })}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.species}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
