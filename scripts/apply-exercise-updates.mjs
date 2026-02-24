#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  try {
    const envFile = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) SERVICE_KEY = match[1].trim();
  } catch {}
}

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or as environment variable.');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

// Renames (only where display name actually changed)
const renames = [
  { id: "1b2046e8-9295-4ba3-907e-8d73e5459b27", display_name: "Single Arm Row (Dumbbell)" },
  { id: "7ae9c6c4-f8f4-4042-89ce-14ab109fb5a0", display_name: "Standing Face Pull" },
  { id: "b3cfe89d-ee51-47fe-9055-31f559e54b25", display_name: "Single Arm Front Raise (Cable)" },
  { id: "5ef11525-d2e2-4b67-9d36-5375a2a4d63e", display_name: "Incline Front Raise (Dumbbell)" },
  { id: "c2b970b6-dc6d-4a41-bb1f-84c798813954", display_name: "Shoulder Press (Kettlebell)" },
  { id: "bd3aadac-3075-4b1f-8bfe-06a23787f0b9", display_name: "Kneeling Face Pull" },
  { id: "ed303030-6c10-4fa1-8f29-4627480c2dcf", display_name: "Front Raise (Plate)" },
  { id: "eb200ebc-2d57-4acc-85fb-6edc7f01f4c9", display_name: "Shoulder Press (Machine)" },
  { id: "71d8c39d-3173-49a9-ba19-b396d47dacd9", display_name: "Push Press (Dumbbell)" },
  { id: "eee105bd-86c7-4039-963e-476d0c022135", display_name: "Monkey Shrug (Dumbbell)" },
  { id: "1d101c97-2473-4398-934f-9ff45a50f575", display_name: "Seated Lateral Raise (Dumbbell)" },
  { id: "bc57a92a-9b5a-414b-a4f9-4861de313629", display_name: "Seated Shoulder Press (Dumbbell)" },
  { id: "97c23981-8db1-48d1-a32d-eee85eb18785", display_name: "Single Arm Seated Press (Dumbbell)" },
  { id: "36712316-9f74-4f78-b688-3b655cef7df7", display_name: "Standing Shoulder Press (Dumbbell)" },
  { id: "4ac526ec-20d8-419c-8c8d-1ce87d9d1a0f", display_name: "Face Pull (Band)" },
  { id: "117d202d-618c-4727-913b-8e2f39210b05", display_name: "Chest Supported Reverse Fly (Dumbbell)" },
];

