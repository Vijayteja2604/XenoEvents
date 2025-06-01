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
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";

interface ContactPerson {
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
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^\d{10}$/.test(phone);
  };

  const handleContactChange = (
    index: number,
    field: keyof ContactPerson,
    value: string
  ) => {
    const newContacts = [...contacts];

    if (field === "phone" && value) {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly !== value) {
        toast.error("Phone number can only contain digits");
        return;
      }
    }

    newContacts[index] = {
      ...newContacts[index],
      [field]: value,
    };
    onContactsChange(newContacts);
  };

  const handleAddContact = () => {
    if (contacts.length < 4) {
      onContactsChange([
        ...contacts,
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
    onContactsChange(contacts.filter((c) => c.id !== id));
  };

  const validateContacts = () => {
    let isValid = true;
    let errorMessage = "";

    // Check if at least one contact has name and email
    const hasValidContact = contacts.some((c) => c.name && c.email);
    if (!hasValidContact) {
      errorMessage = "At least one contact must have a name and email";
      isValid = false;
    }

    // Validate each filled contact
    contacts.forEach((contact, index) => {
      if (contact.name || contact.email || contact.phone) {
        if (!contact.name) {
          errorMessage = `Contact ${index + 1}: Name is required`;
          isValid = false;
        }
        if (!contact.email) {
          errorMessage = `Contact ${index + 1}: Email is required`;
          isValid = false;
        } else if (!validateEmail(contact.email)) {
          errorMessage = `Contact ${index + 1}: Invalid email format`;
          isValid = false;
        }
        if (contact.phone && !validatePhone(contact.phone)) {
          errorMessage = `Contact ${index + 1}: Phone number must be 10 digits`;
          isValid = false;
        }
      }
    });

    if (!isValid) {
      toast.error(errorMessage);
    }
    return isValid;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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

          {contacts.map((contact, index) => (
            <div key={contact.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="tracking-tighter">
                  Contact Person {index + 1}
                </Label>
                {contacts.length > 1 && (
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
                  className="h-9 text-xs shadow-none placeholder:text-xs sm:text-sm sm:placeholder:text-sm"
                  placeholder="Name *"
                  value={contact.name}
                  onChange={(e) =>
                    handleContactChange(index, "name", e.target.value)
                  }
                  maxLength={120}
                />
                <Input
                  className="h-9 text-xs shadow-none placeholder:text-xs sm:text-sm sm:placeholder:text-sm"
                  type="email"
                  placeholder="Email *"
                  value={contact.email}
                  onChange={(e) =>
                    handleContactChange(index, "email", e.target.value)
                  }
                  maxLength={120}
                />
                <div className="space-y-2">
                  <div className="flex rounded-lg">
                    <span className="inline-flex items-center rounded-s-lg border border-input px-2.5 text-sm text-muted-foreground bg-gray-100">
                      +91
                    </span>
                    <Input
                      className="h-9 text-xs shadow-none placeholder:text-xs sm:text-sm sm:placeholder:text-sm -ms-px rounded-s-none"
                      type="tel"
                      placeholder="Phone"
                      value={contact.phone}
                      onChange={(e) =>
                        handleContactChange(index, "phone", e.target.value)
                      }
                      minLength={10}
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {contacts.length < 4 && (
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full"
              onClick={handleAddContact}
            >
              Add Another Contact
            </Button>
          )}

          <div className="flex items-center justify-between space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (validateContacts()) {
                  onOpenChange(false);
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
