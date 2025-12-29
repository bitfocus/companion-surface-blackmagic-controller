import type { DiscoveredSurfaceInfo, OpenSurfaceResult, SurfaceContext, SurfacePlugin } from '@companion-surface/base'
import { generatePincodeMap } from './pincode.js'
import { BlackmagicControllerWrapper } from './instance.js'
import { createSurfaceSchema, createTransferVariables } from './surface-schema.js'
import {
	BlackmagicControllerDeviceInfo,
	getBlackmagicControllerDeviceInfo,
	openBlackmagicController,
	getBlackmagicControllerName,
} from '@blackmagic-controller/node'

const StreamDeckPlugin: SurfacePlugin<BlackmagicControllerDeviceInfo> = {
	init: async (): Promise<void> => {
		// Nothing to do
	},
	destroy: async (): Promise<void> => {
		// Nothing to do
	},

	checkSupportsHidDevice: (deviceInfo): DiscoveredSurfaceInfo<BlackmagicControllerDeviceInfo> | null => {
		const surfaceInfo = getBlackmagicControllerDeviceInfo(deviceInfo)
		if (!surfaceInfo || !surfaceInfo.serialNumber) return null

		return {
			surfaceId: `blackmagic:${surfaceInfo.serialNumber}`,
			description: getBlackmagicControllerName(surfaceInfo.model),
			pluginInfo: surfaceInfo,
		}
	},

	openSurface: async (
		surfaceId: string,
		pluginInfo: BlackmagicControllerDeviceInfo,
		context: SurfaceContext,
	): Promise<OpenSurfaceResult> => {
		const surface = await openBlackmagicController(pluginInfo.path)

		return {
			surface: new BlackmagicControllerWrapper(surfaceId, surface, context),
			registerProps: {
				brightness: false,
				surfaceLayout: createSurfaceSchema(surface),
				transferVariables: createTransferVariables(surface.MODEL),
				pincodeMap: generatePincodeMap(surface.MODEL),
				configFields: [],
				location: null,
			},
		}
	},
}
export default StreamDeckPlugin
