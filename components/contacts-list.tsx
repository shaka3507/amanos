"use client"

import { Phone, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  relationship: string
}

interface ContactsListProps {
  contacts: Contact[] | null
}

export function ContactsList({ contacts }: ContactsListProps) {
  const handleEditContact = (contactId: string) => {
    document.dispatchEvent(new CustomEvent('edit-contact', { 
      detail: { contactId }
    }));
  }

  const handleDeleteContact = (contactId: string) => {
    document.dispatchEvent(new CustomEvent('delete-contact', { 
      detail: { contactId }
    }));
  }

  return (
    <div className="space-y-4">
      {contacts && contacts.length > 0 ? (
        contacts.map((contact) => (
          <div 
            key={contact.id} 
            className="p-4 border-2 border-black flex items-start justify-between hover:bg-blue-50 cursor-pointer"
            onClick={() => handleEditContact(contact.id)}
          >
            <div>
              <div className="font-medium">{contact.name}</div>
              <div className="text-sm text-muted-foreground">{contact.relationship}</div>
              <div className="text-sm text-muted-foreground">{contact.phone}</div>
              <div className="text-sm text-muted-foreground">{contact.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-blue-500 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditContact(contact.id);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteContact(contact.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <Phone className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">0 emergency contacts</p>
          <p className="text-sm mt-1">Add contacts using the form on the left</p>
        </div>
      )}
    </div>
  );
} 