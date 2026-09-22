edit_agent_profile_screen.dart
File
Pasted text(20260922-173428).txt
Document
Account Settings

svg

svg

Guriup Jigjiga

Pro

Update your public information.

✓ Verified Entity

Display Name *

Agency / Business Name

Email Address

Phone Number

WhatsApp Number

City / Location

Agent Bio / Description

Specialties (Comma Separated)

Languages (Comma Separated)

Save Profile Changes

GuriUp LogoGuriUp.

The Horn of Africa’s premier digital real estate and hospitality ecosystem. We connect people with places through a seamless, secure, and trusted platform—making it easier to discover, book, buy, and invest with confidence.

svgsvgsvgsvg

Company
About Us
Careers
Our Team
Blog
Press
Explore
Properties
Hotels
Agents
Locations
Map View
Support

wha do i actlll need to add the web version edi tprofile tell me as text

Pasted text(20260922-174214).txt
Document
 dont touch anything else only remove hte exisitng edit tprofile and add the component file we created don ttoch anything else keep eveything else as is
👍
Pasted text(20260922-180948).txt
Document
20:57:22.179 Running build in Washington, D.C., USA (East) – iad1 
20:57:22.180 Build machine configuration: 2 cores, 8 GB 
20:57:22.340 Cloning github.com/Siciid09/guriupsite (Branch: main, Commit: ccf071f) 
20:57:23.034 Cloning completed: 694.000ms 
20:57:23.766 Restored build cache from previous deployment (BJMKHqFqV8fRePYCe411a6KGfq71) 
20:57:24.426 Running "vercel build" 
20:57:24.449 Vercel CLI 59.23.2 
20:57:25.092 Installing dependencies... 
20:57:26.933  
20:57:26.933 up to date in 1s 
20:57:26.934  
20:57:26.934 161 packages are looking for funding 
20:57:26.934   run npm fund for details 
20:57:26.936 npm warn allow-scripts 6 packages have install scripts not yet covered by allowScripts: 
20:57:26.936 npm warn allow-scripts   @firebase/util@1.15.3 (postinstall: node ./postinstall.js) 
20:57:26.937 npm warn allow-scripts   @tailwindcss/oxide@4.1.14 (postinstall: node ./scripts/install.js) 
20:57:26.937 npm warn allow-scripts   core-js@3.50.0 (postinstall: node -e "try{require('./postinstall')}catch(e){}") 
20:57:26.937 npm warn allow-scripts   protobufjs@7.5.4 (postinstall: node scripts/postinstall) 
20:57:26.937 npm warn allow-scripts   sharp@0.34.4 (install: node install/check.js) 
20:57:26.937 npm warn allow-scripts   unrs-resolver@1.11.1 (postinstall: napi-postinstall unrs-resolver 1.11.1 check) 
20:57:26.937 npm warn allow-scripts 
20:57:26.937 npm warn allow-scripts Run npm approve-scripts --allow-scripts-pending to review, or npm approve-scripts <pkg> to allow. 
20:57:27.002 Detected Next.js version: 16.1.6 
20:57:27.008 Running "npm run build" 
20:57:27.149  
20:57:27.149 > guriup-platform@0.1.0 build 
20:57:27.150 > next build --turbopack 
20:57:27.150  
20:57:28.881 ▲ Next.js 16.1.6 (Turbopack) 
20:57:28.882  
20:57:28.948   Creating an optimized production build ... 
20:58:07.626 ✓ Compiled successfully in 38.1s 
20:58:07.629   Running TypeScript ... 
20:58:25.195 Failed to compile. 
20:58:25.196  
20:58:25.196 ./src/app/(site)/dashboard/agent/page.tsx:670:18 
20:58:25.197 Type error: Argument of type 'AgentProfileData' is not assignable to parameter of type 'SetStateAction<Partial<AgentProfile>>'. 
20:58:25.197   Type 'AgentProfileData' is not assignable to type 'Partial<AgentProfile>'. 
20:58:25.197     Types of property 'planTier' are incompatible. 
20:58:25.197       Type 'string' is not assignable to type '"free" | "pro" | "premium" | "agent_pro" | undefined'. 
20:58:25.197  
20:58:25.198   668 |                  onSaved={(updatedProfile) => { 
20:58:25.198   669 |   setProfile(updatedProfile as AgentProfile); 
20:58:25.198 > 670 |   setProfileForm(updatedProfile); 
20:58:25.198       |                  ^ 
20:58:25.198   671 | }} 
20:58:25.198   672 |                  /> 
20:58:25.198   673 |                )} 
20:58:25.332 Next.js build worker exited with code: 1 and signal: null 
20:58:25.408 Error: Command "npm run build" exited with 1 how o fix this please 
Pasted text(20260922-181734).txt
Document
givee me this pdateed complete code with phooto upload option having firebase upload and read as i was doing before complee code updaed 
rror: <path> attribute d: Expected number, "…-.073-4.949-.073zm0 5.838c-3.403…".
pzzffthpcpqinwpmjlky.supabase.co/rest/v1/agents?_id=eq.5RW8tPis92P5eJSGQwJ1OfWQSkt1:1  Failed to load resource: the server responded with a status of 400 ()
3af822f88d80ec8f.js:1 Agent photo upload failed: Object
N @ 3af822f88d80ec8f.js:1
pzzffthpcpqinwpmjlky.supabase.co/rest/v1/agents?_id=eq.5RW8tPis92P5eJSGQwJ1OfWQSkt1&select=*:1  Failed to load resource: the server responded with a status of 400 ()
3af822f88d80ec8f.js:1 Agent profile update failed: Object
w @ 3af822f88d80ec8f.js:1
pzzffthpcpqinwpmjlky.supabase.co/rest/v1/agents?_id=eq.5RW8tPis92P5eJSGQwJ1OfWQSkt1&select=*:1  Failed to load resource: the server responded with a status of 400 ()
3af822f88d80ec8f.js:1 Agent profile update failed: Object
w @ 3af822f88d80ec8f.js:1 

