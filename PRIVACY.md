# Dawaya privacy

Dawaya (Drugcopeia) is an offline-first medicine reference. This document is the
human-readable companion to `Source/privacy.config.json`, which the build-time gate
(`Source/scripts/privacy-check.py`) enforces: any drift between this document, the
configuration, and the code fails the build.

## Data flow

Medicine lookups, the assistant, reminders, calculators and the study tools run on the
device. Medicine data ships inside the app. The assistant answers from the medicine
database and from bundled clinical references; when the on-device model is installed it
runs locally, and when it is not, answers come from grounded smart search. Chat history
is stored on the device, encrypted at rest, and capped (50 turns per session, 30
sessions, 4000 characters per answer, 400 KB total); you can delete entries one at a
time.

Data not collected: no account, no analytics, no advertising identifiers, no crash
trackers, no location collection, and no sale or sharing of personal data with third
parties.

## Network

The app talks to the network only for user-initiated actions, and only to the hosts
allowlisted in `privacy.config.json`: the World Health Organization, the US FDA and
NCBI services for news and reference updates. The only other download is the optional
on-device assistant model, fetched once after you turn Offline mode off and press
Download, from the app's own GitHub release (`github.com`, which redirects to
`release-assets.githubusercontent.com` and `objects.githubusercontent.com`) or from
Hugging Face as a mirror, and checked against a pinned SHA-256 before use. On Windows
the model runs in a local helper that accepts requests only from the app itself
(Origin, Sec-Fetch-Site and Host checks). The content security policy has no inline
scripts, no wildcard GitHub host and no loopback entry, and the service worker caches
only complete same-origin responses. For pregnancy, breastfeeding, interaction, kidney,
child-dose and dose questions the assistant answers only from retrieved sources or says
it has no data. A runtime gate in `webapp/net.js` replaces `fetch`,
`XMLHttpRequest`, `WebSocket`, `EventSource` and `sendBeacon` so nothing else can leave
the device. An offline mode switch blocks even the allowlisted hosts. Reference links
(such as MedlinePlus, NHS, WHO, FDA, EDA, MoHP, DailyMed, PubMed, NCBI and doi.org)
are only ever opened, on a tap, in a separate browser view; the app never fetches,
preloads, frames or screenshots them and sends them no referrer.

## Permissions

Android: notifications, exact alarms and boot receiver (medicine reminders), camera
(barcode scanning and attaching a photo to an assistant question), microphone (voice
questions), vibration, and network state. iOS and macOS: camera, microphone and speech
recognition, each described in the app bundle's Info.plist with the exact strings
declared in `privacy.config.json`. Every capture is processed on the device.

## Data safety

For store listings: Data not collected. No personal or sensitive user data leaves the
device, no data is shared with third parties, and chat history is encrypted at rest.
Users can delete their assistant history at any time.

## Apple

On iOS and macOS the usage descriptions for camera, microphone and speech recognition
are the ones declared in `privacy.config.json`; the build fails if the bundled
Info.plist strings drift from them. No Apple sign-in, no iCloud sync, no App Tracking
Transparency prompt, because nothing is tracked.

## Delete

Assistant history can be deleted entry by entry inside the app. Removing the app
deletes everything it stored, including the downloaded model, reminders and history.