// Binned exercises to delete
const binned = [
  "4965bb81-263c-4b22-940f-465350325a0e",
  "d7e69984-886d-4f66-92b7-e9d50e4bd60b",
  "19074f00-ceab-4366-a222-7c7036c4532f",
  "32f0ab63-61d0-47f2-91ab-756a5fa3c0e7",
  "b7742a07-849b-4683-bbac-cfaeda3b2828",
  "4fd17fc4-a2d4-40e8-b2ae-a8c3118588ca",
  "1a72ac15-03a5-4e19-84e9-2232b7bfa6e4",
  "6ea5010e-7d1f-41e3-b76a-94549cd2e2f3",
  "ee16a75d-7a61-4a52-90c7-d394c859efdb",
  "3ac88c5e-a95c-4fe4-bd37-e2a768c19062",
  "104769bc-36be-424c-8fd0-509dc1491224",
  "b107141e-ce2e-4998-b978-d52f97e785c0",
  "7f352ef2-1503-40d9-8a57-566126ceed48",
  "aa5fe9ab-7feb-4b75-94b9-2a94f725b894",
  "e582a5af-cc9c-4422-8b98-9620a6f6a167",
  "ffe4eb9c-0ed1-4de0-9af5-0f7cca9a3ec6",
  "ebcefe2b-c7b8-4053-9321-20e0a5d3d9b8",
  "082c0cb2-6aa0-4454-a0a3-fff0c5258f8d",
  "44b9c32e-bdaf-44fd-8f6f-8569e29f155a",
  "89df000d-49b5-4d74-9706-af069b3e55a3",
  "058a77a5-80d5-44c5-be1a-3b60266e3365",
  "579b971b-6799-486d-a04d-fff8453d1768",
  "946f827d-9f6b-4599-b0e2-b1a55441ec4d",
  "cd681207-6e9a-480b-ab72-4dc03e6c1230",
  "2f56edeb-3759-4c29-8648-cb1f5cde905a",
  "b97ce5d8-5dac-49cb-ac62-11b751b7fb2f",
  "923a42f0-5476-4b4c-abd2-35dd11a62019",
  "a96d96c3-0d89-4858-ba49-0f98b5059c95",
  "c09832a7-4427-407e-b978-1c41ad95db1c",
  "f9dbbc17-2a21-4488-a062-d717e36adcab",
  "7a450a0d-856a-4b89-9474-d8723f855a30",
  "570969f5-7d67-46d7-8e81-94de78442203",
  "4fbefb0b-4196-4e13-86e4-ec67d07c2ff3",
  "1a292cd7-5bfb-4bae-ac01-da1946e3748f",
  "19fbf784-339e-4ecb-b66d-1f8082ba48c3",
  "3ef52bd8-0316-4d9b-bfd5-ce21eb8c21a6",
  "4d25c9b7-75ee-4b06-a8b7-3a2261617c7d",
  "5273baf1-f084-45e3-82f4-4dcd8266a107",
  "eb1cdbb3-2c8e-407d-a0a3-e66631c579eb",
  "06c304f5-17ce-4f69-94d7-37c39d7ae30d",
  "93bbe248-2c57-4f24-9868-e2c7e60a477c",
  "616f8ad5-69f3-4228-a44b-1ac4378eac79",
  "49426d5e-57e0-45cb-9731-bac8179db54e",
  "abe304f6-56de-4cd1-b2ec-620667297813",
  "237e95d9-c7f5-4254-8fdb-0e1368bc2536",
  "d768df3e-5270-456d-bc41-e09ac8527653",
  "61fed239-1d2b-4121-893e-7ff6693ed528",
  "b34b004d-d7bc-498f-bafb-3c9779ce2038",
  "8d0568f5-3314-4223-800d-cb79a16c473c",
  "f4bbae11-b063-4c74-b8bc-f588862ac846",
  "91f598f7-da33-4637-821b-059b7923ff06",
  "10e47efd-6b6f-439e-92cc-4f03ccf42919",
  "6058f2b6-0e7b-4635-9b72-303816d6bba2",
  "7492df11-e231-4a7f-8db7-eb403d2389f3",
  "50a62863-4efb-4b89-b303-81e6ccbeb01a",
  "7afa373e-785e-40ff-bd8a-4cc2fb249293",
  "bb2e6716-154f-4064-887d-b62bdf5aad73",
  "a1ade56b-0c2a-4c08-a5fe-7b6fad9795bb",
];

async function run() {
  // --- Renames ---
  console.log(`\nRenaming ${renames.length} exercises...`);
  let renameSuccess = 0;
  let renameFailed = 0;

  for (const change of renames) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=eq.${change.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ display_name: change.display_name }),
      });
      if (resp.ok) {
        renameSuccess++;
        console.log(`  ✓ ${change.display_name}`);
      } else {
        renameFailed++;
        const text = await resp.text();
        console.log(`  ✗ ${change.display_name}: ${resp.status} ${text}`);
      }
    } catch (err) {
      renameFailed++;
      console.log(`  ✗ ${change.display_name}: ${err.message}`);
    }
  }
  console.log(`Renames: ${renameSuccess} updated, ${renameFailed} failed.\n`);

  // --- Deletes ---
  console.log(`Deleting ${binned.length} binned exercises...`);
  const BATCH_SIZE = 20;
  let deleted = 0;

  for (let i = 0; i < binned.length; i += BATCH_SIZE) {
    const batch = binned.slice(i, i + BATCH_SIZE);
    const ids = batch.map(id => `"${id}"`).join(',');
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=in.(${ids})`, {
        method: 'DELETE',
        headers,
      });
      if (resp.ok) {
        deleted += batch.length;
        console.log(`  Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} exercises`);
      } else {
        const text = await resp.text();
        console.log(`  ERROR batch ${Math.floor(i / BATCH_SIZE) + 1}: ${resp.status} ${text}`);
      }
    } catch (err) {
      console.log(`  ERROR batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
    }
  }
  console.log(`\nDone! ${renameSuccess} renamed, ${deleted} deleted.`);
}

run().catch(console.error);