Yes, I can see the error clearly. You don't need to send Firebase yet.

The important failure is this:

/rest/v1/agents?_id=eq.5RW8tPis92P5eJSGQwJ1OfWQSkt1
→ 400 Bad Request

That means the problem is occurring when EditAgentProfile.tsx tries to update/read the agents row in Supabase after the Firebase photo operation.

The SVG error is separate and isn't what is preventing the profile update.

What I need from you

Please send/upload the code that handles your agents Supabase data, OR, even better, send a screenshot/copy of the Supabase agents table columns.

If you have an API file such as:

/api/agents/...
agents.ts
agentService.ts
supabase.ts

send that.

Don't send Firebase yet.

I already have the EditAgentProfile.tsx version we created, so I'll compare the API/database fields against these fields being sent:

profileImageUrl
photoUrl
coverPhoto
lastUpdated

One of those—or the database update/query itself—is very likely causing the 400.

If you can send the agents API file + agents table schema, I can fix the exact problem rather than guessing.

Pasted text(20260922-185039).txt
Document

I found the problem from the data you uploaded.

Your agents table clearly contains profileImageUrl, coverPhoto, lastUpdated, ownerName, name, agencyName, email, phone, whatsappNumber, city, bio, specialties, languages, etc.

But the current EditAgentProfile.tsx sends additional fields such as:

displayName
secondaryPhone
professionalTitle
accountType
website
country
region
district
officeAddress
address
yearsOfExperience
services
serviceAreas
responseTime
availableForTours
acceptingClients
businessRegistrationNumber
certifications
facebook
instagram
tiktok
linkedin
businessHours
showPhone
showWhatsApp
showEmail
showAddress
showBusinessHours
photoUrl

Those are not present in the agents records you provided. The biggest immediate problem for the photo upload is photoUrl: your database data shows profileImageUrl but does not show a photoUrl column. For example, the Firebase URL is already stored directly in profileImageUrl.

So the fix

For the photo upload, do not send photoUrl to Supabase.

Change this:

await supabase
  .from('agents')
  .update({
    profileImageUrl: downloadUrl,
    photoUrl: downloadUrl,
    lastUpdated: new Date().toISOString(),
  })
  .eq('_id', form.uid);

to:

await supabase
  .from('agents')
  .update({
    profileImageUrl: downloadUrl,
    lastUpdated: new Date().toISOString(),
  })
  .eq('_id', form.uid);

And cover photo should remain:

await supabase
  .from('agents')
  .update({
    coverPhoto: downloadUrl,
    lastUpdated: new Date().toISOString(),
  })
  .eq('_id', form.uid);
But there's a second issue

Your Save Profile function is also sending many fields that don't appear in this database schema. The current payload explicitly includes all those extra fields.

So even after fixing photoUrl, pressing Save Profile can still produce another 400.

The safest fix is to make the web component update only the columns that actually exist in your agents table, while keeping the modern UI and Firebase photo upload.

Also, your existing data proves Firebase Storage is already being used successfully for agent profile images, e.g. profileImageUrl contains Firebase Storage URLs.

So don't send the Firebase file yet. The Firebase upload isn't the main problem. The Supabase payload/schema mismatch is.

Done. I updated the complete EditAgentProfile.tsx while keeping the existing UI and functionality.

Fixed
Firebase Storage profile photo upload
Firebase Storage cover photo upload
getDownloadURL() handling
Supabase profile image update → profileImageUrl
Supabase cover update → coverPhoto
Removed photoUrl from database writes
Removed unsupported fields from the main Supabase update payload
Keeps lastUpdated
Keeps existing form/UI structure
Keeps existing profile-photo URL fallback when reading data
2,633 lines complete

Download the complete updated file:

Download EditAgentProfile_fixed_complete.tsx

Replace your current:

src/components/EditAgentProfile.tsx

with this file and rename it to:

EditAgentProfile.tsx

The important change is that Supabase now receives only the agent fields supported by the agents structure instead of sending the extra fields that were causing the HTTP 400. 

