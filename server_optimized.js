import express from 'express'
import { Liquid } from 'liquidjs';
import multer from 'multer';


const app = express()

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.urlencoded({ extended: true }))

app.use(express.static('public'))

const engine = new Liquid();
app.engine('liquid', engine.express());

app.set('views', './views')


app.get('/', async function (request, response) {

  response.redirect('/groups')
})


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


app.get('/snappmaps', async function (request, response) {

  response.render('snappmaps.liquid', { groups: groupsJSON.data })
})


app.get('/snappmaps/:uuid', async function (request, response) {
  const snappmapResponse = await fetch('https://fdnd-agency.directus.app/items/snappthis_snapmap?fields=*.*.*.*&filter[uuid][_eq]=' + request.params.uuid);
  const snappmapJSON = await snappmapResponse.json();
  
  const snappmap = (snappmapJSON.data && snappmapJSON.data.length > 0) ? snappmapJSON.data[0] : null;

  const parentGroup = groupsJSON.data.find(group => 
    group.snappmap && group.snappmap.some(s => 
      s.snappthis_snapmap_uuid && s.snappthis_snapmap_uuid.uuid === request.params.uuid
    )
  );

  response.render('snappmap.liquid', { 
    snapmap: snappmap,
    groupName: parentGroup ? parentGroup.name : 'Geen groep gevonden',
    snappmaps: snappmap ? [snappmap] : []
  });
});


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

  response.render('snapp.liquid', { 
    snapp: snapp,
    snapmap: snappmap,
    groupName: parentGroup ? parentGroup.name : 'Geen groep gevonden',
    groups: groupsJSON.data
  });
});


app.post("/snappmaps/:uuid", upload.single("file"), async (req, res) => {

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    const snappmapuuid = req.params.uuid;
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append("file", blob, file.originalname);

    const uploadResponse = await fetch(
      "https://fdnd-agency.directus.app/files",
      {
        method: "POST",
        body: formData,
      }
    );

    const uploadResponseData = await uploadResponse.json();

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

    const snapResponse = await fetch(
      "https://fdnd-agency.directus.app/items/snappthis_snap",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSnap),
      }
    );

    const snapData = await snapResponse.json();

    console.log("Snap status:", snapResponse.status);
    console.log("Snap response:", snapData);

    if (snapResponse.ok) {
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
 

app.set('port', process.env.PORT || 8000)

app.listen(app.get('port'), function () {
  console.log(`Application started on http://localhost:${app.get('port')}`)
})