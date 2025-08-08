import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get contact information for help and support
export async function GET(request) {
  try {
    // Fetch active PHC office admin data
    const contactData = await query(`
      SELECT 
        id,
        office_name,
        phone,
        email,
        address,
        city,
        postal_code,
        contact_person,
        is_active,
        created_at,
        updated_at
      FROM phc_office_admin 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC
    `);

    // Format the response for mobile app
    const formattedContacts = contactData.map(contact => ({
      id: contact.id,
      officeName: contact.office_name,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      city: contact.city,
      postalCode: contact.postal_code,
      contactPerson: contact.contact_person,
      isActive: contact.is_active,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at
    }));

    // Get primary contact (first active contact)
    const primaryContact = formattedContacts.length > 0 ? formattedContacts[0] : null;

    // Prepare contact methods for mobile app
    const contactMethods = [];
    
    if (primaryContact) {
      // WhatsApp contact
      if (primaryContact.phone) {
        contactMethods.push({
          id: "whatsapp",
          title: "WhatsApp Support",
          subtitle: "Chat langsung dengan tim support",
          icon: "whatsapp",
          color: "#25D366",
          value: primaryContact.phone,
          action: "whatsapp"
        });
      }

      // Email contact
      if (primaryContact.email) {
        contactMethods.push({
          id: "email",
          title: "Email Support",
          subtitle: "Kirim email ke tim support",
          icon: "email",
          color: "#EA4335",
          value: primaryContact.email,
          action: "email"
        });
      }

      // Phone contact
      if (primaryContact.phone) {
        contactMethods.push({
          id: "phone",
          title: "Telepon Support",
          subtitle: "Hubungi via telepon",
          icon: "phone",
          color: "#10B981",
          value: primaryContact.phone,
          action: "phone"
        });
      }
    }

    // Default contact methods if no data from database
    if (contactMethods.length === 0) {
      contactMethods.push(
        {
          id: "whatsapp",
          title: "WhatsApp Support",
          subtitle: "Chat langsung dengan tim support",
          icon: "whatsapp",
          color: "#25D366",
          value: "+62-21-12345678",
          action: "whatsapp"
        },
        {
          id: "email",
          title: "Email Support",
          subtitle: "Kirim email ke tim support",
          icon: "email",
          color: "#EA4335",
          value: "admin@phc.com",
          action: "email"
        },
        {
          id: "phone",
          title: "Telepon Support",
          subtitle: "Hubungi via telepon",
          icon: "phone",
          color: "#10B981",
          value: "+62-21-12345678",
          action: "phone"
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        contacts: formattedContacts,
        primaryContact,
        contactMethods,
        supportHours: {
          customerService: "24/7 (Setiap Hari)",
          bookingHours: "Senin - Jumat: 08:00 - 20:00",
          emergency: "24/7 (Darurat Medis)"
        }
      }
    });
  } catch (error) {
    console.error("Error fetching contact information:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil informasi kontak",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
