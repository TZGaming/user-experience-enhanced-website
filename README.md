# SnappThis

## Beschrijving
SnappThis is een app waarmee je groepen kan maken voor groepsleden, voor die groepen kan je snappmaps maken. In de snappmaps zitten foto's (ook wel **snapps** genoemd) die je kan liken, disliken of een ster kan geven. Ook hangen er tags aan de snapps waarmee je kan filteren. Ons doel is om de app om te zetten naar een **web-app**.

Hier is de live link naar de website op render: https://snappthis-tom.onrender.com

## Gebruik
Als je in een snappmap zit, dan kan je hier op de camera button klikken om vervolgens een foto te maken:

<img width="200" height="425" alt="localhost_8000_snappmaps_97814507-ec09-4abe-b3f1-13f7c236018f(iPhone_12_Pro)" src="https://github.com/user-attachments/assets/627f7200-e330-41be-89b7-94f9c6291399" />

Deze foto word dan geüpload naar Directus en dan zie je een loading state, meer daarover hieronder.

## Ontwerpkeuzes

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/8d23ce02-8072-43ae-a202-38edf2e9ae11" width="221" alt="image1"></td>
    <td><img src="https://github.com/user-attachments/assets/fd693dd2-8454-42ad-8eac-8726268fa2c9" width="221" alt="image2"></td>
  </tr>
</table>

Ik heb ervoor gekozen om de loading state in dezelfde popup te zetten als de success state, dan hoefde ik alleen maar de content in de popup zelf aan te passen. Er word een SVG laten zien die draait, zodat je kan zien dat hij bezig is met het uploaden van de foto. Uiteraard is deze SVG ook weer hun groene accent kleur (ook al is het contrast niet heel best).

Ook heb ik wat styling aanpassingen gedaan zoals de achtergrond van de popup een lichte tint van grijs maken zodat ik de box-shadow kon elimineren. Deze was namelijk wel lelijk en past niet goed bij hun design.

<table>
  <tr>
    <td>
     <p>Before</p>
     <img src="https://private-user-images.githubusercontent.com/82344380/572510531-487ed8f7-4dc6-4a5c-a586-602cba1c25c9.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzgzMjg3NDEsIm5iZiI6MTc3ODMyODQ0MSwicGF0aCI6Ii84MjM0NDM4MC81NzI1MTA1MzEtNDg3ZWQ4ZjctNGRjNi00YTVjLWE1ODYtNjAyY2JhMWMyNWM5LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjA1MDklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwNTA5VDEyMDcyMVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTljOTk5NTU0MTIzOTI1OWUxYTI5NzZiMDczMzNkZWFmMTVlNmY2MjM2YzhiODNmNzhjY2NiZjlhYjMwOGFjNzEmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.ZVEb9CDmH_JIVtVBqR4kidV-VxxhwWDArUjrQRKaTpQ" width="221" alt="image1">
    </td>
    <td>
     <p>After</p>
     <img src="https://github.com/user-attachments/assets/fd693dd2-8454-42ad-8eac-8726268fa2c9" width="221" alt="image2">
    </td>
  </tr>
</table>

Ik had die box-shadow juist toegevoegd omdat de witte achtergrond kleur anders blend met de witte achtergrond bij de snappmap. Het was daardoor niet makkelijk om ze te onderscheiden van elkaar.

## Kenmerken
Onze database is op dit moment een beetje traag door alle foto's die er in staan, het stoort erg maar er is niets wat kan helpen op dit moment. Maar alsnog kan je wel gewoon nog foto's uploaden, voor de uploads gebruik ik een library genaamd [Multer](https://www.npmjs.com/package/multer). Deze package is heel erg populair voor het uploaden van bestanden (blob). Deze handelt alle uploads voor de foto's en stuurt het naar de database in Directus. In het volgende kopje staat meer over hoe je dit installeert in het project.

https://github.com/TZGaming/user-experience-enhanced-website/blob/f60222d2e8062a77b2c17a3b9b6c364b89b3e902/server.js#L131-L214

Multer ontvangt het bestand van de form (de camera button zit in een form met submit event) en stuurt het het vervolgens naar Directus toe, en in de snappmap waar je in zit volgens de URL. Hij pakt namelijk de snappmap UUID uit de URL, elke snappmap heeft namelijk zo'n uniek ID omdat we allemaal besloten hadden om geen snappmap naam in de URL te zetten. We waren als groep namelijk bang dat er conflicten konden komen als er andere snappmaps bestonden met de exact zelfde naam, vandaar dat we voor het ID hebben gekozen inplaats van een slug.

Verder voor de loading state word dus de popup content aangepast en word de pagina niet standaard herladen met `event.preventDefault()`:

https://github.com/TZGaming/user-experience-enhanced-website/blob/f60222d2e8062a77b2c17a3b9b6c364b89b3e902/views/snappmap.liquid#L106-L146

Als de upload dan klaar is, dan refresht ook het foto grid zodat de nieuwe foto meteen te zien is:

https://github.com/TZGaming/user-experience-enhanced-website/blob/f60222d2e8062a77b2c17a3b9b6c364b89b3e902/views/snappmap.liquid#L83-L104

Hiermee word het oude grid vervangen met een nieuwe waar ook de nieuwe foto zojuist server-side is gefetched.

## Installatie
Om de website live te gebruiken moet je in de terminal eerst deze code invoeren om NodeJS te installeren:

`npm install`

Daarna moet je multer ook installeren, anders vind server.js de package niet en kan hij niet starten. Voer deze code in om multer te installeren:

`npm install multer`

Om de website live te kunnen bekijken vanuit een editor zoals VS Code, voer dan dit in:

`npm start`

Nu kan je vervolgens naar localhost:8000 gaan om de website live te kunnen bekijken.
