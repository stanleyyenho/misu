import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { loadContactsPageData } from "@/lib/loaders/contacts";
import { ContactsClient } from "@/components/ContactsClient";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { contacts, groups } = await loadContactsPageData(user.id);

  // Match the JSON shape served by /api/contacts and /api/groups so SWR's
  // fallbackData is structurally identical to revalidation responses.
  const initialContacts = JSON.parse(JSON.stringify(contacts));
  const initialGroups = JSON.parse(JSON.stringify(groups));

  return (
    <ContactsClient initialContacts={initialContacts} initialGroups={initialGroups} />
  );
}
