import { Router } from "express";

export let router = Router();
//file upload dependencies
import bodyParser from "body-parser";
import axios from "axios";

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

export class OSMRouter {
  static async getOSMPolygon(osm_id: string) {
    const url = new URL(`http://polygons.openstreetmap.fr/get_geojson.py?params=0`)
    url.searchParams.append("id", osm_id)
    const response = await axios.get(url.href)
    const polygon = response.data.geometries[0].coordinates[0][0]
    return polygon


  }
  static Route(): Router {
    let router: Router = Router();
    router.get('/polygons', async function (req, res, next) {
      try {

        const result = await OSMRouter.getOSMPolygon(req.query.id as string)
        res.send(result)
      } catch (error) {
        res.status(400).send(error)
      }
    });
    return router;
  }
}
