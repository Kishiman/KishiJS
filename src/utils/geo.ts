const Radius_equator = 6378
const Radius_Pole = 6357
export class GeoLib {
	static lerp(a: number, b: number, t: number) {
		return a * (1 - t) + b * t
	}
	static GetLocalRadius(latitude: number) {
		const radiusY = this.lerp(Radius_equator, Radius_Pole, Math.abs(latitude) / 90)
		const radiusX = Math.cos((latitude * Math.PI) / 180) * radiusY
		return [radiusX, radiusY]
	}
	static GetLocalKm2deg(latitude: number) {
		const [radiusX, radiusY] = this.GetLocalRadius(latitude)
		const km2degX = 180 / (Math.PI * radiusX)
		const km2degY = 180 / (Math.PI * radiusY)
		return [km2degX, km2degY]
	}
}
