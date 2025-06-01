import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect } from "react";

interface ContactPerson {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface LocalContactPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ContactDialogProps {
  isOpen: boolean;
  contacts: ContactPerson[];
  onOpenChange: (open: boolean) => void;
  onContactsChange: (contacts: ContactPerson[]) => void;
}

export default function ContactDialog({
  isOpen,
  contacts,
  onOpenChange,
  onContactsChange,
}: ContactDialogProps) {
  const [localContacts, setLocalContacts] = useState<LocalContactPerson[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    if (isOpen) {
      setLocalContacts(
        contacts.length
          ? contacts.map((contact) => ({
              ...contact,
              phone: contact.phone || "",
            }))
          : [
              {
                id: Math.random().toString(),
                name: "",
                email: "",
                phone: "",
              },
            ]
      );
    }
  }, [isOpen, contacts]);

  const handleContactChange = (
    index: number,
    field: keyof LocalContactPerson,
    value: string
  ) => {
    const newContacts = [...localContacts];
    newContacts[index] = {
      ...newContacts[index],
      [field]: value,
    };
    setLocalContacts(newContacts);
  };

  const handleAddContact = () => {
    if (localContacts.length < 4) {
      setLocalContacts([
        ...localContacts,
        {
          id: Math.random().toString(),
          name: "",
          email: "",
          phone: "",
        },
      ]);
    }
  };

  const handleRemoveContact = (id: string) => {
    setLocalContacts(localContacts.filter((c) => c.id !== id));
  };

  const validateContacts = () => {
    const newErrors: { [key: string]: string[] } = {};

    localContacts.forEach((contact, index) => {
      if (!contact.name.trim()) {
        newErrors[`${index}-name`] = ["Name is required"];
      }
      if (!contact.email.trim()) {
        newErrors[`${index}-email`] = ["Email is required"];
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        newErrors[`${index}-email`] = ["Invalid email format"];
      }
      // Phone is now optional
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateContacts()) {
      const validContacts = localContacts
        .filter((contact) => contact.name.trim() && contact.email.trim())
        .map((contact) => ({
          ...contact,
          phone: contact.phone.trim() || null,
        }));
      onContactsChange(validContacts);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="top-[50%] mx-auto max-w-xs translate-y-[-50%] rounded-xl bg-[#F9F9F8] sm:max-w-sm [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center">Contact Details</DialogTitle>
          <DialogDescription hidden>
            Enter the contact details for your event
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
          <p className="text-xs text-muted-foreground">
            Add up to 4 contact persons for the event (min 1).
          </p>

          {localContacts.map((contact, index) => (
            <div key={contact.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="tracking-tighter">
                  Contact Person {index + 1}
                </Label>
                {localContacts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContact(contact.id)}
                  >
                    <Trash2Icon className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid gap-2">
                <Input
                  className={`h-8 text-xs shadow-none placeholder:text-xs sm:h-10 sm:text-sm sm:placeholder:text-sm ${
                    errors[`${index}-name`] ? "border-destructive" : ""
                  }`}
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) =>
                    handleContactChange(index, "name", e.target.value)
                  }
                />
                {errors[`${index}-name`] && (
                  <p className="text-xs text-destructive">
                    {errors[`${index}-name`][0]}
                  </p>
                )}
                <Input
                  className={`h-8 text-xs shadow-none placeholder:text-xs sm:h-10 sm:text-sm sm:placeholder:text-sm ${
                    errors[`${index}-email`] ? "border-destructive" : ""
                  }`}
                  placeholder="Email"
                  type="email"
                  value={contact.email}
                  onChange={(e) =>
                    handleContactChange(index, "email", e.target.value)
                  }
                />
                {errors[`${index}-email`] && (
                  <p className="text-xs text-destructive">
                    {errors[`${index}-email`][0]}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex rounded-lg">
                    <span className="inline-flex items-center rounded-s-lg border border-input px-2.5 text-sm text-muted-foreground bg-gray-100">
                      +91
                    </span>
                    <Input
                      className={`h-8 text-xs shadow-none border-l-0 rounded-l-none placeholder:text-xs sm:h-10 sm:text-sm sm:placeholder:text-sm ${
                        errors[`${index}-phone`] ? "border-destructive" : ""
                      }`}
                      placeholder="Phone"
                      type="tel"
                      value={contact.phone}
                      onChange={(e) =>
                        handleContactChange(index, "phone", e.target.value)
                      }
                      minLength={10}
                      maxLength={10}
                    />
                  </div>
                </div>

                {errors[`${index}-phone`] && (
                  <p className="text-xs text-destructive">
                    {errors[`${index}-phone`][0]}
                  </p>
                )}
              </div>
            </div>
          ))}

          {localContacts.length < 4 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddContact}
                className="flex-1"
              >
                <PlusIcon className="-mr-1 h-4 w-4" />
                Contact Person
              </Button>
              <Button size="sm" onClick={handleSave} className="flex-1">
                Save
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
