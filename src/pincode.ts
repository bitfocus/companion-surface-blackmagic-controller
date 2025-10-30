import { BlackmagicControllerModelId } from '@blackmagic-controller/node'
import { assertNever, type SurfacePincodeMap } from '@companion-surface/base'

export function generatePincodeMap(model: BlackmagicControllerModelId): SurfacePincodeMap | null {
	switch (model) {
		case BlackmagicControllerModelId.AtemMicroPanel: {
			return {
				type: 'single-page',
				pincode: null, // Not used
				0: 'preview10',
				1: 'preview1',
				2: 'preview2',
				3: 'preview3',
				4: 'preview4',
				5: 'preview5',
				6: 'preview6',
				7: 'preview7',
				8: 'preview8',
				9: 'preview9',
			}
		}
		case BlackmagicControllerModelId.DaVinciResolveSpeedEditor: {
			return {
				type: 'single-page',
				pincode: null, // Not used
				0: 'stop-play',
				1: 'cam1',
				2: 'cam2',
				3: 'cam3',
				4: 'cam4',
				5: 'cam5',
				6: 'cam6',
				7: 'cam7',
				8: 'cam8',
				9: 'cam9',
			}
		}
		case BlackmagicControllerModelId.DaVinciResolveReplayEditor:
			// Don't support pincode entry
			// TODO: should we support this?
			return {
				type: 'custom',
			}
		default:
			assertNever(model)
			return null
	}
}
