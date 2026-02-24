const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZ3BzYWJ5cXN1dW5hanRvdGNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzMzI4OCwiZXhwIjoyMDg0MTA5Mjg4fQ.gt74y6Rn60O0TY_WVFAQk_MfI4A95ADamGQ28Ee0_AY";

// Get ALL exercises and count how many have a display_name set (meaning they were renamed)
const resp = await fetch("https://dngpsabyqsuunajtotci.supabase.co/rest/v1/exercises?select=id,name,display_name&order=display_name.asc&limit=1000", {
  headers: { "apikey": SERVICE_KEY, "Authorization": "Bearer " + SERVICE_KEY }
});
const data = await resp.json();

const total = data.length;
const withDisplayName = data.filter(e => e.display_name && e.display_name !== e.name);
console.log(`Total exercises: ${total}`);
console.log(`With custom display_name: ${withDisplayName.length}`);
console.log(`\nAll renamed exercises:`);
withDisplayName.forEach(e => console.log(`  ${e.name} -> ${e.display_name}`));
