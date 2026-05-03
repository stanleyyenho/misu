import vCard from "vcf";

export interface ParsedContact {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export function parseVcf(content: string): ParsedContact[] {
  const cards = vCard(content);
  const contacts: ParsedContact[] = [];

  for (const card of cards) {
    const nameField = card.get("n");
    const fnField = card.get("fn");
    const emailField = card.get("email");
    const telField = card.get("tel");
    const photoField = card.get("photo");

    let firstName = "";
    let lastName: string | undefined;

    if (nameField) {
      const nameParts = Array.isArray(nameField)
        ? nameField[0].valueOf()
        : nameField.valueOf();
      if (typeof nameParts === "string") {
        const parts = nameParts.split(";");
        lastName = parts[0]?.trim() || undefined;
        firstName = parts[1]?.trim() || "";
      }
    }

    if (!firstName && fnField) {
      const fullName = Array.isArray(fnField)
        ? fnField[0].valueOf()
        : fnField.valueOf();
      if (typeof fullName === "string") {
        const parts = fullName.trim().split(" ");
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || undefined;
      }
    }

    if (!firstName) continue;

    let email: string | undefined;
    if (emailField) {
      const emailVal = Array.isArray(emailField)
        ? emailField[0].valueOf()
        : emailField.valueOf();
      if (typeof emailVal === "string") email = emailVal.trim();
    }

    let phone: string | undefined;
    if (telField) {
      const telVal = Array.isArray(telField)
        ? telField[0].valueOf()
        : telField.valueOf();
      if (typeof telVal === "string") phone = telVal.trim();
    }

    let avatarUrl: string | undefined;
    if (photoField) {
      const photoVal = Array.isArray(photoField)
        ? photoField[0]
        : photoField;
      const encoding = photoVal.params?.encoding?.toLowerCase();
      const mediaType = photoVal.params?.type?.toLowerCase() || "jpeg";
      const value = photoVal.valueOf();
      if (encoding === "b" && typeof value === "string") {
        avatarUrl = `data:image/${mediaType};base64,${value}`;
      } else if (typeof value === "string" && value.startsWith("http")) {
        avatarUrl = value;
      }
    }

    contacts.push({ firstName, lastName, email, phone, avatarUrl });
  }

  return contacts;
}
