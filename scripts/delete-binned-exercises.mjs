/**
 * Delete exercises marked as "bin" from the library review CSV.
 *
 * Usage:
 *   node scripts/delete-binned-exercises.mjs --preview   # Show what would be deleted
 *   node scripts/delete-binned-exercises.mjs --apply      # Actually delete from Supabase
 */

import fs from 'fs';
import path from 'path';

// ---------- Config ----------
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dngpsabyqsuunajtotci.supabase.co';
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

const mode = process.argv[2];
if (!mode || !['--preview', '--apply'].includes(mode)) {
  console.error('Usage: node scripts/delete-binned-exercises.mjs [--preview | --apply]');
  process.exit(1);
}

const DRY_RUN = mode === '--preview';

// ---------- Helpers ----------
const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function supabaseDelete(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const resp = await fetch(url, { method: 'DELETE', headers });
  if (!resp.ok) throw new Error(`DELETE ${table} failed: ${resp.status} ${await resp.text()}`);
}

// ---------- Binned Exercise IDs from CSV review ----------
const BIN_EXERCISES = [
  { id: 'a7386e5a-ca67-48c3-abdc-ef64adc93849', name: 'Ankle Circles' },
  { id: '8360c343-10a9-4771-a62f-e7d696bf5152', name: 'Arnold Press (Dumbbell) [v2 dupe]' },
  { id: 'bac5d781-f47c-4c77-aea5-278ac763169e', name: 'Arnold Press (Kettlebell)' },
  { id: '83238d16-7026-4438-bd1c-f578ec6257ce', name: 'Bent Over Row (Band)' },
  { id: '8a5eaf42-6f15-402d-9aa0-1681625e97f2', name: 'Bicep Curl (Dumbbell) [arm blaster]' },
  { id: 'e79bd173-6294-4a10-92fa-c9366379d93f', name: 'Bicep Curl (Machine)' },
  { id: '5e930a82-3049-46a7-b6d5-f77203d18036', name: 'Biceps Curl (Dumbbell) [dupe]' },
  { id: '749d7a50-2a35-4ad9-8088-6820d766e0fa', name: 'Biceps Curl Squat (Dumbbell)' },
  { id: '39ed7bd0-6065-459a-a7ec-e665333cfdc2', name: 'Biceps Leg Concentration Curl' },
  { id: '70a33aac-dc9d-477e-b75a-14970417ee56', name: 'Biceps Pull Up' },
  { id: '9faca7fe-0941-4968-a46d-1176431ada72', name: 'Bird Dog' },
  { id: 'ff4a1e9b-8980-4d1f-81c6-9f8e9853eb0f', name: 'Bench Dip [knees bent dupe]' },
  { id: '34813806-e68f-41f9-b618-bb6641c47890', name: 'Bench Dip (Weighted)' },
  { id: '9681e8a0-6008-4662-8579-f700dd75317b', name: 'Chest Dip (On Dip Pull Up Cage)' },
  { id: '0a7c57ae-71e9-43a5-b20c-71ba121eb0cb', name: 'Chest Dip (Weighted) [dupe]' },
  { id: '8f3c14bf-59a7-4013-9e68-2a10c76ba5f3', name: 'Butterfly Yoga Pose' },
  { id: '42175f6a-5554-4484-a1da-6536eb807a75', name: 'Calf Press (Machine) [dupe]' },
  { id: '922da834-83f0-475a-a128-144bf2b0ef41', name: 'Chest Supported Y Raise (Dumbbell)' },
  { id: '75072817-f522-451a-b319-a8719bff074b', name: 'Chin Ups (Narrow Parallel Grip)' },
  { id: 'fa29f1a1-84bf-45e6-ab23-7c9b2e0c472d', name: 'Clamshell' },
  { id: 'cf7d8286-0e8c-4f44-b53a-d2600d4cc9b7', name: 'Crunch Floor [dupe]' },
  { id: '8c7b0823-bb8b-4457-88c2-65228f528047', name: 'Cross Body Hammer Curl [dupe]' },
  { id: '84d45451-15dd-4492-9365-edd4c3c38f9a', name: 'Diamond Push Up [dupe]' },
  { id: 'f0199a7c-41f8-42b9-bdc1-0c2b2b733c1d', name: 'Dragon Flag [dupe]' },
  { id: '4d10fc69-3f84-4361-b758-bfd984dbed71', name: 'Decline Bent Arm Pullover (Barbell)' },
  { id: 'dbb35e92-89d6-49a6-8623-701f1bfb183b', name: 'Decline Close Grip Bench Press (Smith Machine)' },
  { id: 'deb1e82f-979e-4d58-8876-b3cfb7e9182b', name: 'Decline Crunch (Weighted)' },
  { id: '0375e8fb-bf69-44c7-9607-4640fa5958b8', name: 'Decline One Arm Fly (Dumbbell)' },
  { id: '48bc1fe3-9f2d-45b4-be13-db9d51dd6e97', name: 'Decline Pullover (Barbell)' },
  { id: '548047b6-126a-4b3d-90e1-7f5ea3aadd67', name: 'Decline Push Up [dupe]' },
  { id: '5b305f0c-a27a-403a-9e4d-134375dd635b', name: 'Decline Shrug (Dumbbell)' },
  { id: '4dbd2234-48fe-41ab-96b1-4ac56cb6e45b', name: 'Decline Bench Press (Smith Machine) [wide grip dupe]' },
  { id: '47d30fe4-495f-412a-9caa-b673b80c5c04', name: 'Deadlift High Pull' },
  { id: '5028b973-9025-4438-a996-091ab42db8f8', name: 'Elbow to Knee [lying dupe]' },
  { id: '4860ae96-d980-4136-ad55-b163ac15b747', name: 'Front Raise (Dumbbell) [v2 dupe]' },
  { id: '5682932b-2979-4666-8d22-2833b77af7f3', name: 'Front Squat [bench dupe]' },
  { id: '4b61a50c-98d7-45bb-ac8e-36dd4271d45c', name: 'Front Lever Hold' },
  { id: 'a8e13717-3aae-42ba-af46-8c2c14eb4f09', name: 'Front Lever Raise' },
  { id: '51895146-a82f-428e-9502-e75683b69e2b', name: 'Fixed Back Close Grip Pulldown (Band)' },
  { id: 'dda55d36-1603-4721-93d4-e0e9e2374c2e', name: 'Fixed Back Underhand Pulldown (Band)' },
  { id: '5283a659-a3b0-4fb0-81c1-f819a8c3901b', name: 'Frog Jumps' },
  { id: '437b5beb-7aee-482c-832c-174ad3d31ca7', name: 'Glute Bridge [b stance dupe]' },
  { id: '59cdb67a-e084-4b0a-a77b-808b1601ecea', name: 'Glute Bridge (Barbell) [dupe]' },
  { id: '7fb45b72-fa2e-4eb5-a068-dd21522eee01', name: 'Glute Bridge March [dupe]' },
  { id: '544c6e01-90d3-4291-af08-d90d12e0a7c0', name: 'Hack Squat (Barbell) [dupe]' },
  { id: '45d93c15-2335-49c6-b408-71dba7181840', name: 'Hack Squat (Smith Machine)' },
  { id: '185b5363-a31a-4fe8-a162-d8b4185fd485', name: 'Half Sit Up' },
  { id: '02943f11-91d9-4f6a-8a68-149bcada2471', name: 'High Bar Squat (Barbell) [dupe]' },
  { id: '0e4eb64e-3664-469b-8d36-21ca25dc83c6', name: 'High Knees [half knee bends]' },
  { id: '5b7d95b2-a08c-4a79-8929-75038ee6f394', name: 'Hands Clasped Circular Toe Touch' },
  { id: 'a98bcffc-0241-47fc-a4cb-c684d57f1287', name: 'Hiking' },
  { id: 'f662bc71-22d3-4df5-af41-9faf81585f8f', name: 'Hanging Leg Raise [dupe]' },
  { id: 'ad4dd70b-fcb0-4bc2-9f37-46333ef52a02', name: 'Incline Curl (Dumbbell) [dupe]' },
  { id: 'ea58a82a-dda9-4d60-a4dd-b17fe46745e8', name: 'Incline Twisting Sit Up' },
  { id: '7f478531-0b9e-4462-a581-c294d25b7ca3', name: 'Incline Shoulder Raise (Barbell)' },
  { id: '3aa97268-466f-4d8b-91db-d8a98a86a05d', name: 'Incline Shoulder Raise (Dumbbell)' },
  { id: 'ec9d8e86-ec6f-416b-8fa6-16b88afedffe', name: 'Incline Shoulder Raises (Smith Machine)' },
  { id: 'f0dd23d9-3db5-48cc-81f7-86b0ecb6d43b', name: 'Iso Lateral Low Row [cable dupe]' },
  { id: 'ca39b1f8-abeb-4bb2-961f-367759aa8500', name: 'Jackknife Sit Up (Band) [dupe]' },
  { id: '9f17b5b3-a7f2-4d1f-adb4-997ed3a2f6a5', name: 'Janda Sit Up' },
  { id: '1bf0046c-83d2-4c59-8379-8f7f3f192a67', name: 'Jefferson Squat (Barbell)' },
  { id: 'd92204ac-4b4d-4604-8250-dde10919cfd4', name: 'Jump Squat [dupe]' },
  { id: '0f2ccdc4-d283-41f4-ba22-3c7bbc2c9a22', name: 'Jump Squat (Barbell)' },
  { id: '5edc189e-da82-4ada-951a-bef632a99a9d', name: 'Jumping Jack [star jump]' },
  { id: 'b239c0ae-cbc6-4738-9a49-acecb1bb93e1', name: 'Jumping Lunge' },
  { id: '6e006513-b111-4011-b9a6-d56034fe8954', name: 'Kas Glute Bridge (Barbell)' },
  { id: 'a67060f0-923e-4ae1-90fb-fe913358894d', name: 'Kneeling One Arm Pulldown (Band)' },
  { id: 'eda1c168-e127-4566-ad37-fc4f2ed91be8', name: 'Lat Pulldown (Band) [close grip dupe]' },
  { id: 'aedcf336-018f-4987-9446-36eea720d1c0', name: 'Landmine 180' },
  { id: 'c19bde76-7cab-4691-bc98-93d2bb87a0e8', name: 'Low Bar Squat (Barbell)' },
  { id: '25fa623c-95e5-469b-9d35-677965662f6d', name: 'Low Bar Squat (Smith Machine)' },
  { id: 'a0360786-9d89-4957-b227-6a51e0b50962', name: 'Lateral Squat' },
  { id: 'e4d3c6ec-1445-4451-bf61-14b804e4dcef', name: 'Lying Two One Leg Curl (Machine)' },
  { id: '16c3e7ec-5282-49a3-a700-ba750b64d018', name: 'Machine Hip Thrust (Machine) [dupe]' },
  { id: '10f99253-0b96-411b-8685-d216ff4a077d', name: 'Meadows Rows (Barbell)' },
  { id: 'ab2ced41-696c-43b7-b9dc-51ae5495f4e9', name: 'Mixed Grip Chin Up' },
  { id: '2adb6753-70b4-498f-bbbb-0542b6e1526f', name: 'Modified Hindu Push Up' },
  { id: '7bebea79-0fc2-47b3-8361-fea15520207e', name: 'Modified Push Up to Lower Arms' },
  { id: '995cb247-af20-481c-bb3e-f0fecfff78f5', name: 'Muscle Up [dupe]' },
  { id: '0a1cabfe-ed42-4ff9-9dba-4666ec507bfc', name: 'Muscle Up (Weighted) [dupe]' },
  { id: '73375eeb-91be-46da-9480-3a51186ec98b', name: 'Narrow Stance Squat (Barbell)' },
  { id: '493e19e3-1fc9-41b8-93d8-30d558b9324f', name: 'Neutral Grip Bench Press (Dumbbell)' },
  { id: '084b2590-88b9-4441-8922-5a9ca2e9dca7', name: 'One Arm Jerk (Kettlebell)' },
  { id: '8a5cfdfa-c425-4d99-a4fa-bc4f25c3c406', name: 'One Arm Preacher Curl (Cable)' },
  { id: 'd576837d-cf53-4a6b-b577-258f65b57bd0', name: 'One Arm Reverse Preacher Curl (Cable)' },
  { id: '61ca8d3c-9f7b-423a-b135-e883c1aed8c8', name: 'One Arm Row (Smith Machine)' },
  { id: 'c24a6a2c-f8a5-41b4-beb8-8f0034d7fff7', name: 'One Arm Single Leg Split Squat (Band)' },
  { id: 'c56af4d0-e69c-4647-820a-c406c6458794', name: 'One Arm Standing Low Row (Band)' },
  { id: '2955b9c1-722c-47e5-9200-a44aa0804b15', name: 'One Arm Towel Row' },
  { id: '71139cf3-87ba-4dfa-bcb2-36b20964ab1a', name: 'Outside Leg Kick Push Up' },
  { id: 'a9726fd5-a140-4498-8524-8dd17f40c570', name: 'Lying Extension (Across Face)' },
  { id: 'be251161-126b-4c41-9f09-44d26104dca0', name: 'Partial Glute Bridge (Barbell)' },
  { id: 'fde7ab36-9246-4ba1-9339-209fe9e05d57', name: 'Pike to Cobra Push Up' },
  { id: '0fcc1e0d-a42f-47b4-a021-a99bf7875771', name: 'Plank Pushup' },
  { id: '72530d96-156a-4ef0-8f99-94c93b347001', name: 'Plyo Squat (Dumbbell)' },
  { id: '55432294-ef30-436e-9ad4-adde70927edf', name: 'Posterior Step to Overhead Reach' },
  { id: '8fb289c0-e961-40f7-8c0d-0d7193a0c50b', name: 'Preacher Hammer Curl (Dumbbell)' },
  { id: 'e05030be-b79b-48b9-819a-be5020fa31fd', name: 'Prisoner Half Sit Up' },
  { id: '64b5d93a-e834-448e-8acb-b7997ea73508', name: 'Pulldown Bicep Curl (Cable)' },
  { id: '6f9b6ecb-968f-4d58-9c89-b58ee22a363b', name: 'Pullover to Press (Barbell)' },
  { id: '9169cf08-fd73-4ab6-a608-6fc9a66bfa61', name: 'Raise Single Arm Push Up' },
  { id: '1e19d8e0-8aca-4f47-b860-4123681b991b', name: 'Reverse Fly Single Arm (Cable)' },
  { id: '9d4c0160-d8a0-406f-ac55-1544e11f7ae9', name: 'Ring Pull Up' },
  { id: '87809948-99cd-4d8b-9862-9b9788c12d3d', name: 'Seated Bent Over Kickback (Dumbbell)' },
  { id: '1d7b413a-b86d-4fb7-b6f8-19d525e4e101', name: 'Seated Inner Biceps Curl (Dumbbell)' },
  { id: '1e23ac83-c1ae-46ac-b955-10c9c2f5c6dd', name: 'Seated Kickback (Dumbbell)' },
  { id: 'd4d5988a-6ec2-4526-ae56-906c6eb7c504', name: 'Seated Overhead Curl (Cable)' },
  { id: 'd4bdfb20-4513-4a12-822d-83fb8bb63d5d', name: 'Seated Rear Lateral Raise (Cable)' },
  { id: '394a4144-98e4-438a-a225-ec4906813de4', name: 'Scapula Dips' },
  { id: '84532fa8-8799-4acd-a32c-c7526bdcf2bd', name: 'Squat (Band)' },
  { id: '5d39cb62-421e-4a57-a500-ead071eeecce', name: 'Squat (Dumbbell) [dupe]' },
  { id: '0f4308f3-425b-4000-9940-ec94071f28a1', name: 'Squat (Weighted)' },
  { id: 'b6edaa03-8cbe-4545-9fb3-331a5a155301', name: 'Side Split Squat (Barbell) [dupe]' },
  { id: 'f8867a2a-a9fd-4bd1-856d-84292d267368', name: 'Side Lying Biceps Curl' },
  { id: '6fdd3188-d7ee-4a8f-90dd-cf118da2d9f9', name: 'Side Triceps Extension (Band)' },
  { id: '75591f3f-156a-403a-baaf-d6e816f885b9', name: 'Skater Hops' },
  { id: 'c132b88c-c16e-4435-9a53-c20f4c87b039', name: 'Ski Step' },
  { id: '22c38882-da99-4c8a-bf2c-9a50aef35359', name: 'Skier (Barbell)' },
  { id: '97f4c20c-6c67-463a-bdee-2c99882eab71', name: 'Split Squat (Barbell) [v2 dupe]' },
  { id: 'a3bc73d8-8e1c-45cd-aa80-055a0c34772a', name: 'Split Squat (Dumbbell)' },
  { id: 'b08d8a70-779a-47ee-94c6-fb8ea48f0e8a', name: 'Squat Row (Band)' },
  { id: '7e17c92d-d268-42b1-a3e7-8ea2eddd6a41', name: 'Squat Row (With Rope Attachment)' },
  { id: '5711c664-8d5d-4f00-89fb-a7717796a17e', name: 'Squatting Curl (Cable)' },
  { id: '9293a720-12b0-4215-a347-e555a1636b02', name: 'Squatting Row' },
  { id: '331081ad-a71e-4fe9-a337-1c9594a476d5', name: 'Stair Machine (Floors)' },
  { id: 'c6216307-1239-4ac0-ad7e-5d749335f920', name: 'Standing Back Wrist Curl (Smith Machine)' },
  { id: '63e1cbbc-4b13-4419-ba8e-9f6e8bb8ea66', name: 'Standing Bent Over One Arm Triceps Extension (Dumbbell)' },
  { id: 'e0a43b71-2693-4a8d-b248-cd39d73545ca', name: 'Standing Bent Over Two Arm Triceps Extension (Dumbbell)' },
  { id: '5ef5d8a2-a5e1-4474-9fdb-9c8d6aa60ab7', name: 'Standing Calf Raise (Barbell) [dupe]' },
  { id: '012a2975-4430-42a9-98ee-09dd2c29af87', name: 'Standing Close Grip Curl (Barbell)' },
  { id: '9830d846-ffcd-4402-846e-35c850cb68ad', name: 'Standing Close Grip One Arm Row' },
  { id: 'aa101374-0c17-4995-84e7-2ea3e6029dc0', name: 'Standing Concentration Curl (Barbell)' },
  { id: '2ee9952b-8450-4215-b585-a65bd8d9139d', name: 'Standing Crunch (With Rope Attachment)' },
  { id: 'e7ce066f-3b30-49f1-b353-703f62953034', name: 'Standing Inner Biceps Curl (Dumbbell)' },
  { id: 'a3cd4184-d226-4c5b-9851-8d89d7d818cd', name: 'Standing Inner Curl (Cable)' },
  { id: '1b81f69d-cb89-4224-9964-4abb2daee989', name: 'Standing Kickback (Dumbbell)' },
  { id: '2b016183-18db-4242-9b9b-4ca7a902348d', name: 'Standing Leg Curls' },
  { id: 'c95e78f4-a0dc-4412-a70d-e6e830dbd9af', name: 'Standing Lift (Cable)' },
  { id: 'd0ee5c94-aebf-47c0-9eb2-09a397f0d275', name: 'Standing One Arm Curl (Over Incline Bench)' },
  { id: '23738bf2-ef4d-49c2-ad7e-976276cb91d3', name: 'Standing Pulldown (Cable)' },
  { id: 'd2d1d8f6-5707-49e1-afe5-e4352c6028f0', name: 'Standing Reverse Curl (Dumbbell)' },
  { id: '5f08e64b-16a6-4336-849f-c2a4aa6c1662', name: 'Standing Reverse Grip Curl (Barbell)' },
  { id: '3cafccd4-7978-41a1-8e2f-6bffe0f97b75', name: 'Standing Reverse Grip One Arm Overhead Tricep Extension (Cable)' },
  { id: 'b3e8f5d4-64ca-4d86-99b5-4aae5d66ca71', name: 'Standing Rocking Leg Calf Raise (Barbell)' },
  { id: '27bec349-eaec-403a-ba79-ec44f9c2c32d', name: 'Standing Shoulder External Rotation (Cable)' },
  { id: 'a3ce1454-5c93-4b9c-b9af-2f6e125bc5bb', name: 'Standing Tricep Kickback (Dumbbell)' },
  { id: '9ff18c58-5fe2-4880-a782-c865dd5b0cd3', name: 'Standing Twist (Barbell)' },
  { id: '4323f849-090f-4d75-8d2b-a64d6937c199', name: 'Standing Twist Row (V Bar)' },
  { id: '4d86d295-f7cd-41af-9f03-64017e813a55', name: 'Standing Twisting Crunch (Band)' },
  { id: '278df17a-249e-4b7e-9342-e4c840493157', name: 'Standing Wide Grip Biceps Curl (Barbell)' },
  { id: '3cd7e1fe-eb6b-4db5-a7e0-1a0061c3dbc1', name: 'Standing Wide Grip Curl (Barbell)' },
  { id: '3acc4046-1a09-42ae-b08c-017ea580bd5c', name: 'Standing Zottman Preacher Curl (Dumbbell)' },
  { id: 'e9c9264d-ec8d-41e3-abef-d76314e51721', name: 'Step Up (Band)' },
  { id: 'e73030c3-45b0-43b5-827f-feba29939122', name: 'Step Up Lunge (Dumbbell)' },
  { id: '6c487328-9a12-4246-91ce-461da834dd37', name: 'Step Up Split Squat (Dumbbell)' },
  { id: '40e3a741-c0aa-4ffe-8d82-b057a34806ff', name: 'Straight Back Stiff Leg Deadlift (Band)' },
  { id: 'c9c59abb-278b-4243-ac36-1cc74068be5b', name: 'Straight Leg Deadlift (Band)' },
  { id: '00e7f5b1-6a0a-40aa-a1ea-d1c87042e178', name: 'Straight Leg Deadlift (Dumbbell)' },
  { id: 'f9b02a1d-ed47-45da-a660-ae4aed4f09c9', name: 'Straight Leg Outer Hip Abductor' },
  { id: '81ae8c9c-9003-4cd7-9c02-572f744f1285', name: 'Dumbbell Step Up [bicep curl combo]' },
  { id: 'f27b50ff-800e-41fb-bbe5-5ee89d439507', name: 'Semi Squat Jump' },
  { id: '64fc9742-9a7f-4d7d-a844-5f60a32fae95', name: 'Single Leg Hip Thrust [dupe]' },
  { id: '4bb8465f-9e7b-41e0-8e0a-85df84ce28a5', name: 'Single Leg Platform Slide' },
  { id: '9a136223-6dd2-4851-af6a-b47b5c0a1fbf', name: 'Single Leg Calf Raise (Band)' },
  { id: 'f0500db4-a258-4b8b-88d4-6f8d9e2df7de', name: 'Single Leg Calf Raise (On A Dumbbell)' },
  { id: '19571ca1-0cd4-445b-9234-905a5a780922', name: 'Sissy Squat (Weighted)' },
  { id: 'ef2a9672-aeff-43f0-b459-52c95991b98f', name: 'Sit Up with Arms on Chest' },
  { id: '448fced9-c774-42c9-80db-02766f303ceb', name: 'Sitted Leg Raise (Barbell)' },
  { id: '56dd90d4-3e0d-4454-b3bc-9e1ac52379e5', name: 'Spider Curl (EZ Bar) [dupe]' },
  { id: '4d1dac66-3c91-414a-a129-477180bebf17', name: 'Squat Jump Step Rear Lunge (Barbell)' },
  { id: '567740c1-e604-4111-98c9-d6f5dbdb587a', name: 'Russian Twist (Weighted) [dupe]' },
  { id: '89f98047-bd2c-4500-86ec-9d9fa382aa88', name: 'T Bar Reverse Grip Row (Machine)' },
  { id: '7162606d-2dd3-4e25-9af2-df0ed9f3b67e', name: 'Tate Press (Dumbbell)' },
  { id: '02d561b0-9c8b-47a0-87d2-acfd63c8797d', name: 'Thibaudeau Kayak Row (Cable)' },
  { id: '1a19b980-a624-4490-acc8-ac02fc3c0ac2', name: 'Tire Flip' },
  { id: 'ea1281ad-876d-4a1a-a9eb-920a556b8cfd', name: 'Tricep Kickback with Stork Stance (Dumbbell)' },
  { id: '91c9a78d-3991-447e-b311-fe0e1db1622b', name: 'Triceps Dip (Bench Leg)' },
  { id: 'c18f8b85-061d-4c81-a0a0-825a1cb608c3', name: 'Triceps Dip (Between Benches)' },
  { id: '12eeae5e-425b-425a-8cec-2821e7fb8c4b', name: 'Triceps Dip on High Parallel Bars (Weighted)' },
  { id: '51a0e093-9e7a-49a2-821b-908ed2d30a73', name: 'Triceps Pressdown [v-bar dupe]' },
  { id: '63465b3e-b812-4e8b-b346-cb62fa65547f', name: 'Triceps Pushdown (V Bar) (With Arm Blaster)' },
  { id: '99b34ad2-2851-48cc-820f-bf9c862fa103', name: 'Triceps Press' },
  { id: 'c3910347-d8a5-4f36-844a-725f0a1b311a', name: 'Twin Handle Parallel Grip Lat Pulldown (Cable)' },
  { id: 'e59a0b4e-506b-446c-8f0e-52ed062f5f62', name: 'Twisting Pull (Cable)' },
  { id: 'c423c417-bb8d-432b-ad08-098f6e496c4e', name: 'Twisting Overhead Press (Band)' },
  { id: '8064eb87-f030-4fc7-909a-3019d0ebe7ab', name: 'Two Arm Military Press (Kettlebell)' },
  { id: '302ab159-d963-43eb-b42d-b328385c624f', name: 'Two Legs Calf Raise (Band Under Both Legs)' },
  { id: '17e81193-9eff-492c-b234-177ae47b51c6', name: 'V Up (Band) [dupe]' },
  { id: '21d8aaf2-fdc0-4698-9c8a-76a0e31348e7', name: 'W Press (Dumbbell)' },
  { id: '439a0e6d-d6bb-484c-b85a-48d050068a27', name: 'Twisted Leg Raise [dupe]' },
  { id: '61618e5a-43da-461b-933c-2197f4dd4dfe', name: 'Wide Grip Bench Press (Smith Machine)' },
  { id: 'aa4ec35b-bde2-47ac-a3e8-a501285046ac', name: 'Wide Grip Chest Dip (Assisted)' },
  { id: '0018e762-5e55-478d-9c41-9e0cf665ee39', name: 'Wide Grip Rear Pull Up' },
  { id: '928d493f-12bf-4ca8-86a6-e4dc303f8f8d', name: 'Wide Grip Rear Pulldown Behind Neck (Cable)' },
  { id: '7b2da487-ebdf-4e6e-9534-ed91b6221ef5', name: 'Wide Grip Upright Row (Barbell)' },
  { id: 'fbbffb26-ed85-49a6-99f8-7e789a6040bf', name: 'Wide Pull Up' },
  { id: 'dae185e3-0d5f-4e12-8311-adec294b2468', name: 'Wide Reverse Grip Bench Press (Barbell)' },
  { id: 'af147747-3039-44f9-b092-30d4b4bcc372', name: 'Upright Row (Back POV)' },
  { id: '7c085769-df84-470b-8f4a-39524bb633b7', name: 'Upright Row (Barbell) [v2 dupe]' },
  { id: '249b13eb-1ccb-4e3a-bbb5-c31e6e08366c', name: 'Sled Push [dupe]' },
  { id: '2ab57b81-1e0a-45f0-b9e5-be49387db1fe', name: 'Svend Press' },
  { id: '2f79ea51-fd5c-4e4b-bcc6-1881cd843808', name: 'Power Point Plank' },
];