EditAgentProfile_fixed_complete.tsx
Code
i said compleetlty no rrrros 22:19:19.348 Running build in Washington, D.C., USA (East) – iad1
22:19:19.349 Build machine configuration: 2 cores, 8 GB
22:19:19.514 Cloning github.com/Siciid09/guriupsite (Branch: main, Commit: d9bb215)
22:19:20.072 Cloning completed: 556.000ms
22:19:21.464 Restored build cache from previous deployment (CJGG4GTQ3fnqbqK7EeCudQ2tjwnQ)
22:19:22.160 Running "vercel build"
22:19:22.194 Vercel CLI 59.23.2
22:19:22.529 Installing dependencies...
22:19:25.094 
22:19:25.096 up to date in 2s
22:19:25.098 
22:19:25.098 161 packages are looking for funding
22:19:25.099   run npm fund for details
22:19:25.099 npm warn allow-scripts 6 packages have install scripts not yet covered by allowScripts:
22:19:25.099 npm warn allow-scripts   @firebase/util@1.15.3 (postinstall: node ./postinstall.js)
22:19:25.100 npm warn allow-scripts   @tailwindcss/oxide@4.1.14 (postinstall: node ./scripts/install.js)
22:19:25.100 npm warn allow-scripts   core-js@3.50.0 (postinstall: node -e "try{require('./postinstall')}catch(e){}")
22:19:25.100 npm warn allow-scripts   protobufjs@7.5.4 (postinstall: node scripts/postinstall)
22:19:25.100 npm warn allow-scripts   sharp@0.34.4 (install: node install/check.js)
22:19:25.101 npm warn allow-scripts   unrs-resolver@1.11.1 (postinstall: napi-postinstall unrs-resolver 1.11.1 check)
22:19:25.101 npm warn allow-scripts
22:19:25.102 npm warn allow-scripts Run npm approve-scripts --allow-scripts-pending to review, or npm approve-scripts <pkg> to allow.
22:19:25.178 Detected Next.js version: 16.1.6
22:19:25.194 Running "npm run build"
22:19:25.368 
22:19:25.369 > guriup-platform@0.1.0 build
22:19:25.369 > next build --turbopack
22:19:25.369 
22:19:26.738 ▲ Next.js 16.1.6 (Turbopack)
22:19:26.745 
22:19:26.815   Creating an optimized production build ...
22:20:02.458 
22:20:02.458 > Build error occurred
22:20:02.463 Error: Turbopack build failed with 1 errors:
22:20:02.463 ./src/app/api/agents/route.ts:810:7
22:20:02.463 Parsing ecmascript source code failed
22:20:02.463   808 |   return (
22:20:02.463   809 |     <div
22:20:02.464 > 810 |       className={min-h-screen bg-[#F8FAFC] ${className}}
22:20:02.464       |       ^^^^^^^^^
22:20:02.464   811 |     >
22:20:02.464   812 |       <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
22:20:02.464   813 |
22:20:02.464 
22:20:02.464 Expected '>', got 'ident'
22:20:02.464 
22:20:02.464 
22:20:02.464     at <unknown> (./src/app/api/agents/route.ts:810:7)
22:20:02.620 Error: Command "npm run build" exited with 1

You are correct. This Vercel error is not from the EditAgentProfile.tsx file anymore. The new build is failing because src/app/api/agents/route.ts contains React/JSX code.

Vercel is explicitly telling us:

./src/app/api/agents/route.ts:810:7
Parsing ecmascript source code failed

className={`min-h-screen bg-[#F8FAFC] ${className}`}
^^^^^^^^^

Expected '>', got 'ident'

That code belongs inside a React component such as EditAgentProfile.tsx, not inside an API route.

The source you supplied confirms that the JSX beginning around that section is the EditAgentProfile UI itself, including:

return (
  <div
    className={`min-h-screen bg-[#F8FAFC] ${className}`}
  >

So the problem is effectively:

❌ src/app/api/agents/route.ts
   └── React JSX accidentally placed here

instead of:

✅ src/app/api/agents/route.ts
   └── Next.js API handlers only

✅ src/components/EditAgentProfile.tsx
   └── React JSX/UI
Do NOT try to fix line 810

Do not change:

className={`min-h-screen bg-[#F8FAFC] ${className}`}

The JSX itself is valid.

The problem is the entire React component is in the wrong file.

What I need to give you the genuinely complete zero-parse-error replacement

I need the current src/app/api/agents/route.ts from your project—the exact file that produced this Vercel build.

The route.ts available in your previous files is a different hotel API route, so I will not replace your agents API with that unrelated hotel code.

Upload/paste:

src/app/api/agents/route.ts

exactly as it currently exists in your project, and I will return the complete corrected route.ts with:

no JSX in the API route
correct GET
correct POST if your current route has it
correct PATCH
correct agent update handling
correct _id handling
profileImageUrl
coverPhoto
lastUpdated
compatibility with the agents data structure you provided
no accidental photoUrl
no unrelated dashboard changes
Next.js 16-compatible syntax

And separately, your completed component remains:

Download the corrected EditAgentProfile_fixed_complete.tsx

The next error is specifically in src/app/api/agents/route.ts, so that is the file we must fix now.

EditAgentProfile_fixed_complete.tsx
Code
if you can find giv eme ehe exac route code i send as it was no changes as same as its  i icidently deleted

I searched the files you previously provided, but I cannot find the original src/app/api/agents/route.ts itself.

What I can recover exactly is that your saved material contains the agent database structure and the frontend calls, but not the complete original API route. I don't want to fabricate a “same as before” file and accidentally change your backend behavior.

I also found something important: the route.ts file currently available in your file history is a Hotels API route, not the Agents API route, so using it would be wrong.

What we know about your deleted route

Your frontend was working against:

/api/agents

and your agents table uses fields such as:

_id
name
ownerName
agencyName
email
phone
whatsappNumber
city
bio
specialties
languages
licenseNumber
profileImageUrl
coverPhoto
planTier
isVerified
agentVerified
status
uid
userid
lastUpdated
createdAt
...

The Vercel error also proves that at some point the contents of EditAgentProfile.tsx accidentally got appended/copied into src/app/api/agents/route.ts, because Vercel is seeing this React JSX inside the API route:

return (
  <div
    className={`min-h-screen bg-[#F8FAFC] ${className}`}
  >

That cannot exist in a .ts API route.

I don't want to lie to you

I cannot honestly give you the exact original route code word-for-word from the files currently available to me.

If you have the repository locally, the fastest way to recover the exact deleted version is Git itself. Since your Vercel log shows the previous commit:

d9bb215

run this inside your project:

git show d9bb215:src/app/api/agents/route.ts

If that outputs the original route, restore it with:

git checkout d9bb215 -- src/app/api/agents/route.ts

Then:

git add src/app/api/agents/route.ts
git commit -m "Restore agents API route"
git push origin main

Do not restore EditAgentProfile.tsx into the API route. The two files must remain separate.

If d9bb215 doesn't contain the route, run:

git log --all --oneline -- src/app/api/agents/route.ts

That will show the commits where that exact file existed. Then the original can be restored from the appropriate commit without me guessing or redesigning your API.

[
{
"_id": "2HnqIVMtmtbMaEs6JXM4THMOAbx2",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "bur",
"verifiedAt": null,
"agentVerified": false,
"bio": "waa goob ku haboon nasasho",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "2HnqIVMtmtbMaEs6JXM4THMOAbx2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "252634337669",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Yuusuf Jaamac",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocKrVR-MArIroyLTfC9PRs19RVjeyxHryfzbKbDO9xPI1raagZo=s96-c",
"email": "shamsulculuum123456@gmail.com",
"slug": "isha-waridaad",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "isha waridaad",
"phone": "252634337669",
"name": "isha waridaad",
"status": "active",
"lastUpdated": "2026-07-17 15:54:32.39+00",
"migratedAt": "2026-07-17 15:54:32.39+00",
"joinDate": "2026-07-17 15:54:32.39+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "5HSBV9Vj9BMsMhafC78nLEzhmc72",
"totalListings": 0,
"featured": false,
"isVerified": true,
"city": "b",
"verifiedAt": null,
"agentVerified": true,
"bio": "b",
"planTier": "pro",
"planExpiryDate": "2027-11-25T00:00:00.000Z",
"type": "reagent",
"userid": "5HSBV9Vj9BMsMhafC78nLEzhmc72",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "6",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Mubarik",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocKrYLyg1_D5UtOEY7LBCwfI7E8gV3YXC0ZLP_o7TTkCQ8CvpA=s96-c",
"email": "zamaier372@gmail.com",
"slug": "malaaki-sales",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "malaaki sales",
"phone": "9",
"name": "malaaki sales",
"status": "active",
"lastUpdated": "2026-07-25 10:08:08.243+00",
"migratedAt": "2026-07-25 10:08:08.243+00",
"joinDate": "2026-07-25 10:08:08.243+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "9l1mqk5QSxPKkdtHSfNu8gEaikD2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "Hargeisa",
"verifiedAt": null,
"agentVerified": false,
"bio": "hhhhh",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "9l1mqk5QSxPKkdtHSfNu8gEaikD2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "83453453",
"propertiesSold": null,
"specialties": null,
"ownerName": "nasa mubarik",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "https://firebasestorage.googleapis.com/v0/b/guriapp123.firebasestorage.app/o/agent_profiles%2F9l1mqk5QSxPKkdtHSfNu8gEaikD2_1780947291153?alt=media&token=5c99c6c9-40c1-4d17-8064-353c1d1fb1c4",
"email": "renacev990@aspensif.com",
"slug": "aasaas-real-estate",
"languages": null,
"coverPhoto": "",
"agencyName": "AASAAS REAL ESTATE",
"phone": "+25276625429",
"name": "AASAAS REAL ESTATE",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-06-08 19:35:00.432+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "AQacLUN8D0QbhE590ZxE4dk6sZs1",
"totalListings": 0,
"featured": true,
"isVerified": true,
"city": "Hargeisa",
"verifiedAt": "2026-02-18T16:11:15.677Z",
"agentVerified": true,
"bio": "",
"planTier": "pro",
"planExpiryDate": "2026-05-29T00:00:00.000Z",
"type": "reagent",
"userid": "AQacLUN8D0QbhE590ZxE4dk6sZs1",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "544444444",
"propertiesSold": 0,
"specialties": [
"Industrial"
],
"ownerName": "Sahan Property",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": true,
"profileImageUrl": "",
"email": "zamier374@Gmail.com",
"slug": "hush",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "AHLAN REAL ESTATE 3",
"phone": "633284",
"name": "AHLAN REAL ESTATE 3",
"status": "active",
"lastUpdated": "2026-02-18 13:04:37.986+00",
"migratedAt": "2026-02-18 13:04:37.986+00",
"joinDate": "2026-02-18 13:04:37.986+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "By4K0Or11JerGg5avrGHZ1JdyC42",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "dd",
"verifiedAt": null,
"agentVerified": false,
"bio": "xxx",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "By4K0Or11JerGg5avrGHZ1JdyC42",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "88",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Muparik bihi",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocIq7cI1WeSL33kqiGJz9gTnK2jJ9kYQkNetKke5MxLQO_vjDQ=s96-c",
"email": "muparikbihi@gmail.com",
"slug": "t_724",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "t",
"phone": "4",
"name": "t",
"status": "active",
"lastUpdated": "2026-02-23 17:44:05.22+00",
"migratedAt": "2026-02-23 17:44:05.22+00",
"joinDate": "2026-02-23 17:44:05.22+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "HUpmOSoxgKXjAjCL6Q4opxOmG9o1",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "",
"verifiedAt": null,
"agentVerified": false,
"bio": "",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "HUpmOSoxgKXjAjCL6Q4opxOmG9o1",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "",
"propertiesSold": null,
"specialties": null,
"ownerName": "muse",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "https://firebasestorage.googleapis.com/v0/b/guriapp123.firebasestorage.app/o/agent_profiles%2FHUpmOSoxgKXjAjCL6Q4opxOmG9o1_1780860184764?alt=media&token=6c89ef6c-955b-47f5-bc55-2fdb5c43ab0c",
"email": "zam88888@gmail.com",
"slug": "",
"languages": null,
"coverPhoto": "",
"agencyName": "",
"phone": "+252672073027",
"name": "",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-06-07 19:23:46.261+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "OlvXJ3LTnFfgg10NWY3mLGJUOpd2",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "burco",
"verifiedAt": null,
"agentVerified": false,
"bio": "h",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "OlvXJ3LTnFfgg10NWY3mLGJUOpd2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "639000146",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "GuriUp",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocImjymusZBxxW3LLqCZLktx1Uguj0Y3qzaQcN_dmG6q_RzEpQ=s96-c",
"email": "guriup.app@gmail.com",
"slug": "maamuus-real-estate",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "maamuus real estate",
"phone": "634006198",
"name": "maamuus real estate",
"status": "active",
"lastUpdated": "2026-06-07 19:09:45.909+00",
"migratedAt": "2026-06-07 19:09:45.909+00",
"joinDate": "2026-06-07 19:09:45.909+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "QMsAXi4Sa4fHVFzg7137kWaJdrg1",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "Hargeisa",
"verifiedAt": null,
"agentVerified": false,
"bio": "",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "QMsAXi4Sa4fHVFzg7137kWaJdrg1",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "3453453",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Mubaarik Osman",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://firebasestorage.googleapis.com/v0/b/guriapp123.firebasestorage.app/o/agent_profiles%2FQMsAXi4Sa4fHVFzg7137kWaJdrg1_profile_1771912273522.jpg?alt=media&token=d85e75b1-ec77-4fdf-bef4-7e30feb283c3",
"email": "info@hiigsch.com",
"slug": "ahlan",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "AHLAN",
"phone": "+2526773027",
"name": "AHLAN",
"status": "active",
"lastUpdated": "2026-02-24 05:51:19.847+00",
"migratedAt": "2026-02-24 05:51:19.847+00",
"joinDate": "2026-02-24 05:51:19.847+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "U8BliWhIvSOKSmVZ6AMXXSSdCnY2",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "mogadisho",
"verifiedAt": null,
"agentVerified": false,
"bio": "guri beec ah",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "U8BliWhIvSOKSmVZ6AMXXSSdCnY2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "687048068",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Agent",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "",
"email": "mubaarakmoha0@gmail.com",
"slug": "mubaarak",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "mubaarak",
"phone": "687048068",
"name": "mubaarak",
"status": "active",
"lastUpdated": "2026-05-01 01:01:06.363+00",
"migratedAt": "2026-05-01 01:01:06.363+00",
"joinDate": "2026-05-01 01:01:06.363+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "evY9LIxYQRNefLr8fCrExocMkEF3",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "Nairobi",
"verifiedAt": null,
"agentVerified": false,
"bio": "mony",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "evY9LIxYQRNefLr8fCrExocMkEF3",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "0741165715",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Abdinasir Mohamed",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ39URkP5PtUwd_KIaD6hH_jpsbYnLcfmZDoff9Pl2dUHS8aw=s96-c",
"email": "mabdinasir364@gmail.com",
"slug": "abdinasir",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "abdinasir",
"phone": "0741165715",
"name": "abdinasir",
"status": "active",
"lastUpdated": "2026-03-14 01:33:26.859+00",
"migratedAt": "2026-03-14 01:33:26.859+00",
"joinDate": "2026-03-14 01:33:26.859+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "lPnxApIO8Tgz3N865ZW8MtsauSU2",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "mogadishu",
"verifiedAt": null,
"agentVerified": false,
"bio": "K.p.p",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "lPnxApIO8Tgz3N865ZW8MtsauSU2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "+252615001811",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Abdulkadir Abdullahi",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "",
"email": "shirwacyare6666@gmail.com",
"slug": "khalud-travel-agency",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "Khalud Travel agency",
"phone": "+252615001811",
"name": "Khalud Travel agency",
"status": "active",
"lastUpdated": "2026-07-08 16:01:06.076+00",
"migratedAt": "2026-07-08 16:01:06.076+00",
"joinDate": "2026-07-08 16:01:06.076+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "p7YaKs9DFcYvWzxBvT5Y1T2AKNi2",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "mogadishu",
"verifiedAt": null,
"agentVerified": false,
"bio": "waaa guri aad loo nashqadeyey ka kooban 3 qol 2 suli daarad aad u mcan",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "p7YaKs9DFcYvWzxBvT5Y1T2AKNi2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "614619080",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Saalax Maxamed",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocI-w5mkgd6qHHY8bhU2EuYLNYg6eFOtB7lY-MApDdpxos1Xf6o=s96-c",
"email": "saalax88880@gmail.com",
"slug": "saalax88880@gmail.com",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "salah",
"phone": "614619080",
"name": "salah",
"status": "active",
"lastUpdated": "2026-07-09 22:31:53.594+00",
"migratedAt": "2026-07-09 22:31:53.594+00",
"joinDate": "2026-07-09 22:31:53.594+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "w6y9HLZ94De14l6dIJ0fY08nyPL2",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "67",
"verifiedAt": null,
"agentVerified": false,
"bio": "",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "w6y9HLZ94De14l6dIJ0fY08nyPL2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "3453453",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Mubarik Osman Abdirahman",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://firebasestorage.googleapis.com/v0/b/guriapp123.firebasestorage.app/o/agent_profiles%2Fw6y9HLZ94De14l6dIJ0fY08nyPL2_profile_1771912409714.jpg?alt=media&token=988540b4-5979-4826-ad81-c29d46137585",
"email": "info@hiigsiteh.com",
"slug": "hamaada-hotel",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "hamaada hotel",
"phone": "+2526332327084",
"name": "hamaada hotel",
"status": "active",
"lastUpdated": "2026-02-24 05:53:35.681+00",
"migratedAt": "2026-02-24 05:53:35.681+00",
"joinDate": "2026-02-24 05:53:35.681+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "wUGKzrKTZtMtUgh3cnHCviyO5bD3",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "deniile",
"verifiedAt": null,
"agentVerified": false,
"bio": "1",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "wUGKzrKTZtMtUgh3cnHCviyO5bD3",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "0612100338",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Ckriin shiq",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocLgf-dnAbxHncWlHjKeZ0NRrCaBBhpq2nAs3ZANYM9KxaeBJ5s=s96-c",
"email": "ckriinshiq@gmail.com",
"slug": "ckaiin-sh",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "ckaiin sh",
"phone": "0612100338",
"name": "ckaiin sh",
"status": "active",
"lastUpdated": "2026-07-12 12:38:13.56+00",
"migratedAt": "2026-07-12 12:38:13.56+00",
"joinDate": "2026-07-12 12:38:13.56+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"id": "zjpiJMioG0UOpHtEcBaZjxHvny12",
"totalListings": null,
"featured": true,
"isVerified": true,
"city": "Borama",
"verifiedAt": null,
"agentVerified": true,
"bio": "",
"planTier": "pro",
"planExpiryDate": "2029-08-24T00:00:00.000Z",
"type": "reagent",
"userid": "zjpiJMioG0UOpHtEcBaZjxHvny12",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "",
"propertiesSold": null,
"specialties": null,
"ownerName": "hamda real",
"averageRating": null,
"licenseNumber": null,
"isFeatured": true,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocJl0lx18USFTWU725x3RR6nH23mmeTgQU9ZxMd24opWcr71v8o=s96-c",
"email": "hannishow1@gmail.com",
"slug": "host-real-estate",
"languages": null,
"coverPhoto": "",
"agencyName": "Host Real Estate",
"phone": "+2527662542",
"name": "Host Real Estate",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-05-28 10:47:51.115+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "3TuOuRAhmJRa6y9N3DVxXBlRaW42",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "Hargeisa",
"verifiedAt": null,
"agentVerified": false,
"bio": "ok",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "3TuOuRAhmJRa6y9N3DVxXBlRaW42",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "0000000",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "najiib hassan",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "https://lh3.googleusercontent.com/a/ACg8ocKbi2YxDVnh5L0oceWyoy7PF4HYiU2dLJUpk43z6-9HI-ip0g=s96-c",
"email": "nacheiphassan@gmail.com",
"slug": "majod_632",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "majod",
"phone": "00000000",
"name": "majod",
"status": "banned",
"lastUpdated": "2026-02-22 10:10:02.543+00",
"migratedAt": "2026-02-22 10:10:02.543+00",
"joinDate": "2026-02-22 10:10:02.543+00",
"isBanned": true,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "ciZ7EiJiDwOw5Yy1CffV5v0KRXx2",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "ha",
"verifiedAt": null,
"agentVerified": false,
"bio": "",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "ciZ7EiJiDwOw5Yy1CffV5v0KRXx2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "5678",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Mubaarik Osman",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "",
"email": "nishow1@Gmail.com",
"slug": "ahlan-real-estate_h4e",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "AHLAN REAL ESTATE",
"phone": "456",
"name": "AHLAN REAL ESTATE",
"status": "banned",
"lastUpdated": "2026-02-20 18:26:19.822+00",
"migratedAt": "2026-02-20 18:26:19.822+00",
"joinDate": "2026-02-20 18:26:19.822+00",
"isBanned": true,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "xgL3yLwtQDfbnHf0DxVN67NUhY33",
"totalListings": 0,
"featured": false,
"isVerified": false,
"city": "67",
"verifiedAt": null,
"agentVerified": false,
"bio": "",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "xgL3yLwtQDfbnHf0DxVN67NUhY33",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "3453453",
"propertiesSold": 0,
"specialties": [
"Residential"
],
"ownerName": "Mubaarik Osman",
"averageRating": 0,
"licenseNumber": "PENDING",
"isFeatured": false,
"profileImageUrl": "",
"email": "mubariknasri9@Gmail.com",
"slug": "ahlan-real-estate_rnl",
"languages": [
"Somali",
"English"
],
"coverPhoto": "",
"agencyName": "AHLAN REAL ESTATE",
"phone": "653227084",
"name": "AHLAN REAL ESTATE",
"status": "banned",
"lastUpdated": "2026-02-20 18:28:24.795+00",
"migratedAt": "2026-02-20 18:28:24.795+00",
"joinDate": "2026-02-20 18:28:24.795+00",
"isBanned": true,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "kUjZVxREvzZr8cxAsyGQsUw4CzF2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "Hargeisa",
"verifiedAt": null,
"agentVerified": false,
"bio": "",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "kUjZVxREvzZr8cxAsyGQsUw4CzF2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "3453453",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "nasa mubarik",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "4tr7n@web-library.net",
"slug": "hamaada-houses",
"languages": null,
"coverPhoto": "",
"agencyName": "hamaada houses",
"phone": "+2527662542",
"name": "hamaada houses",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-04 17:50:56.277+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "iWS7YLbBFEgd7tfAd65mv2jerax2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "67",
"verifiedAt": null,
"agentVerified": false,
"bio": "m",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "iWS7YLbBFEgd7tfAd65mv2jerax2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "3453453",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "adf",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "wwvh2@web-library.net",
"slug": "hamaada-hotel",
"languages": null,
"coverPhoto": "",
"agencyName": "hamaada hotel",
"phone": "+25232232333",
"name": "hamaada hotel",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-04 21:00:41.568+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "MyApjQSXbgQM6pKaKf2T0p5UjOs2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "67",
"verifiedAt": null,
"agentVerified": false,
"bio": "",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "MyApjQSXbgQM6pKaKf2T0p5UjOs2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "3453453",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "aamin",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "vadrayaspa@necub.com",
"slug": "hamaada-hotel",
"languages": null,
"coverPhoto": "",
"agencyName": "hamaada hotel",
"phone": "+2522",
"name": "hamaada hotel",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-05 07:30:26.822+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "FovpdYyB9WYgdTN5xcH3UOUDLqA2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "Hargeisa",
"verifiedAt": null,
"agentVerified": false,
"bio": "j",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "FovpdYyB9WYgdTN5xcH3UOUDLqA2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "3453453",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "Mubaarik Osman",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "mari341@web-library.net",
"slug": "hamaada-hotel",
"languages": null,
"coverPhoto": "",
"agencyName": "hamaada hotel",
"phone": "+252653227084",
"name": "hamaada hotel",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-05 07:47:32.485+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "dWAleSzxCqcAx4RTYi5QXNLYGut1",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "67",
"verifiedAt": null,
"agentVerified": false,
"bio": "h",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "dWAleSzxCqcAx4RTYi5QXNLYGut1",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "567",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "nasa mubarik",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "mctxqx1368@minitts.net",
"slug": "ahlan-rent",
"languages": null,
"coverPhoto": "",
"agencyName": "AHLAN RENT",
"phone": "+2527662542",
"name": "AHLAN RENT",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-05 07:49:10.161+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "B5nc7WZLauVPr5vpe5nYFDsG8mB2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "wetrwe",
"verifiedAt": null,
"agentVerified": false,
"bio": "wet",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "B5nc7WZLauVPr5vpe5nYFDsG8mB2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "wet",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "sfsgs",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "ximqbs62408@2048unblocked.com",
"slug": "wet",
"languages": null,
"coverPhoto": "",
"agencyName": "wet",
"phone": "+252wetew",
"name": "wet",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-13 13:36:53.408+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "m5FEkovDNRhIrSZl6Kt1HW1RH1g2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "242423",
"verifiedAt": null,
"agentVerified": false,
"bio": "vjh",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "m5FEkovDNRhIrSZl6Kt1HW1RH1g2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "34533",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "123123",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "sobefa6989@playboot.com",
"slug": "sdssd",
"languages": null,
"coverPhoto": "",
"agencyName": "sdssd",
"phone": "+252233456",
"name": "sdssd",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-13 18:17:29.631+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "8uJ3MeD5AugCMOu8cIBus5icRNk2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "hargeisa",
"verifiedAt": null,
"agentVerified": false,
"bio": "2342",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "8uJ3MeD5AugCMOu8cIBus5icRNk2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "1233",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "Test Agent Jama",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "sarteruspa@necub.com",
"slug": "sahal-real-estate",
"languages": null,
"coverPhoto": "",
"agencyName": "Sahal Real Estate",
"phone": "+25262782222",
"name": "Sahal Real Estate",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-13 18:45:20.948+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "acth9AsY5LbnXtzqTjNQdNGAzkH3",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "ee",
"verifiedAt": null,
"agentVerified": false,
"bio": "n",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "acth9AsY5LbnXtzqTjNQdNGAzkH3",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "e",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "as",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "dudrusirda@necub.com",
"slug": "mattaan-homes",
"languages": null,
"coverPhoto": "",
"agencyName": "mattaan homes",
"phone": "+252e",
"name": "mattaan homes",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-14 19:34:37.72+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "azBBVfpQXqMazzj1OZX8capIkpA2",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "gaas",
"verifiedAt": null,
"agentVerified": false,
"bio": "sssssssssssssss",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "azBBVfpQXqMazzj1OZX8capIkpA2",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "ssss",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "mubarik",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "",
"email": "figoto6506@playboot.com",
"slug": "munasar-agnts",
"languages": null,
"coverPhoto": "",
"agencyName": "munasar agnts",
"phone": "+252657838788",
"name": "munasar agnts",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-16 05:58:04.582+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "agent-001",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Kigamboni",
"verifiedAt": null,
"agentVerified": null,
"bio": "Tanzania real estate market experts. Follow Instagram @abmcorealestate to learn all about Tanzania real estate market.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "ABM&Co. Real Estate Services",
"phone": "+255",
"name": "ABM&Co. Real Estate Services",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2026-08-19 04:21:03.608476+00"
},
{
"_id": "agent-002",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Dar Es Salaam",
"verifiedAt": null,
"agentVerified": null,
"bio": "Member since 2019. Trusted agent for Dar Es Salaam properties.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "Dalalimwanamke",
"phone": "xxx xxx xxx xxx",
"name": "Dalalimwanamke",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2019-01-01T00:00:00Z"
},
{
"_id": "agent-003",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Kitengela",
"verifiedAt": null,
"agentVerified": null,
"bio": "Expert in Athi River and Kitengela real estate market.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "PropScout Kenya",
"phone": "+254",
"name": "PropScout Agent",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2026-08-19 04:21:03.608476+00"
},
{
"_id": "11111111-1111-4111-a111-111111111111",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Kigamboni",
"verifiedAt": null,
"agentVerified": null,
"bio": "Tanzania real estate market experts. Follow Instagram @abmcorealestate to learn all about Tanzania real estate market.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "ABM&Co. Real Estate Services",
"phone": "+255",
"name": "ABM&Co. Real Estate Services",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2026-08-19T00:00:00.000Z"
},
{
"_id": "22222222-2222-4222-a222-222222222222",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Dar Es Salaam",
"verifiedAt": null,
"agentVerified": null,
"bio": "Member since 2019. Trusted agent for Dar Es Salaam properties.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "Dalalimwanamke",
"phone": "xxx xxx xxx xxx",
"name": "Dalalimwanamke",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2019-01-01T00:00:00.000Z"
},
{
"_id": "33333333-3333-4333-a333-333333333333",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Kitengela",
"verifiedAt": null,
"agentVerified": null,
"bio": "Expert in Athi River and Kitengela real estate market.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "PropScout Kenya",
"phone": "+254",
"name": "PropScout Agent",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2026-08-19T00:00:00.000Z"
},
{
"_id": "agent-id-abmco-real-estate-001",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Kigamboni",
"verifiedAt": null,
"agentVerified": null,
"bio": "Tanzania real estate market experts.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "ABM&Co. Real Estate Services",
"phone": "+255",
"name": "ABM&Co. Real Estate Services",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2026-08-19 12:00:00.000+00"
},
{
"_id": "agent-id-dalalimwanamke-002",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Dar Es Salaam",
"verifiedAt": null,
"agentVerified": null,
"bio": "Member since 2019. Trusted agent.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "Dalalimwanamke",
"phone": "xxx xxx xxx xxx",
"name": "Dalalimwanamke",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2026-08-19 12:00:00.000+00"
},
{
"_id": "agent-id-propscout-kenya-003",
"totalListings": 1,
"featured": null,
"isVerified": true,
"city": "Kitengela",
"verifiedAt": null,
"agentVerified": null,
"bio": "Expert in Athi River real estate.",
"planTier": null,
"planExpiryDate": null,
"type": null,
"userid": null,
"analytics": null,
"whatsappNumber": null,
"propertiesSold": null,
"specialties": null,
"ownerName": null,
"averageRating": null,
"licenseNumber": null,
"isFeatured": null,
"profileImageUrl": null,
"email": null,
"slug": null,
"languages": null,
"coverPhoto": null,
"agencyName": "PropScout Kenya",
"phone": "+254",
"name": "PropScout Agent",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": null,
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": "2026-08-19 12:00:00.000+00"
},
{
"_id": "T2y59bwrfBPaXYMZ8ZD7GQnQlJ12",
"totalListings": null,
"featured": false,
"isVerified": false,
"city": "Berbera",
"verifiedAt": null,
"agentVerified": false,
"bio": "Ku raadso guri si fudud",
"planTier": "free",
"planExpiryDate": null,
"type": "reagent",
"userid": "T2y59bwrfBPaXYMZ8ZD7GQnQlJ12",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "87859",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "mohamed yare",
"averageRating": null,
"licenseNumber": null,
"isFeatured": false,
"profileImageUrl": "https://firebasestorage.googleapis.com/v0/b/guriapp123.firebasestorage.app/o/agent_profiles%2F1787206183645_place9.jpg?alt=media&token=6b83747e-be31-4ce7-a8b5-1776cb7bb29c",
"email": "jehek88444@beiwoh.com",
"slug": "heemaal-real-estate",
"languages": null,
"coverPhoto": "https://firebasestorage.googleapis.com/v0/b/guriapp123.firebasestorage.app/o/agent_covers%2F1787206187450_place11.jpeg?alt=media&token=4d58ef63-eedd-41c2-a75a-bb956517acd7",
"agencyName": "Heemaal Real estate",
"phone": "+252672073027",
"name": "Heemaal Real estate",
"status": "active",
"lastUpdated": null,
"migratedAt": null,
"joinDate": "2026-08-20 06:09:51.647+00",
"isBanned": null,
"uid": null,
"businessName": null,
"createdAt": null
},
{
"_id": "5RW8tPis92P5eJSGQwJ1OfWQSkt1",
"totalListings": null,
"featured": true,
"isVerified": true,
"city": "Jigjiga",
"verifiedAt": null,
"agentVerified": true,
"bio": "Your Trusted Real Estate Agent in Jigjiga\n\nFind the right house, land, apartment, or commercial property in Jigjiga. We help clients buy, sell, and rent properties with reliable service and local market knowledge.\n\n🏠 Houses & Apartments\n🌍 Land & Plots\n🏢 Commercial Properties\n🤝 Buy • Sell • Rent",
"planTier": "pro",
"planExpiryDate": "2027-09-21",
"type": "reagent",
"userid": "5RW8tPis92P5eJSGQwJ1OfWQSkt1",
"analytics": {
"leads": 0,
"views": 0,
"clicks": 0
},
"whatsappNumber": "251951117167",
"propertiesSold": null,
"specialties": [
"Residential"
],
"ownerName": "Bashiir",
"averageRating": null,
"licenseNumber": null,
"isFeatured": true,
"profileImageUrl": "",
"email": "Muba2127@gmail.com",
"slug": "guriup-jigjiga",
"languages": null,
"coverPhoto": "",
"agencyName": "Guriup Jigjiga",
"phone": "+252251951117167",
"name": "Guriup Jigjiga",
"status": "active",
"lastUpdated": "2026-09-21 04:15:00.187654+00",
"migratedAt": null,
"joinDate": "2026-09-20 13:58:27.125+00",
"isBanned": false,
"uid": null,
"businessName": null,
"createdAt": null
}
]
