# Drugcopoeia (دوايا)

A bilingual Arabic/English medicine reference for Egyptian medical staff: 25,070 medicines registered in Egypt, searchable by brand name, active ingredient or price. Conditions and lab tests, a pediatric dose calculator, a drug-interaction checker, a pregnancy & lactation reference, six medical calculators, study mode, barcode scanning, dose reminders, and a free on-device AI assistant that runs locally with no API keys, no CDN and no accounts.

مرجع دوائي عربي/إنجليزي لأفراد الطاقم الطبي في مصر: ٢٥٬٠٧٠ دواء مسجّل، بحث بالاسم التجاري أو المادة الفعالة أو السعر، حاسبات طبية، تفاعلات دوائية، الحمل والرضاعة، ومساعد ذكاء اصطناعي يعمل على الجهاز نفسه من غير حسابات ولا مفاتيح.

## Downloads

- Web app (runs in the browser, installable as a PWA): https://hussein-elnagmy.github.io/Drudcopeia/
- Android APK, Windows EXE, macOS DMG and the unsigned iOS build: [Releases](https://github.com/hussein-elnagmy/Drudcopeia/releases)

Windows and macOS builds are not code-signed yet (see the code signing policy below). On Windows click "More info" then "Run anyway"; on macOS right-click the app and choose "Open".

## Repository layout

- `Source/` — the full source tree (web app, Android, Windows, macOS, iOS, tests). `Source/README.md` documents the architecture; `Source/RELEASE-NOTES-r181.md` describes the current revision.
- `.github/workflows/2-build.yml` — builds all platforms from `Source/` on every push to `main` and runs the assistant test suite plus the privacy gate.
- `.github/workflows/pages.yml` — publishes `Source/www` to GitHub Pages.
- `PRIVACY.md` — human-readable privacy policy, enforced at build time by `Source/scripts/privacy-check.py`.
- `BUILD-INSTRUCTIONS.txt` — how to build locally.

## Code signing policy

- Free code signing provided by [SignPath.io](https://signpath.io), certificate by [SignPath Foundation](https://signpath.org/).
- Team roles and members: [@hussein-elnagmy](https://github.com/hussein-elnagmy) (Hussein El-Nagmy) — maintainer, committer, reviewer and release approver (solo project).
- All release binaries are built from the source in this repository by GitHub Actions, and every release is approved manually by the maintainer.
- Privacy policy: see [PRIVACY.md](PRIVACY.md). In short: the app is offline-first — medicine lookups, the assistant, reminders and calculators run entirely on the device; the only network calls are user-initiated (medicine news from WHO/FDA/PubMed, optional medicine photos from Wikimedia, and the optional one-time download of the on-device AI model from Hugging Face). No analytics, no accounts, no advertising.

## License

[GNU Affero General Public License v3.0](LICENSE).
