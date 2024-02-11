import { config } from "../config";



import NodeGeocoder from 'node-geocoder'
import { FileLogger } from "../utils/fileLogger";
import { isArray } from "lodash";
const { googleMap } = config
const logger = new FileLogger("geocoder")


const geocoder1 = NodeGeocoder({
  provider: "google",
  apiKey: googleMap.API_KEY
});
const geocoder2 = NodeGeocoder({
  provider: "opendatafrance",
});
const geocoder3 = NodeGeocoder({
  provider: "openstreetmap",
});
const geocoders = [
  geocoder1,
  geocoder2,
  geocoder3
]
export async function geocode(queries: string[] | string): Promise<Record<string, NodeGeocoder.Entry>> {
  let successMap: Record<string, NodeGeocoder.Entry> = {}
  let failed = isArray(queries) ? queries : [queries]
  for (const geocoder of geocoders) {
    let _failed = []
    try {
      const results = await geocoder.batchGeocode(failed)
      for (const idx in results) {
        const res = results[idx]
        const query = failed[idx]
        if (res.value && res.value[0]) {
          successMap[query] = res.value[0]
        } else {
          _failed.push(query)
        }
      }
      console.log("_failed.length", _failed.length);
      failed = _failed
    } catch (error) {
      logger.error(error);
    }
  }
  return successMap
}

