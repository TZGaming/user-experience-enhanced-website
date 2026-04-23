import express from 'express'
import { Liquid } from 'liquidjs';
import multer from 'multer';


// Maak een nieuwe Express applicatie aan, waarin we de server configureren
const app = express()

const upload = multer({ storage: multer.memoryStorage() });

// Maak werken met data uit formulieren iets prettiger
app.use(express.urlencoded({ extended: true }))

// Gebruik de map 'public' voor statische bestanden (resources zoals CSS, JavaScript, afbeeldingen en fonts)
// Bestanden in deze map kunnen dus door de browser gebruikt worden
app.use(express.static('public'))

// Stel Liquid in als 'view engine'
const engine = new Liquid();
app.engine('liquid', engine.express());

// Stel de map met Liquid templates in
// Let op: de browser kan deze bestanden niet rechtstreeks laden (zoals voorheen met HTML bestanden)
app.set('views', './views')

// Snapmaps
app.get('/', async function (request, response) {

  response.redirect('/groups')
})

// Groups
const groupsResponse = await fetch('https://fdnd-agency.directus.app/items/snappthis_group?fields=name,uuid,users,snappmap.snappthis_snapmap_uuid.*')
const groupsJSON = await groupsResponse.json()

app.get('/groups', async function (request, response) {

  response.render('groups.liquid', { groups: groupsJSON.data })
})

app.get('/groups/:uuid', async function (request, response) {
  const groupUuid = request.params.uuid

  const url = `https://fdnd-agency.directus.app/items/snappthis_group?filter[uuid][_eq]=${groupUuid}&fields=name,uuid,snappmap.snappthis_snapmap_uuid.*`
  
  const groupResponse = await fetch(url)
  const groupJSON = await groupResponse.json()

  const groupData = groupJSON.data[0]

  response.render('group-detail.liquid', { group: groupData })
})


// Snapmaps
app.get('/snappmaps', async function (request, response) {

  response.render('snappmaps.liquid', { groups: groupsJSON.data })
})

app.get('/snappmaps/:uuid', async function (request, response) {
  // Haal de snappmap op
  const snappmapResponse = await fetch('https://fdnd-agency.directus.app/items/snappthis_snapmap?fields=*.*.*.*&filter[uuid][_eq]=' + request.params.uuid);
  const snappmapJSON = await snappmapResponse.json();
  
  // Controleer of de data array bestaat en gevuld is
  const snappmap = (snappmapJSON.data && snappmapJSON.data.length > 0) ? snappmapJSON.data[0] : null;

  // Zoek de groep (beveiligd tegen null-pointer errors)
  const parentGroup = groupsJSON.data.find(group => 
    group.snappmap && group.snappmap.some(s => 
      s.snappthis_snapmap_uuid && s.snappthis_snapmap_uuid.uuid === request.params.uuid
    )
  );

  // Render: Geef 'snappmap' en 'groupName' mee
  response.render('snappmap.liquid', { 
    snapmap: snappmap,
    groupName: parentGroup ? parentGroup.name : 'Geen groep gevonden',
    snappmaps: snappmap ? [snappmap] : [] // Geef een lege lijst mee als snappmap null is
  });
});



// Snapps
app.get('/snapps/:location', async function (request, response) {

  const snappsResponse = await fetch('https://fdnd-agency.directus.app/items/snappthis_snap?fields=*.*&filter[location][_eq]=' + request.params.location)
  const snappsJSON = await snappsResponse.json()


  response.render('snappmap.liquid', { snapps: snappsJSON.data })
})

app.get('/snapps/snappmap/:uuid', async function (request, response) {
  const url = `https://fdnd-agency.directus.app/items/snappthis_snap?fields=*.*,actions.action&filter[uuid][_eq]=${request.params.uuid}`;
  const snappResponse = await fetch(url);
  const snappJSON = await snappResponse.json();
  const snapp = (snappJSON.data && snappJSON.data.length > 0) ? snappJSON.data[0] : null;

  if (!snapp) return response.status(404).send("Snap niet gevonden");

  let snappmap = null;
  const snapmapId = typeof snapp.snapmap === 'object' ? snapp.snapmap.uuid : snapp.snapmap;

  if (snapmapId) {
      const snappmapResponse = await fetch(`https://fdnd-agency.directus.app/items/snappthis_snapmap?fields=*.*.*.*&filter[uuid][_eq]=${snapmapId}`);
      const snappmapJSON = await snappmapResponse.json();
      
      if (snappmapJSON.data && Array.isArray(snappmapJSON.data) && snappmapJSON.data.length > 0) {
          snappmap = snappmapJSON.data[0];
      }
  }

  const parentGroup = groupsJSON.data.find(group => 
    group.snappmap && group.snappmap.some(s => 
      s.snappthis_snapmap_uuid && s.snappthis_snapmap_uuid.uuid === snapmapId
    )
  );

  // 4. Render
  response.render('snapp.liquid', { 
    snapp: snapp,
    snapmap: snappmap,
    groupName: parentGroup ? parentGroup.name : 'Geen groep gevonden',
    groups: groupsJSON.data
  });
});


// POST

app.post("/snappmaps/:uuid", upload.single("file"), async (req, res) => {

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    // Get uuid from route
    const snappmapuuid = req.params.uuid;

    // console.log("Snapmap UUID:", snappmapuuid);

    // Step 1: Upload file to Directus
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append("file", blob, file.originalname);

    const uploadResponse = await fetch(
      "https://fdnd-agency.directus.app/files",
      {
        method: "POST",
        body: formData,

        // 🔐 Uncomment if needed
        // headers: {
        //   Authorization: "Bearer YOUR_TOKEN",
        // },
      }
    );

    const uploadResponseData = await uploadResponse.json();

    // console.log("Upload status:", uploadResponse.status);
    // console.log("Upload response:", uploadResponseData);

    const imageId = uploadResponseData?.data?.id;

    if (!imageId) {
      return res.status(400).json({ 
        success: false, 
        message: "Upload failed: No file ID returned" 
      });
    }

    const newSnap = {
      location: "Heemskerk",
      snapmap: snappmapuuid,
      author: "ae56c4e4-e0a6-4e99-9790-88ecf9db9138",
      picture: imageId,
    };

    // console.log("Sending newSnap:", newSnap);

    const snapResponse = await fetch(
      "https://fdnd-agency.directus.app/items/snappthis_snap",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          // 🔐 Uncomment if needed
          // Authorization: "Bearer YOUR_TOKEN",
        },
        body: JSON.stringify(newSnap),
      }
    );

    const snapData = await snapResponse.json();

    console.log("Snap status:", snapResponse.status);
    console.log("Snap response:", snapData);

    if (snapResponse.ok) {
        // Stuur JSON terug zodat de client-side geen reload doet
        return res.json({ 
          success: true, 
          message: "Snap successfully created" 
        });
    }

    res.status(snapResponse.status).json({ 
      success: false, 
      message: "Failed to create snap",
      error: snapData 
    });

  } catch (err) {
    console.error("REAL ERROR:", err);

    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
});
 

// Stel het poortnummer in waar Express op moet gaan luisteren
// Lokaal is dit poort 8000, als dit ergens gehost wordt, is het waarschijnlijk poort 80
app.set('port', process.env.PORT || 8000)

// Start Express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get('port')}`)
})