// ---------- Main ----------
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Exercise Deletion - ${DRY_RUN ? 'PREVIEW' : 'APPLY'} Mode`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Total exercises to delete: ${BIN_EXERCISES.length}\n`);

  if (DRY_RUN) {
    console.log('Exercises that will be deleted:\n');
    BIN_EXERCISES.forEach((ex, i) => {
      console.log(`  ${String(i + 1).padStart(3)}. ${ex.name}`);
      console.log(`       ID: ${ex.id}`);
    });
    console.log(`\nTotal: ${BIN_EXERCISES.length} exercises`);
    console.log('\nRun with --apply to delete these exercises.\n');
    return;
  }

  // Delete in batches of 20 to avoid URL length limits
  const BATCH_SIZE = 20;
  let deleted = 0;

  for (let i = 0; i < BIN_EXERCISES.length; i += BATCH_SIZE) {
    const batch = BIN_EXERCISES.slice(i, i + BATCH_SIZE);
    const ids = batch.map(ex => `"${ex.id}"`).join(',');
    const query = `id=in.(${ids})`;

    try {
      await supabaseDelete('exercises', query);
      deleted += batch.length;
      console.log(`  Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} exercises (${deleted}/${BIN_EXERCISES.length})`);
    } catch (err) {
      console.error(`  ERROR on batch ${Math.floor(i / BATCH_SIZE) + 1}:`, err.message);
      console.error('  Failed IDs:', batch.map(ex => ex.id));
    }
  }

  console.log(`\nDone! Deleted ${deleted} exercises.\n`);
}

main().catch(console.error);
